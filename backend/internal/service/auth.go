package service

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrMissingAuthorizationHeader = errors.New("missing authorization header")
	ErrMalformedAuthorization     = errors.New("malformed authorization header")
	ErrInvalidAccessToken         = errors.New("invalid access token")
	ErrAuthenticationRequired     = errors.New("authentication required")
	ErrInsufficientAuthContext    = errors.New("insufficient auth context")
	ErrAuthConfiguration          = errors.New("auth configuration error")
	ErrAuthUnavailable            = errors.New("auth verification unavailable")
	errRemoteValidationRequired   = errors.New("remote validation required")
)

type AuthService interface {
	Authenticate(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error)
}

type SupabaseAuthService struct {
	logger *slog.Logger
	config config.SupabaseConfig
	client *http.Client
	cache  *jwksCache
}

type supabaseClaims struct {
	jwt.RegisteredClaims
	Role        string `json:"role"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	SessionID   string `json:"session_id"`
	AAL         string `json:"aal"`
	IsAnonymous bool   `json:"is_anonymous"`
}

func NewSupabaseAuthService(logger *slog.Logger, cfg config.SupabaseConfig) AuthService {
	return &SupabaseAuthService{
		logger: logger,
		config: cfg,
		client: &http.Client{Timeout: cfg.AuthTimeout},
		cache:  newJWKSCache(cfg.JWKSCacheTTL),
	}
}

func ExtractBearerToken(authorizationHeader string) (string, error) {
	raw := strings.TrimSpace(authorizationHeader)
	if raw == "" {
		return "", ErrMissingAuthorizationHeader
	}

	parts := strings.Fields(raw)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", ErrMalformedAuthorization
	}

	if strings.TrimSpace(parts[1]) == "" {
		return "", ErrMalformedAuthorization
	}

	return parts[1], nil
}

func (s *SupabaseAuthService) Authenticate(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
	token, err := ExtractBearerToken(authorizationHeader)
	if err != nil {
		return model.AuthenticatedUser{}, ErrAuthenticationRequired
	}

	claims, algorithm, err := parseUnverifiedClaims(token)
	if err != nil {
		return model.AuthenticatedUser{}, ErrInvalidAccessToken
	}

	if shouldUseRemoteValidation(algorithm) {
		return s.authenticateWithRemoteValidation(ctx, token, claims)
	}

	user, err := s.authenticateWithJWKS(ctx, token)
	if err == nil {
		return user, nil
	}

	if errors.Is(err, errRemoteValidationRequired) {
		return s.authenticateWithRemoteValidation(ctx, token, claims)
	}

	return model.AuthenticatedUser{}, err
}

func (s *SupabaseAuthService) authenticateWithJWKS(ctx context.Context, token string) (model.AuthenticatedUser, error) {
	parser := jwt.NewParser(
		jwt.WithIssuer(s.config.Issuer),
		jwt.WithLeeway(5*time.Second),
		jwt.WithValidMethods([]string{"RS256", "ES256", "EdDSA"}),
	)

	claims := &supabaseClaims{}
	parsedToken, err := parser.ParseWithClaims(token, claims, func(parsedToken *jwt.Token) (any, error) {
		keyID, _ := parsedToken.Header["kid"].(string)
		return s.cache.GetKey(ctx, s.client, s.config.JWKSURL, keyID)
	})
	if err != nil || parsedToken == nil || !parsedToken.Valid {
		if errors.Is(err, errRemoteValidationRequired) {
			return model.AuthenticatedUser{}, errRemoteValidationRequired
		}

		return model.AuthenticatedUser{}, ErrInvalidAccessToken
	}

	if err := validateAuthenticatedClaims(claims, s.config.Issuer); err != nil {
		return model.AuthenticatedUser{}, err
	}

	return claims.toAuthenticatedUser(), nil
}

func (s *SupabaseAuthService) authenticateWithRemoteValidation(ctx context.Context, token string, claims *supabaseClaims) (model.AuthenticatedUser, error) {
	apiKey := s.config.PublishableKey
	if apiKey == "" {
		apiKey = s.config.ServiceRoleKey
	}

	if apiKey == "" {
		return model.AuthenticatedUser{}, ErrAuthConfiguration
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, s.config.UserInfoURL, nil)
	if err != nil {
		return model.AuthenticatedUser{}, ErrAuthUnavailable
	}

	request.Header.Set("apikey", apiKey)
	request.Header.Set("Authorization", "Bearer "+token)

	response, err := s.client.Do(request)
	if err != nil {
		s.logger.Error("supabase auth introspection failed", slog.String("error", err.Error()))
		return model.AuthenticatedUser{}, ErrAuthUnavailable
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, response.Body)
		return model.AuthenticatedUser{}, ErrInvalidAccessToken
	}

	if err := consumeJSON(response.Body); err != nil {
		return model.AuthenticatedUser{}, ErrAuthUnavailable
	}

	if err := validateAuthenticatedClaims(claims, s.config.Issuer); err != nil {
		return model.AuthenticatedUser{}, err
	}

	return claims.toAuthenticatedUser(), nil
}

func parseUnverifiedClaims(token string) (*supabaseClaims, string, error) {
	claims := &supabaseClaims{}
	parsedToken, _, err := jwt.NewParser().ParseUnverified(token, claims)
	if err != nil || parsedToken == nil {
		return nil, "", err
	}

	algorithm, _ := parsedToken.Header["alg"].(string)
	return claims, strings.ToUpper(strings.TrimSpace(algorithm)), nil
}

func shouldUseRemoteValidation(algorithm string) bool {
	return algorithm == "" || algorithm == "HS256"
}

func validateAuthenticatedClaims(claims *supabaseClaims, expectedIssuer string) error {
	if claims == nil {
		return ErrInvalidAccessToken
	}

	if strings.TrimSpace(claims.Subject) == "" {
		return ErrInvalidAccessToken
	}

	if !strings.EqualFold(strings.TrimSpace(claims.Issuer), strings.TrimSpace(expectedIssuer)) {
		return ErrInvalidAccessToken
	}

	if !containsAudience(claims.Audience, "authenticated") {
		return ErrInsufficientAuthContext
	}

	if claims.Role != "authenticated" {
		return ErrInsufficientAuthContext
	}

	return nil
}

func containsAudience(audience jwt.ClaimStrings, expected string) bool {
	for _, value := range audience {
		if value == expected {
			return true
		}
	}

	return false
}

func consumeJSON(reader io.Reader) error {
	var payload map[string]any
	return json.NewDecoder(reader).Decode(&payload)
}

func (c *supabaseClaims) toAuthenticatedUser() model.AuthenticatedUser {
	return model.AuthenticatedUser{
		ID:          c.Subject,
		Email:       c.Email,
		Phone:       c.Phone,
		Role:        c.Role,
		SessionID:   c.SessionID,
		AAL:         c.AAL,
		IsAnonymous: c.IsAnonymous,
	}
}
