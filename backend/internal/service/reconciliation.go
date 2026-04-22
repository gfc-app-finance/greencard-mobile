package service

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type ReconciliationTransactionRepository interface {
	ListFundingByStatusesChangedBefore(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error)
	ListTransfersByStatusesChangedBefore(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error)
	ListPaymentsByStatusesChangedBefore(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error)
	GetFundingByReference(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error)
	GetTransferByReference(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error)
	GetPaymentByReference(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error)
}

type ReconciliationBalanceMovementRepository interface {
	ListByLinkedEntity(ctx context.Context, userID string, entityType model.LinkedEntityType, entityID string) ([]model.BalanceMovementRecord, error)
}

type ReconciliationWebhookRepository interface {
	ListByProcessingStatusesBefore(ctx context.Context, statuses []model.WebhookProcessingStatus, before time.Time, limit int) ([]model.WebhookEventRecord, error)
}

type ReconciliationService interface {
	RunTransactionBalanceReconciliation(ctx context.Context, before time.Time, limit int) (model.ReconciliationReport, error)
	RunWebhookReconciliation(ctx context.Context, before time.Time, limit int) (model.ReconciliationReport, error)
}

type DefaultReconciliationService struct {
	logger       *slog.Logger
	transactions ReconciliationTransactionRepository
	movements    ReconciliationBalanceMovementRepository
	webhooks     ReconciliationWebhookRepository
}

func NewReconciliationService(
	logger *slog.Logger,
	transactions ReconciliationTransactionRepository,
	movements ReconciliationBalanceMovementRepository,
	webhooks ReconciliationWebhookRepository,
) ReconciliationService {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	return &DefaultReconciliationService{
		logger:       logger,
		transactions: transactions,
		movements:    movements,
		webhooks:     webhooks,
	}
}

func (s *DefaultReconciliationService) RunTransactionBalanceReconciliation(ctx context.Context, before time.Time, limit int) (model.ReconciliationReport, error) {
	report := model.ReconciliationReport{}
	if s == nil || s.transactions == nil || s.movements == nil {
		return report, nil
	}

	fundingRecords, err := s.transactions.ListFundingByStatusesChangedBefore(ctx, []model.FundingStatus{model.FundingStatusCompleted}, before, limit)
	if err != nil {
		return report, err
	}
	for _, record := range fundingRecords {
		report.Checked++
		if err := ctx.Err(); err != nil {
			return report, err
		}
		report.Issues = append(report.Issues, s.missingMovementIssues(ctx, record.UserID, model.LinkedEntityTypeFundingTransaction, record.ID, record.Reference, []model.BalanceMovementType{model.BalanceMovementTypeFundingCredit})...)
	}

	transferRecords, err := s.transactions.ListTransfersByStatusesChangedBefore(ctx, []model.TransferStatus{model.TransferStatusCompleted}, before, limit)
	if err != nil {
		return report, err
	}
	for _, record := range transferRecords {
		report.Checked++
		if err := ctx.Err(); err != nil {
			return report, err
		}
		report.Issues = append(report.Issues, s.missingMovementIssues(ctx, record.UserID, model.LinkedEntityTypeTransferTransaction, record.ID, record.Reference, []model.BalanceMovementType{model.BalanceMovementTypeTransferDebit, model.BalanceMovementTypeTransferCredit})...)
	}

	paymentRecords, err := s.transactions.ListPaymentsByStatusesChangedBefore(ctx, []model.PaymentStatus{model.PaymentStatusCompleted}, before, limit)
	if err != nil {
		return report, err
	}
	for _, record := range paymentRecords {
		report.Checked++
		if err := ctx.Err(); err != nil {
			return report, err
		}
		report.Issues = append(report.Issues, s.missingMovementIssues(ctx, record.UserID, model.LinkedEntityTypePaymentTransaction, record.ID, record.Reference, []model.BalanceMovementType{model.BalanceMovementTypePaymentDebit})...)
	}

	return report, nil
}

