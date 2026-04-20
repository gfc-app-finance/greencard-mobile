package service

import (
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestBuildSupportTicketActivityUsesSafeFrontendFields(t *testing.T) {
	service := &DefaultActivityService{}
	entityType := model.LinkedEntityTypePaymentTransaction
	entityID := "payment_123"

	activity, err := service.buildSupportTicketActivity(model.SupportTicketRecord{
		ID:               "ticket_123",
		Title:            "Payment failed after submission",
		Status:           model.SupportTicketStatusOpen,
		LinkedEntityType: &entityType,
		LinkedEntityID:   &entityID,
	}, "user_123")
	if err != nil {
		t.Fatalf("expected activity build to succeed, got %v", err)
	}

	if activity.Type != model.ActivityTypeTicketCreated {
		t.Fatalf("expected ticket_created activity type, got %q", activity.Type)
	}

	if activity.Title != "Opened support ticket" {
		t.Fatalf("unexpected activity title %q", activity.Title)
	}

	if activity.LinkedEntityType != model.LinkedEntityTypeSupportTicket || activity.LinkedEntityID != "ticket_123" {
		t.Fatalf("support activities should link to the ticket itself, got %#v", activity)
	}
}
