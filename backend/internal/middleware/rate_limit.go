package middleware

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log/slog"
	"math"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
)

type RateLimitScope string

const (
	RateLimitScopeGlobal        RateLimitScope = "global"
	RateLimitScopeAuthenticated RateLimitScope = "authenticated"
)

type RateLimitPolicy struct {
	Name     string
	Requests int
	Window   time.Duration
}

type RateLimiter struct {
	logger *slog.Logger
	config config.RateLimitConfig
	now    func() time.Time

	mu      sync.Mutex
	buckets map[string]rateLimitBucket
}

type rateLimitBucket struct {
	WindowStart time.Time
	Count       int
}

type rateLimitDecision struct {
	Allowed    bool
	Policy     RateLimitPolicy
	KeyType    string
	KeyHash    string
	RetryAfter time.Duration
}

func NewRateLimiter(logger *slog.Logger, cfg config.RateLimitConfig) *RateLimiter {
	return newRateLimiter(logger, cfg, time.Now)
}

func newRateLimiter(logger *slog.Logger, cfg config.RateLimitConfig, now func() time.Time) *RateLimiter {
	if now == nil {
		now = time.Now
	}

	return &RateLimiter{
		logger:  logger,
		config:  cfg,
		now:     now,
		buckets: make(map[string]rateLimitBucket),
	}
}

func RateLimit(logger *slog.Logger, limiter *RateLimiter, scope RateLimitScope) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if limiter == nil || !limiter.config.Enabled {
				next.ServeHTTP(w, r)
				return
			}

			decision := limiter.allow(r, scope)
			if decision.Allowed {
				next.ServeHTTP(w, r)
				return
			}

			retryAfterSeconds := int(math.Ceil(decision.RetryAfter.Seconds()))
			if retryAfterSeconds < 1 {
				retryAfterSeconds = 1
			}

			w.Header().Set("Retry-After", fmt.Sprintf("%d", retryAfterSeconds))
			if logger != nil {
				logger.WarnContext(
					context.Background(),
					"rate limit exceeded",
					slog.String("request_id", GetRequestID(r.Context())),
					slog.String("method", r.Method),
					slog.String("path", r.URL.Path),
					slog.String("scope", string(scope)),
					slog.String("policy", decision.Policy.Name),
					slog.String("key_type", decision.KeyType),
					slog.String("key_hash", decision.KeyHash),
				)
			}

			response.Error(
				w,
				http.StatusTooManyRequests,
				"rate_limit_exceeded",
				"too many requests; please try again later",
				GetRequestID(r.Context()),
			)
		})
	}
}

func (l *RateLimiter) allow(r *http.Request, scope RateLimitScope) rateLimitDecision {
	policy := l.policyForRequest(r, scope)
	keyType, key := l.keyForRequest(r, scope)
	now := l.now().UTC()
	bucketKey := fmt.Sprintf("%s:%s:%s", policy.Name, keyType, key)

	l.mu.Lock()
	defer l.mu.Unlock()

	bucket := l.buckets[bucketKey]
	if bucket.WindowStart.IsZero() || now.Sub(bucket.WindowStart) >= policy.Window {
		bucket = rateLimitBucket{WindowStart: now}
	}

	bucket.Count++
	l.buckets[bucketKey] = bucket
	l.cleanupExpiredBucketsLocked(now)

	allowed := bucket.Count <= policy.Requests
	retryAfter := policy.Window - now.Sub(bucket.WindowStart)
	if retryAfter <= 0 {
		retryAfter = policy.Window
	}

	return rateLimitDecision{
		Allowed:    allowed,
		Policy:     policy,
		KeyType:    keyType,
		KeyHash:    hashRateLimitKey(key),
		RetryAfter: retryAfter,
	}
}

