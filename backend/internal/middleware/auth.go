package middleware

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

func RequireAuth(logger *slog.Logger, authService service.AuthService) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := authService.Authenticate(r.Context(), r.Header.Get("Authorization"))
			if err != nil {
				writeAuthError(logger, w, r, err)
				return
			}

			ctx := WithAuthenticatedUser(r.Context(), user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func writeAuthError(logger *slog.Logger, w http.ResponseWriter, r *http.Request, err error) {
	requestID := GetRequestID(r.Context())

	switch {
	case errors.Is(err, service.ErrAuthenticationRequired):
		logger.Warn("authentication failed", slog.String("request_id", requestID), slog.String("path", r.URL.Path))
		response.Error(w, http.StatusUnauthorized, "authentication_required", "a valid Supabase access token is required", requestID)
	case errors.Is(err, service.ErrInsufficientAuthContext):
		logger.Warn("authorization failed", slog.String("request_id", requestID), slog.String("path", r.URL.Path))
		response.Error(w, http.StatusForbidden, "insufficient_auth_context", "the provided token does not have access to this resource", requestID)
	default:
		logger.Error("auth verification unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "auth_verification_unavailable", "authentication verification is temporarily unavailable", requestID)
	}
}
