package service

import (
	"context"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type fakeReconciliationTransactions struct {
	fundingRecords  []model.FundingTransactionRecord
	transferRecords []model.TransferTransactionRecord
	paymentRecords  []model.PaymentTransactionRecord
	paymentsByRef   map[string]model.PaymentTransactionRecord
}

func (f fakeReconciliationTransactions) ListFundingByStatusesChangedBefore(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
	return f.fundingRecords, nil
}

func (f fakeReconciliationTransactions) ListTransfersByStatusesChangedBefore(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
	return f.transferRecords, nil
}

func (f fakeReconciliationTransactions) ListPaymentsByStatusesChangedBefore(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
	return f.paymentRecords, nil
}

func (f fakeReconciliationTransactions) GetFundingByReference(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error) {
	return model.FundingTransactionRecord{}, false, nil
}

func (f fakeReconciliationTransactions) GetTransferByReference(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error) {
	return model.TransferTransactionRecord{}, false, nil
}

func (f fakeReconciliationTransactions) GetPaymentByReference(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error) {
	record, found := f.paymentsByRef[reference]
	return record, found, nil
}

type fakeBalanceMovements struct {
	records []model.BalanceMovementRecord
}

func (f fakeBalanceMovements) ListByLinkedEntity(ctx context.Context, userID string, entityType model.LinkedEntityType, entityID string) ([]model.BalanceMovementRecord, error) {
	return f.records, nil
}

type fakeWebhookReconciliationRepository struct {
	records []model.WebhookEventRecord
}

func (f fakeWebhookReconciliationRepository) ListByProcessingStatusesBefore(ctx context.Context, statuses []model.WebhookProcessingStatus, before time.Time, limit int) ([]model.WebhookEventRecord, error) {
	return f.records, nil
}

func TestReconciliationDetectsCompletedTransferMissingMovement(t *testing.T) {
	service := NewReconciliationService(
		nil,
		fakeReconciliationTransactions{
			transferRecords: []model.TransferTransactionRecord{{
				ID:        "transfer_123",
				UserID:    "user_123",
				Reference: "tr_ref_123",
				Status:    model.TransferStatusCompleted,
			}},
		},
		fakeBalanceMovements{
			records: []model.BalanceMovementRecord{{
				MovementType: model.BalanceMovementTypeTransferDebit,
			}},
		},
		nil,
	)

	report, err := service.RunTransactionBalanceReconciliation(context.Background(), time.Now(), 10)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if report.Checked != 1 {
		t.Fatalf("expected one checked transaction, got %#v", report)
	}
	if report.IssueCount() != 1 {
		t.Fatalf("expected one reconciliation issue, got %#v", report)
	}

	issue := report.Issues[0]
	if issue.Type != model.ReconciliationIssueCompletedTransactionMissingMovement || issue.Expected != string(model.BalanceMovementTypeTransferCredit) {
		t.Fatalf("expected missing transfer credit issue, got %#v", issue)
	}
}

func TestReconciliationDetectsProcessedWebhookStateMismatch(t *testing.T) {
	entityType := model.WebhookLinkedEntityPayment
	reference := "pay_ref_123"

	service := NewReconciliationService(
		nil,
		fakeReconciliationTransactions{
			paymentsByRef: map[string]model.PaymentTransactionRecord{
				reference: {
					ID:        "payment_123",
					Reference: reference,
					Status:    model.PaymentStatusProcessing,
				},
			},
		},
		nil,
		fakeWebhookReconciliationRepository{
			records: []model.WebhookEventRecord{{
				Provider:         model.WebhookProviderSandboxPay,
				EventID:          "evt_123",
				EventType:        "payment_completed",
				LinkedEntityType: &entityType,
				LinkedReference:  &reference,
				ProcessingStatus: model.WebhookProcessingStatusProcessed,
			}},
		},
	)

	report, err := service.RunWebhookReconciliation(context.Background(), time.Now(), 10)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if report.Checked != 1 || report.IssueCount() != 1 {
		t.Fatalf("expected one checked webhook and one issue, got %#v", report)
	}

	issue := report.Issues[0]
	if issue.Type != model.ReconciliationIssueWebhookStateMismatch {
		t.Fatalf("expected webhook state mismatch, got %#v", issue)
	}
	if issue.Expected != string(model.PaymentStatusCompleted) || issue.Actual != string(model.PaymentStatusProcessing) {
		t.Fatalf("expected completed vs processing mismatch, got %#v", issue)
	}
}