func (l *RateLimiter) policyForRequest(r *http.Request, scope RateLimitScope) RateLimitPolicy {
	path := normalizedRateLimitPath(r.URL.Path)

	if isWebhookRateLimitPath(path) {
		return RateLimitPolicy{Name: "webhook", Requests: l.config.WebhookRequests, Window: l.config.WebhookWindow}
	}

	if scope == RateLimitScopeAuthenticated {
		if isSensitiveRateLimitRoute(r.Method, path) {
			return RateLimitPolicy{Name: "sensitive", Requests: l.config.SensitiveRequests, Window: l.config.SensitiveWindow}
		}

		return RateLimitPolicy{Name: "authenticated", Requests: l.config.AuthenticatedRequests, Window: l.config.AuthenticatedWindow}
	}

	return RateLimitPolicy{Name: "global", Requests: l.config.GlobalRequests, Window: l.config.GlobalWindow}
}

func (l *RateLimiter) keyForRequest(r *http.Request, scope RateLimitScope) (string, string) {
	if scope == RateLimitScopeAuthenticated {
		if user, ok := GetAuthenticatedUser(r.Context()); ok && strings.TrimSpace(user.ID) != "" {
			return "user", strings.TrimSpace(user.ID)
		}
	}

	return "ip", clientIP(r, l.config.TrustProxyHeaders)
}

func (l *RateLimiter) cleanupExpiredBucketsLocked(now time.Time) {
	for key, bucket := range l.buckets {
		if bucket.WindowStart.IsZero() || now.Sub(bucket.WindowStart) > 2*l.maxWindow() {
			delete(l.buckets, key)
		}
	}
}

func (l *RateLimiter) maxWindow() time.Duration {
	maxWindow := l.config.GlobalWindow
	for _, window := range []time.Duration{
		l.config.AuthenticatedWindow,
		l.config.SensitiveWindow,
		l.config.WebhookWindow,
	} {
		if window > maxWindow {
			maxWindow = window
		}
	}

	return maxWindow
}

func normalizedRateLimitPath(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return "/"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	if strings.HasPrefix(path, "/v1/") {
		path = strings.TrimPrefix(path, "/v1")
	}
	if path == "/v1" {
		return "/"
	}

	return path
}

func isWebhookRateLimitPath(path string) bool {
	return strings.HasPrefix(path, "/webhooks/providers/")
}

func isSensitiveRateLimitRoute(method, path string) bool {
	method = strings.ToUpper(strings.TrimSpace(method))
	if method == http.MethodGet && path == "/auth/session" {
		return true
	}
	if method != http.MethodPost && method != http.MethodPatch {
		return false
	}

	switch {
	case method == http.MethodPatch && path == "/profile":
		return true
	case method == http.MethodPost && path == "/verification/identity":
		return true
	case method == http.MethodPost && path == "/recipients":
		return true
	case method == http.MethodPost && path == "/support/tickets":
		return true
	case method == http.MethodPost && strings.HasPrefix(path, "/support/tickets/") && strings.HasSuffix(path, "/messages"):
		return true
	case method == http.MethodPost && path == "/transactions/funding":
		return true
	case method == http.MethodPost && path == "/transactions/transfers":
		return true
	case method == http.MethodPost && path == "/transactions/payments":
		return true
	case method == http.MethodPost && strings.Contains(path, "/simulate/advance"):
		return true
	default:
		return false
	}
}

func clientIP(r *http.Request, trustProxyHeaders bool) string {
	if trustProxyHeaders {
		if forwardedFor := strings.TrimSpace(r.Header.Get("X-Forwarded-For")); forwardedFor != "" {
			parts := strings.Split(forwardedFor, ",")
			if ip := strings.TrimSpace(parts[0]); ip != "" {
				return ip
			}
		}
		if realIP := strings.TrimSpace(r.Header.Get("X-Real-IP")); realIP != "" {
			return realIP
		}
	}

	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	if remoteAddr := strings.TrimSpace(r.RemoteAddr); remoteAddr != "" {
		return remoteAddr
	}

	return "unknown"
}

func hashRateLimitKey(key string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(key)))
	return hex.EncodeToString(sum[:])[:16]
}
