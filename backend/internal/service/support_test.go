package service

import (
	"context"
	"errors"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestValidateCreateSupportMessageInputRejectsClosedTicket(t *testing.T) {
	_, validationErrors := validateCreateSupportMessageInput(
		model.SupportTicketRecord{ID: "ticket_123", Status: model.SupportTicketStatusClosed},
		model.CreateSupportTicketMessageInput{Message: "Please reopen this"},
	)

	if len(validationErrors) == 0 {
		t.Fatal("expected closed ticket messages to be rejected")
	}
}

func TestDefaultSupportServiceCreateTicketDeniedByPermission(t *testing.T) {
	service := &DefaultSupportService{
		profileRepo: fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusBasic}, true, nil
			},
		},
		ticketRepo: fakeSupportTicketRepository{
			createTicket: func(ctx context.Context, record model.SupportTicketRecord) (model.SupportTicketRecord, error) {
				return model.SupportTicketRecord{}, errors.New("should not be called")
			},
		},
		permissions: fakePermissionHelper{
			canCreateSupportTicket: false,
		},
	}

	_, err := service.CreateTicket(context.Background(), model.AuthenticatedUser{ID: "user_123"}, model.CreateSupportTicketInput{
		Title:       "Need help",
		IssueType:   model.SupportIssueTypeOther,
		Description: "Please help",
	})
	if !errors.Is(err, ErrSupportPermissionDenied) {
		t.Fatalf("expected support permission denied, got %v", err)
	}
}

type fakeSupportTicketRepository struct {
	createTicket         func(ctx context.Context, record model.SupportTicketRecord) (model.SupportTicketRecord, error)
	listTicketsByUserID  func(ctx context.Context, userID string) ([]model.SupportTicketRecord, error)
	getTicketByIDForUser func(ctx context.Context, userID, ticketID string) (model.SupportTicketRecord, bool, error)
}

func (f fakeSupportTicketRepository) CreateTicket(ctx context.Context, record model.SupportTicketRecord) (model.SupportTicketRecord, error) {
	if f.createTicket != nil {
		return f.createTicket(ctx, record)
	}

	return record, nil
}

func (f fakeSupportTicketRepository) ListTicketsByUserID(ctx context.Context, userID string) ([]model.SupportTicketRecord, error) {
	if f.listTicketsByUserID != nil {
		return f.listTicketsByUserID(ctx, userID)
	}

	return nil, nil
}

func (f fakeSupportTicketRepository) GetTicketByIDForUser(ctx context.Context, userID, ticketID string) (model.SupportTicketRecord, bool, error) {
	if f.getTicketByIDForUser != nil {
		return f.getTicketByIDForUser(ctx, userID, ticketID)
	}

	return model.SupportTicketRecord{}, false, nil
}
