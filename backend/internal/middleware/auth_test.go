package middleware

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeAuthService struct {
	authenticate func(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error)
}

func (f fakeAuthService) Authenticate(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
	return f.authenticate(ctx, authorizationHeader)
}

func TestRequireAuthRejectsUnauthorizedRequests(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	request := httptest.NewRequest(http.MethodGet, "/v1/profile", nil)
	recorder := httptest.NewRecorder()

	RequireAuth(logger, fakeAuthService{
		authenticate: func(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
			return model.AuthenticatedUser{}, service.ErrAuthenticationRequired
		},
	})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", recorder.Code)
	}
}

func TestRequireAuthInjectsAuthenticatedUser(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	handler := RequireAuth(logger, fakeAuthService{
		authenticate: func(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
			return model.AuthenticatedUser{ID: "user_123"}, nil
		},
	})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := GetAuthenticatedUser(r.Context())
		if !ok || user.ID != "user_123" {
			t.Fatalf("expected authenticated user in request context, got %#v", user)
		}
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodGet, "/v1/profile", nil)
	request.Header.Set("Authorization", "Bearer token")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", recorder.Code)
	}
}

func TestRequireAuthRejectsInsufficientContext(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	handler := RequireAuth(logger, fakeAuthService{
		authenticate: func(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
			return model.AuthenticatedUser{}, service.ErrInsufficientAuthContext
		},
	})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not execute for insufficient auth context")
	}))

	request := httptest.NewRequest(http.MethodGet, "/v1/profile", nil)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

func TestRequireAuthReturnsServiceUnavailableWhenVerifierFails(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	handler := RequireAuth(logger, fakeAuthService{
		authenticate: func(ctx context.Context, authorizationHeader string) (model.AuthenticatedUser, error) {
			return model.AuthenticatedUser{}, errors.New("network down")
		},
	})(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("handler should not execute when verifier fails")
	}))

	request := httptest.NewRequest(http.MethodGet, "/v1/profile", nil)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", recorder.Code)
	}
}
