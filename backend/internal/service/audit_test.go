package service

import (
	"context"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type fakeAuditLogRepository struct {
	records []model.AuditLogRecord
}

func (f *fakeAuditLogRepository) Create(ctx context.Context, record model.AuditLogRecord) (model.AuditLogRecord, error) {
	f.records = append(f.records, record)
	return record, nil
}

func (f *fakeAuditLogRepository) ListByActor(ctx context.Context, actorUserID string, limit int) ([]model.AuditLogRecord, error) {
	return f.records, nil
}

func (f *fakeAuditLogRepository) ListByEntity(ctx context.Context, entityType model.AuditEntityType, entityID string, limit int) ([]model.AuditLogRecord, error) {
	return f.records, nil
}

type collectingAuditRecorder struct {
	events []model.AuditEvent
}

func (c *collectingAuditRecorder) Record(ctx context.Context, event model.AuditEvent) error {
	c.events = append(c.events, event)
	return nil
}

func TestSanitizeAuditMetadataRedactsSensitiveFields(t *testing.T) {
	summary := SanitizeAuditMetadata(map[string]any{
		"account_number": "1234567890",
		"Authorization":  "Bearer secret-token",
		"nested": map[string]any{
			"iban":    "GB00SECRET",
			"outcome": "processed",
		},
		"amount": 125.50,
	})

	if summary["account_number"] != auditRedactedValue {
		t.Fatalf("expected account number to be redacted, got %#v", summary["account_number"])
	}
	if summary["Authorization"] != auditRedactedValue {
		t.Fatalf("expected authorization to be redacted, got %#v", summary["Authorization"])
	}

	nested, ok := summary["nested"].(map[string]any)
	if !ok {
		t.Fatalf("expected nested summary map, got %#v", summary["nested"])
	}
	if nested["iban"] != auditRedactedValue {
		t.Fatalf("expected nested IBAN to be redacted, got %#v", nested["iban"])
	}
	if nested["outcome"] != "processed" {
		t.Fatalf("expected non-sensitive nested metadata to remain, got %#v", nested["outcome"])
	}
}

func TestAuditServiceRecordsSanitizedEvent(t *testing.T) {
	repository := &fakeAuditLogRepository{}
	service := NewAuditService(nil, repository)

	err := service.Record(context.Background(), model.AuditEvent{
		ActorUserID: "1e6a15c4-2b96-4ded-978a-32da944bbd51",
		Action:      model.AuditActionTransactionCreated,
		EntityType:  model.AuditEntityPaymentTransaction,
		EntityID:    "payment_123",
		Source:      model.AuditSourceAPI,
		Metadata: map[string]any{
			"amount":     25.00,
			"api_secret": "should-not-persist",
		},
	})
	if err != nil {
		t.Fatalf("expected audit record to be created, got %v", err)
	}
	if len(repository.records) != 1 {
		t.Fatalf("expected one audit record, got %d", len(repository.records))
	}
	if repository.records[0].MetadataSummary["api_secret"] != auditRedactedValue {
		t.Fatalf("expected secret to be redacted, got %#v", repository.records[0].MetadataSummary["api_secret"])
	}
	if repository.records[0].MetadataSummary["amount"] != 25.00 {
		t.Fatalf("expected amount metadata to remain, got %#v", repository.records[0].MetadataSummary["amount"])
	}
}

func TestCreateRecipientEmitsAuditEvent(t *testing.T) {
	audit := &collectingAuditRecorder{}
	service := NewRecipientService(
		nil,
		fakeRecipientRepository{
			create: func(ctx context.Context, record model.RecipientRecord) (model.RecipientRecord, error) {
				record.ID = "recipient_123"
				return record, nil
			},
		},
		fakePermissionHelper{canCreateRecipient: true},
		testVerificationResolver(model.VerificationStatusVerified),
		audit,
	)

	_, err := service.CreateRecipient(context.Background(), model.AuthenticatedUser{ID: "user_123"}, model.CreateRecipientInput{
		Type:          model.RecipientTypeBank,
		FullName:      "Ada Lovelace",
		BankName:      "Green Bank",
		AccountNumber: "1234567890",
		Country:       "NG",
		Currency:      model.AccountCurrencyNGN,
	})
	if err != nil {
		t.Fatalf("expected recipient creation to succeed, got %v", err)
	}
	if len(audit.events) != 1 {
		t.Fatalf("expected one audit event, got %d", len(audit.events))
	}
	if audit.events[0].Action != model.AuditActionRecipientCreated {
		t.Fatalf("expected recipient created audit action, got %q", audit.events[0].Action)
	}
	if _, leaked := audit.events[0].Metadata["account_number"]; leaked {
		t.Fatal("recipient audit metadata must not include raw account number")
	}
}

func TestFundingCompletionEmitsStatusAndBalanceAuditEvents(t *testing.T) {
	audit := &collectingAuditRecorder{}
	fundingRecord := model.FundingTransactionRecord{
		ID:        "funding_123",
		UserID:    "user_123",
		AccountID: "acct_123",
		Amount:    150,
		Currency:  model.AccountCurrencyNGN,
		Status:    model.FundingStatusPending,
		Reference: "FUND-123",
	}

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{
			getFunding: func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
				return fundingRecord, true, nil
			},
			completeFunding: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error) {
				fundingRecord.Status = model.FundingStatusCompleted
				return fundingRecord, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessFunding: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
		audit,
	)

	_, err := transactionService.UpdateFundingStatus(
		context.Background(),
		model.AuthenticatedUser{ID: "user_123"},
		"funding_123",
		model.FundingStatusCompleted,
		model.TransactionStatusSourceProvider,
		nil,
	)
	if err != nil {
		t.Fatalf("expected funding completion to succeed, got %v", err)
	}
	if len(audit.events) != 2 {
		t.Fatalf("expected status and balance audit events, got %d", len(audit.events))
	}
	if audit.events[0].Action != model.AuditActionTransactionStatusChanged {
		t.Fatalf("expected status change audit event, got %q", audit.events[0].Action)
	}
	if audit.events[1].Action != model.AuditActionBalanceEffectApplied {
		t.Fatalf("expected balance effect audit event, got %q", audit.events[1].Action)
	}
}
