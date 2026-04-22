package middleware

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestRateLimitRejectsAfterGlobalThreshold(t *testing.T) {
	now := time.Date(2026, 4, 22, 12, 0, 0, 0, time.UTC)
	limiter := newTestRateLimiter(testRateLimitConfig(), func() time.Time { return now })
	handler := RateLimit(testRateLimitLogger(), limiter, RateLimitScopeGlobal)(okHandler())

	for i := 0; i < 2; i++ {
		recorder := httptest.NewRecorder()
		handler.ServeHTTP(recorder, testRateLimitRequest(http.MethodGet, "/health", "198.51.100.10:9000", ""))
		if recorder.Code != http.StatusNoContent {
			t.Fatalf("request %d expected 204, got %d", i+1, recorder.Code)
		}
	}

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, testRateLimitRequest(http.MethodGet, "/health", "198.51.100.10:9000", ""))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 after threshold, got %d", recorder.Code)
	}
	if recorder.Header().Get("Retry-After") == "" {
		t.Fatal("expected Retry-After header")
	}

	now = now.Add(time.Minute)
	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, testRateLimitRequest(http.MethodGet, "/health", "198.51.100.10:9000", ""))
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected limiter window to reset, got %d", recorder.Code)
	}
}

func TestRateLimitUsesSensitivePolicyForTransactionCreation(t *testing.T) {
	limiter := newTestRateLimiter(testRateLimitConfig(), time.Now)
	handler := RateLimit(testRateLimitLogger(), limiter, RateLimitScopeAuthenticated)(okHandler())
	user := model.AuthenticatedUser{ID: "user_123"}

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, withRateLimitUser(testRateLimitRequest(http.MethodPost, "/v1/transactions/payments", "198.51.100.20:9000", ""), user))
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected first sensitive request to pass, got %d", recorder.Code)
	}

	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, withRateLimitUser(testRateLimitRequest(http.MethodPost, "/v1/transactions/payments", "198.51.100.20:9000", ""), user))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected sensitive route to hit stricter threshold, got %d", recorder.Code)
	}
}

func TestRateLimitAuthenticatedScopeUsesUserKey(t *testing.T) {
	cfg := testRateLimitConfig()
	cfg.AuthenticatedRequests = 1
	cfg.SensitiveRequests = 10

	limiter := newTestRateLimiter(cfg, time.Now)
	handler := RateLimit(testRateLimitLogger(), limiter, RateLimitScopeAuthenticated)(okHandler())

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, withRateLimitUser(testRateLimitRequest(http.MethodGet, "/v1/profile", "198.51.100.30:9000", ""), model.AuthenticatedUser{ID: "user_a"}))
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected first user request to pass, got %d", recorder.Code)
	}

	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, withRateLimitUser(testRateLimitRequest(http.MethodGet, "/v1/profile", "198.51.100.30:9000", ""), model.AuthenticatedUser{ID: "user_b"}))
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected different authenticated user on same IP to pass, got %d", recorder.Code)
	}

	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, withRateLimitUser(testRateLimitRequest(http.MethodGet, "/v1/profile", "198.51.100.30:9000", ""), model.AuthenticatedUser{ID: "user_a"}))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected repeated same user to be limited, got %d", recorder.Code)
	}
}

func TestRateLimitUsesWebhookPolicyForPublicWebhookRoutes(t *testing.T) {
	limiter := newTestRateLimiter(testRateLimitConfig(), time.Now)
	handler := RateLimit(testRateLimitLogger(), limiter, RateLimitScopeGlobal)(okHandler())

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, testRateLimitRequest(http.MethodPost, "/webhooks/providers/sandboxpay", "198.51.100.40:9000", ""))
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected first webhook request to pass, got %d", recorder.Code)
	}

	recorder = httptest.NewRecorder()
	handler.ServeHTTP(recorder, testRateLimitRequest(http.MethodPost, "/webhooks/providers/sandboxpay", "198.51.100.40:9000", ""))
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected webhook route to use stricter threshold, got %d", recorder.Code)
	}
}

func okHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
}

func testRateLimitConfig() config.RateLimitConfig {
	return config.RateLimitConfig{
		Enabled:               true,
		GlobalRequests:        2,
		GlobalWindow:          time.Minute,
		AuthenticatedRequests: 5,
		AuthenticatedWindow:   time.Minute,
		SensitiveRequests:     1,
		SensitiveWindow:       time.Minute,
		WebhookRequests:       1,
		WebhookWindow:         time.Minute,
	}
}

func newTestRateLimiter(cfg config.RateLimitConfig, now func() time.Time) *RateLimiter {
	return newRateLimiter(testRateLimitLogger(), cfg, now)
}

func testRateLimitLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}

func testRateLimitRequest(method, path, remoteAddr, forwardedFor string) *http.Request {
	request := httptest.NewRequest(method, path, nil)
	request.RemoteAddr = remoteAddr
	if forwardedFor != "" {
		request.Header.Set("X-Forwarded-For", forwardedFor)
	}

	return request
}

func withRateLimitUser(request *http.Request, user model.AuthenticatedUser) *http.Request {
	return request.WithContext(WithAuthenticatedUser(context.Background(), user))
}
