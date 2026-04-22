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

type fakeSupportService struct {
	createTicket func(ctx context.Context, user model.AuthenticatedUser, input model.CreateSupportTicketInput) (model.SupportTicketResponse, error)
	getTicket    func(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketResponse, error)
}

func (f fakeSupportService) CreateTicket(ctx context.Context, user model.AuthenticatedUser, input model.CreateSupportTicketInput) (model.SupportTicketResponse, error) {
	if f.createTicket != nil {
		return f.createTicket(ctx, user, input)
	}

	return model.SupportTicketResponse{}, nil
}

func (fakeSupportService) ListTickets(ctx context.Context, user model.AuthenticatedUser) (model.SupportTicketListResponse, error) {
	return model.SupportTicketListResponse{}, nil
}

func (f fakeSupportService) GetTicket(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketResponse, error) {
	if f.getTicket != nil {
		return f.getTicket(ctx, user, ticketID)
	}

	return model.SupportTicketResponse{}, nil
}

func (fakeSupportService) CreateMessage(ctx context.Context, user model.AuthenticatedUser, ticketID string, input model.CreateSupportTicketMessageInput) (model.SupportTicketMessageResponse, error) {
	return model.SupportTicketMessageResponse{}, nil
}

func (fakeSupportService) ListMessages(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketMessageListResponse, error) {
	return model.SupportTicketMessageListResponse{}, nil
}

func TestSupportHandlerCreateTicketReturnsForbidden(t *testing.T) {
	handler := NewSupportHandler(testLogger(), fakeSupportService{
		createTicket: func(ctx context.Context, user model.AuthenticatedUser, input model.CreateSupportTicketInput) (model.SupportTicketResponse, error) {
			return model.SupportTicketResponse{}, service.ErrSupportPermissionDenied
		},
	})

	request := httptest.NewRequest(http.MethodPost, "/v1/support/tickets", strings.NewReader(`{"title":"Need help","issue_type":"other","description":"Please help"}`))
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.CreateTicket(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", recorder.Code)
	}
}

func TestSupportHandlerGetTicketReturnsNotFound(t *testing.T) {
	handler := NewSupportHandler(testLogger(), fakeSupportService{
		getTicket: func(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketResponse, error) {
			return model.SupportTicketResponse{}, service.ErrSupportTicketNotFound
		},
	})

	request := httptest.NewRequest(http.MethodGet, "/v1/support/tickets/ticket_missing", nil)
	request.SetPathValue("id", "ticket_missing")
	request = request.WithContext(middleware.WithAuthenticatedUser(context.Background(), model.AuthenticatedUser{ID: "user_123"}))
	recorder := httptest.NewRecorder()

	handler.GetTicket(recorder, request)

	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", recorder.Code)
	}

	var payload response.ErrorEnvelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected JSON error payload, got %v", err)
	}

	if payload.Error.Code != "support_ticket_not_found" {
		t.Fatalf("expected support_ticket_not_found code, got %q", payload.Error.Code)
	}
}
