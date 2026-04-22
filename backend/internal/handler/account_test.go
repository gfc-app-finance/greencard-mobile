package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeAccountService struct {
	getAccount func(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error)
}

func (fakeAccountService) ListAccounts(ctx context.Context, user model.AuthenticatedUser) (model.AccountListResponse, error) {
	return model.AccountListResponse{}, nil
}

func (f fakeAccountService) GetAccount(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error) {
	return f.getAccount(ctx, user, accountID)
}

func TestAccountHandlerGetReturnsNotFound(t *testing.T) {
	handler := NewAccountHandler(testLogger(), fakeAccountService{
		getAccount: func(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error) {
			return model.AccountDetailResponse{}, service.ErrAccountNotFound
		},
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/accounts/acct_missing", nil)
	request.SetPathValue("id", "acct_missing")
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.Get(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}

	var payload response.ErrorEnvelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected JSON error payload, got %v", err)
	}

	if payload.Error.Code != "account_not_found" {
		t.Fatalf("expected account_not_found code, got %q", payload.Error.Code)
	}
}

func TestAccountHandlerGetReturnsServiceUnavailable(t *testing.T) {
	handler := NewAccountHandler(testLogger(), fakeAccountService{
		getAccount: func(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error) {
			return model.AccountDetailResponse{}, service.ErrAccountsUnavailable
		},
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/accounts/acct_123", nil)
	request.SetPathValue("id", "acct_123")
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.Get(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", recorder.Code)
	}
}
