package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeActivityService struct {
	listActivity func(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error)
}

func (f fakeActivityService) ListActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error) {
	if f.listActivity != nil {
		return f.listActivity(ctx, user)
	}

	return model.ActivityListResponse{}, nil
}

func (fakeActivityService) ListRecentActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error) {
	return model.ActivityListResponse{}, nil
}

func (fakeActivityService) RecordFundingEvent(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
	return nil
}

func (fakeActivityService) RecordTransferEvent(ctx context.Context, userID string, record model.TransferTransactionRecord) error {
	return nil
}

func (fakeActivityService) RecordPaymentEvent(ctx context.Context, userID string, record model.PaymentTransactionRecord) error {
	return nil
}

func (fakeActivityService) RecordSupportTicketCreated(ctx context.Context, userID string, record model.SupportTicketRecord) error {
	return nil
}

func TestActivityHandlerListReturnsServiceUnavailable(t *testing.T) {
	handler := NewActivityHandler(testLogger(), fakeActivityService{
		listActivity: func(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error) {
			return model.ActivityListResponse{}, service.ErrActivityUnavailable
		},
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/activity", nil)
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.List(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", recorder.Code)
	}
}
