package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeRecipientService struct {
	createRecipient func(ctx context.Context, user model.AuthenticatedUser, input model.CreateRecipientInput) (model.RecipientResponse, error)
	getRecipient    func(ctx context.Context, user model.AuthenticatedUser, recipientID string) (model.RecipientResponse, error)
}

func (f fakeRecipientService) CreateRecipient(ctx context.Context, user model.AuthenticatedUser, input model.CreateRecipientInput) (model.RecipientResponse, error) {
	return f.createRecipient(ctx, user, input)
}

func (fakeRecipientService) ListRecipients(ctx context.Context, user model.AuthenticatedUser) (model.RecipientListResponse, error) {
	return model.RecipientListResponse{}, nil
}

func (f fakeRecipientService) GetRecipient(ctx context.Context, user model.AuthenticatedUser, recipientID string) (model.RecipientResponse, error) {
	if f.getRecipient != nil {
		return f.getRecipient(ctx, user, recipientID)
	}

	return model.RecipientResponse{}, nil
}

func TestRecipientHandlerCreateReturnsForbidden(t *testing.T) {
	handler := NewRecipientHandler(testLogger(), fakeRecipientService{
		createRecipient: func(ctx context.Context, user model.AuthenticatedUser, input model.CreateRecipientInput) (model.RecipientResponse, error) {
			return model.RecipientResponse{}, service.ErrRecipientPermissionDenied
		},
	})

	request := httptest.NewRequest(http.MethodPost, "/v1/recipients", strings.NewReader(`{"type":"bank","full_name":"Jane Doe","bank_name":"Providus","account_number":"1234567890","country":"Nigeria","currency":"NGN"}`))
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.Create(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

func TestRecipientHandlerGetReturnsNotFound(t *testing.T) {
	handler := NewRecipientHandler(testLogger(), fakeRecipientService{
		getRecipient: func(ctx context.Context, user model.AuthenticatedUser, recipientID string) (model.RecipientResponse, error) {
			return model.RecipientResponse{}, service.ErrRecipientNotFound
		},
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/recipients/recipient_missing", nil)
	request.SetPathValue("id", "recipient_missing")
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

	if payload.Error.Code != "recipient_not_found" {
		t.Fatalf("expected recipient_not_found code, got %q", payload.Error.Code)
	}
}