func (s *DefaultReconciliationService) RunWebhookReconciliation(ctx context.Context, before time.Time, limit int) (model.ReconciliationReport, error) {
	report := model.ReconciliationReport{}
	if s == nil || s.webhooks == nil || s.transactions == nil {
		return report, nil
	}

	records, err := s.webhooks.ListByProcessingStatusesBefore(
		ctx,
		[]model.WebhookProcessingStatus{
			model.WebhookProcessingStatusReceived,
			model.WebhookProcessingStatusProcessed,
			model.WebhookProcessingStatusFailed,
		},
		before,
		limit,
	)
	if err != nil {
		return report, err
	}

	for _, record := range records {
		report.Checked++
		if err := ctx.Err(); err != nil {
			return report, err
		}

		report.Issues = append(report.Issues, s.webhookIssues(ctx, record)...)
	}

	return report, nil
}

func (s *DefaultReconciliationService) missingMovementIssues(
	ctx context.Context,
	userID string,
	entityType model.LinkedEntityType,
	entityID string,
	reference string,
	requiredTypes []model.BalanceMovementType,
) []model.ReconciliationIssue {
	movements, err := s.movements.ListByLinkedEntity(ctx, userID, entityType, entityID)
	if err != nil {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueCompletedTransactionMissingMovement,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(entityType),
			EntityID:   entityID,
			Reference:  reference,
			Expected:   movementTypeList(requiredTypes),
			Message:    "could not verify balance movements for completed transaction",
		}}
	}

	existing := make(map[model.BalanceMovementType]int, len(movements))
	for _, movement := range movements {
		existing[movement.MovementType]++
	}

	issues := make([]model.ReconciliationIssue, 0)
	for _, requiredType := range requiredTypes {
		if existing[requiredType] > 0 {
			continue
		}

		issues = append(issues, model.ReconciliationIssue{
			Type:       model.ReconciliationIssueCompletedTransactionMissingMovement,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(entityType),
			EntityID:   entityID,
			Reference:  reference,
			Expected:   string(requiredType),
			Message:    "completed transaction is missing an expected balance movement",
		})
	}

	return issues
}

func (s *DefaultReconciliationService) webhookIssues(ctx context.Context, record model.WebhookEventRecord) []model.ReconciliationIssue {
	switch record.ProcessingStatus {
	case model.WebhookProcessingStatusReceived:
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookEventUnlinked,
			Severity:   model.ReconciliationSeverityWarning,
			EntityType: webhookEntityType(record),
			EntityID:   dereferenceString(record.LinkedEntityID),
			Reference:  dereferenceString(record.LinkedReference),
			Message:    "provider webhook event has not been processed yet",
		}}
	case model.WebhookProcessingStatusFailed:
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookEventFailed,
			Severity:   model.ReconciliationSeverityError,
			EntityType: webhookEntityType(record),
			EntityID:   dereferenceString(record.LinkedEntityID),
			Reference:  dereferenceString(record.LinkedReference),
			Actual:     string(record.ProcessingStatus),
			Message:    "provider webhook processing failed",
		}}
	case model.WebhookProcessingStatusProcessed:
	default:
		return nil
	}

	expectedEntity, expectedStatus, ok := expectedWebhookState(record.EventType)
	if !ok {
		return nil
	}

	if record.LinkedEntityType == nil || record.LinkedReference == nil || strings.TrimSpace(*record.LinkedReference) == "" {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookEventUnlinked,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(expectedEntity),
			Expected:   expectedStatus,
			Message:    "processed provider webhook is missing transaction linkage",
		}}
	}

	if *record.LinkedEntityType != expectedEntity {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookStateMismatch,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(*record.LinkedEntityType),
			EntityID:   dereferenceString(record.LinkedEntityID),
			Reference:  dereferenceString(record.LinkedReference),
			Expected:   string(expectedEntity),
			Actual:     string(*record.LinkedEntityType),
			Message:    "processed provider webhook linked to an unexpected transaction type",
		}}
	}

	actualStatus, found, err := s.lookupStatusByWebhookReference(ctx, expectedEntity, *record.LinkedReference)
	if err != nil {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookStateMismatch,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(expectedEntity),
			EntityID:   dereferenceString(record.LinkedEntityID),
			Reference:  dereferenceString(record.LinkedReference),
			Expected:   expectedStatus,
			Message:    "could not verify transaction state for processed webhook",
		}}
	}
	if !found {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookEventUnlinked,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(expectedEntity),
			Reference:  dereferenceString(record.LinkedReference),
			Expected:   expectedStatus,
			Message:    "processed provider webhook references a missing transaction",
		}}
	}
	if actualStatus != expectedStatus {
		return []model.ReconciliationIssue{{
			Type:       model.ReconciliationIssueWebhookStateMismatch,
			Severity:   model.ReconciliationSeverityError,
			EntityType: string(expectedEntity),
			EntityID:   dereferenceString(record.LinkedEntityID),
			Reference:  dereferenceString(record.LinkedReference),
			Expected:   expectedStatus,
			Actual:     actualStatus,
			Message:    "provider webhook state does not match internal transaction state",
		}}
	}

	return nil
}

