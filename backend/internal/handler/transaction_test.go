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

type fakeTransactionService struct {
	createFunding func(ctx context.Context, user model.AuthenticatedUser, input model.CreateFundingTransactionInput) (model.FundingTransactionResponse, error)
}

func (f fakeTransactionService) CreateFunding(ctx context.Context, user model.AuthenticatedUser, input model.CreateFundingTransactionInput) (model.FundingTransactionResponse, error) {
	return f.createFunding(ctx, user, input)
}

func (fakeTransactionService) ListFunding(ctx context.Context, user model.AuthenticatedUser) (model.FundingTransactionListResponse, error) {
	return model.FundingTransactionListResponse{}, nil
}

func (fakeTransactionService) GetFunding(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.FundingTransactionResponse, error) {
	return model.FundingTransactionResponse{}, nil
}

func (fakeTransactionService) CreateTransfer(ctx context.Context, user model.AuthenticatedUser, input model.CreateTransferTransactionInput) (model.TransferTransactionResponse, error) {
	return model.TransferTransactionResponse{}, nil
}

func (fakeTransactionService) ListTransfers(ctx context.Context, user model.AuthenticatedUser) (model.TransferTransactionListResponse, error) {
	return model.TransferTransactionListResponse{}, nil
}

func (fakeTransactionService) GetTransfer(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.TransferTransactionResponse, error) {
	return model.TransferTransactionResponse{}, nil
}

func (fakeTransactionService) CreatePayment(ctx context.Context, user model.AuthenticatedUser, input model.CreatePaymentTransactionInput) (model.PaymentTransactionResponse, error) {
	return model.PaymentTransactionResponse{}, nil
}

func (fakeTransactionService) ListPayments(ctx context.Context, user model.AuthenticatedUser) (model.PaymentTransactionListResponse, error) {
	return model.PaymentTransactionListResponse{}, nil
}

func (fakeTransactionService) GetPayment(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.PaymentTransactionResponse, error) {
	return model.PaymentTransactionResponse{}, nil
}

func TestCreateFundingRejectsInvalidJSON(t *testing.T) {
	handler := NewTransactionHandler(nil, fakeTransactionService{})
	request := httptest.NewRequest(http.MethodPost, "/v1/transactions/funding", strings.NewReader("{"))
	request = request.WithContext(
		middleware.WithAuthenticatedUser(
			context.Background(),
			model.AuthenticatedUser{ID: "user_123"},
		),
	)
	recorder := httptest.NewRecorder()

	handler.CreateFunding(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recorder.Code)
	}
}

func TestCreateFundingReturnsValidationErrors(t *testing.T) {
	handler := NewTransactionHandler(nil, fakeTransactionService{
		createFunding: func(ctx context.Context, user model.AuthenticatedUser, input model.CreateFundingTransactionInput) (model.FundingTransactionResponse, error) {
			return model.FundingTransactionResponse{}, service.ValidationErrors{
				{Field: "amount", Message: "amount must be greater than zero"},
			}
		},
	})

	request := httptest.NewRequest(http.MethodPost, "/v1/transactions/funding", strings.NewReader(`{"account_id":"acct_123","amount":0,"currency":"NGN"}`))
	request = request.WithContext(
		middleware.WithAuthenticatedUser(
			context.Background(),
			model.AuthenticatedUser{ID: "user_123"},
		),
	)
	recorder := httptest.NewRecorder()

	handler.CreateFunding(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recorder.Code)
	}

	var payload response.ErrorEnvelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected JSON error payload, got %v", err)
	}

	if payload.Error.Code != "validation_failed" {
		t.Fatalf("expected validation_failed error code, got %q", payload.Error.Code)
	}
}