func (s *DefaultReconciliationService) lookupStatusByWebhookReference(ctx context.Context, entity model.WebhookLinkedEntityType, reference string) (string, bool, error) {
	switch entity {
	case model.WebhookLinkedEntityFunding:
		record, found, err := s.transactions.GetFundingByReference(ctx, reference)
		return string(record.Status), found, err
	case model.WebhookLinkedEntityTransfer:
		record, found, err := s.transactions.GetTransferByReference(ctx, reference)
		return string(record.Status), found, err
	case model.WebhookLinkedEntityPayment:
		record, found, err := s.transactions.GetPaymentByReference(ctx, reference)
		return string(record.Status), found, err
	default:
		return "", false, fmt.Errorf("unsupported webhook linked entity type %q", entity)
	}
}

func expectedWebhookState(eventType string) (model.WebhookLinkedEntityType, string, bool) {
	switch strings.TrimSpace(strings.ToLower(eventType)) {
	case "funding_pending":
		return model.WebhookLinkedEntityFunding, string(model.FundingStatusPending), true
	case "funding_completed", "funding_received":
		return model.WebhookLinkedEntityFunding, string(model.FundingStatusCompleted), true
	case "funding_failed":
		return model.WebhookLinkedEntityFunding, string(model.FundingStatusFailed), true
	case "transfer_processing", "transfer_converting":
		return model.WebhookLinkedEntityTransfer, string(model.TransferStatusConverting), true
	case "transfer_completed":
		return model.WebhookLinkedEntityTransfer, string(model.TransferStatusCompleted), true
	case "transfer_failed":
		return model.WebhookLinkedEntityTransfer, string(model.TransferStatusFailed), true
	case "payment_submitted":
		return model.WebhookLinkedEntityPayment, string(model.PaymentStatusSubmitted), true
	case "payment_under_review":
		return model.WebhookLinkedEntityPayment, string(model.PaymentStatusUnderReview), true
	case "payment_processing":
		return model.WebhookLinkedEntityPayment, string(model.PaymentStatusProcessing), true
	case "payment_completed":
		return model.WebhookLinkedEntityPayment, string(model.PaymentStatusCompleted), true
	case "payment_failed":
		return model.WebhookLinkedEntityPayment, string(model.PaymentStatusFailed), true
	default:
		return "", "", false
	}
}

func movementTypeList(values []model.BalanceMovementType) string {
	parts := make([]string, 0, len(values))
	for _, value := range values {
		parts = append(parts, string(value))
	}

	return strings.Join(parts, ",")
}

func webhookEntityType(record model.WebhookEventRecord) string {
	if record.LinkedEntityType == nil {
		return ""
	}

	return string(*record.LinkedEntityType)
}

func dereferenceString(value *string) string {
	if value == nil {
		return ""
	}

	return strings.TrimSpace(*value)
}
