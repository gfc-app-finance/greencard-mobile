package service

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrWebhookProviderUnsupported = errors.New("webhook provider unsupported")
	ErrWebhookVerificationFailed  = errors.New("webhook verification failed")
	ErrWebhookInvalidPayload      = errors.New("webhook invalid payload")
	ErrWebhookUnavailable         = errors.New("webhook unavailable")
)

type WebhookService interface {
	HandleProviderWebhook(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error)
}

type WebhookProviderAdapter interface {
	Name() model.WebhookProvider
	Verify(headers http.Header, body []byte) error
	Parse(body []byte) (model.ProviderWebhookEvent, error)
}

type DefaultWebhookService struct {
	logger       *slog.Logger
	providers    map[string]WebhookProviderAdapter
	events       repository.WebhookEventRepository
	transactions TransactionLifecycleUpdateService
	audit        AuditRecorder
}

func NewWebhookService(
	logger *slog.Logger,
	events repository.WebhookEventRepository,
	transactions TransactionLifecycleUpdateService,
	providers ...WebhookProviderAdapter,
) WebhookService {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	registry := make(map[string]WebhookProviderAdapter, len(providers))
	for _, provider := range providers {
		if provider == nil {
			continue
		}

		registry[strings.ToLower(string(provider.Name()))] = provider
	}

	return &DefaultWebhookService{
		logger:       logger,
		providers:    registry,
		events:       events,
		transactions: transactions,
	}
}

func NewWebhookServiceWithAudit(
	logger *slog.Logger,
	events repository.WebhookEventRepository,
	transactions TransactionLifecycleUpdateService,
	audit AuditRecorder,
	providers ...WebhookProviderAdapter,
) WebhookService {
	service := NewWebhookService(logger, events, transactions, providers...)
	if typed, ok := service.(*DefaultWebhookService); ok {
		typed.audit = audit
	}

	return service
}

func (s *DefaultWebhookService) HandleProviderWebhook(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error) {
	adapter, ok := s.providers[strings.ToLower(strings.TrimSpace(provider))]
	if !ok {
		return model.WebhookHandleResult{}, ErrWebhookProviderUnsupported
	}

	if err := adapter.Verify(headers, body); err != nil {
		s.recordWebhookAudit(ctx, model.AuditActionWebhookVerificationRejected, model.AuditSourceProvider, model.AuditEvent{
			EntityType: model.AuditEntityWebhookEvent,
			Provider:   string(adapter.Name()),
			Metadata: map[string]any{
				"provider": string(adapter.Name()),
				"outcome":  "verification_failed",
			},
		})
		return model.WebhookHandleResult{}, err
	}

	event, err := adapter.Parse(body)
	if err != nil {
		s.recordWebhookAudit(ctx, model.AuditActionWebhookProcessingFailed, model.AuditSourceProvider, model.AuditEvent{
			EntityType: model.AuditEntityWebhookEvent,
			Provider:   string(adapter.Name()),
			Metadata: map[string]any{
				"provider": string(adapter.Name()),
				"outcome":  "invalid_payload",
			},
		})
		return model.WebhookHandleResult{}, err
	}

	record, shouldProcess, err := s.registerWebhookEvent(ctx, event)
	if err != nil {
		s.logger.Error("failed to register webhook event", slog.String("provider", string(event.Provider)), slog.String("event_id", event.EventID), slog.String("event_type", event.EventType), slog.String("error", err.Error()))
		return model.WebhookHandleResult{}, ErrWebhookUnavailable
	}

	if !shouldProcess {
		s.logger.Info("ignored duplicate processed webhook event", slog.String("provider", string(event.Provider)), slog.String("event_id", event.EventID), slog.String("event_type", event.EventType))
		return model.WebhookHandleResult{
			Provider: event.Provider,
			EventID:  event.EventID,
			Status:   "duplicate_ignored",
		}, nil
	}

	s.auditProviderEvent(ctx, model.AuditActionWebhookProcessingReceived, record, event, "received")
	linkedEntityID, processErr := s.applyWebhookEvent(ctx, event)
	if processErr != nil {
		s.markWebhookEventFailed(ctx, record.ID, processErr)
		s.auditProviderEvent(ctx, model.AuditActionWebhookProcessingFailed, record, event, safeWebhookFailureMessage(processErr))
		return model.WebhookHandleResult{}, processErr
	}

	s.markWebhookEventProcessed(ctx, record.ID, event, linkedEntityID)
	record.LinkedEntityID = optionalStringPointer(linkedEntityID)
	s.auditProviderEvent(ctx, model.AuditActionWebhookProcessingSucceeded, record, event, "processed")

	s.logger.Info("processed provider webhook event", slog.String("provider", string(event.Provider)), slog.String("event_id", event.EventID), slog.String("event_type", event.EventType), slog.String("reference", event.Reference), slog.String("linked_entity_id", linkedEntityID))

	return model.WebhookHandleResult{
		Provider: event.Provider,
		EventID:  event.EventID,
		Status:   "processed",
	}, nil
}

func (s *DefaultWebhookService) auditProviderEvent(ctx context.Context, action model.AuditAction, record model.WebhookEventRecord, event model.ProviderWebhookEvent, outcome string) {
	s.recordWebhookAudit(ctx, action, model.AuditSourceProvider, model.AuditEvent{
		Action:        action,
		EntityType:    model.AuditEntityWebhookEvent,
		EntityID:      record.ID,
		Source:        model.AuditSourceProvider,
		Provider:      string(event.Provider),
		CorrelationID: event.EventID,
		Metadata: map[string]any{
			"provider":           event.Provider,
			"event_id":           event.EventID,
			"event_type":         event.EventType,
			"linked_entity_type": event.LinkedEntityType,
			"linked_entity_id":   record.LinkedEntityID,
			"linked_reference":   event.Reference,
			"outcome":            outcome,
		},
	})
}

func (s *DefaultWebhookService) recordWebhookAudit(ctx context.Context, action model.AuditAction, source model.AuditSource, event model.AuditEvent) {
	if s.audit == nil {
		return
	}

	event.Action = action
	event.Source = source
	if event.EntityType == "" {
		event.EntityType = model.AuditEntityWebhookEvent
	}
	if err := s.audit.Record(ctx, event); err != nil {
		s.logger.Warn("failed to record webhook audit event", slog.String("action", string(action)), slog.String("provider", event.Provider), slog.String("error", err.Error()))
	}
}

func (s *DefaultWebhookService) registerWebhookEvent(ctx context.Context, event model.ProviderWebhookEvent) (model.WebhookEventRecord, bool, error) {
	if s.events == nil {
		return model.WebhookEventRecord{}, false, ErrWebhookUnavailable
	}

	existing, found, err := s.events.GetByProviderEventID(ctx, event.Provider, event.EventID)
	if err != nil {
		return model.WebhookEventRecord{}, false, err
	}
	if found {
		if existing.ProcessingStatus == model.WebhookProcessingStatusProcessed {
			return existing, false, nil
		}

		return existing, true, nil
	}

	now := time.Now().UTC()
	record := model.WebhookEventRecord{
		Provider:         event.Provider,
		EventID:          event.EventID,
		EventType:        event.EventType,
		LinkedEntityType: webhookEntityTypePointer(event.LinkedEntityType),
		LinkedReference:  optionalStringPointer(event.Reference),
		ProcessingStatus: model.WebhookProcessingStatusReceived,
		ReceivedAt:       &now,
		UpdatedAt:        &now,
	}

	created, err := s.events.Create(ctx, record)
	if err != nil {
		if errors.Is(err, repository.ErrWebhookEventConflict) {
			existing, found, fetchErr := s.events.GetByProviderEventID(ctx, event.Provider, event.EventID)
			if fetchErr != nil {
				return model.WebhookEventRecord{}, false, fetchErr
			}
			if found && existing.ProcessingStatus == model.WebhookProcessingStatusProcessed {
				return existing, false, nil
			}
			if found {
				return existing, true, nil
			}
		}

		return model.WebhookEventRecord{}, false, err
	}

	return created, true, nil
}

func (s *DefaultWebhookService) applyWebhookEvent(ctx context.Context, event model.ProviderWebhookEvent) (string, error) {
	switch event.LinkedEntityType {
	case model.WebhookLinkedEntityFunding:
		response, err := s.transactions.UpdateFundingStatusByReference(ctx, event.Reference, *event.FundingStatus, model.TransactionStatusSourceProvider, event.Reason)
		if err != nil {
			return "", err
		}

		return response.Transaction.ID, nil
	case model.WebhookLinkedEntityTransfer:
		response, err := s.transactions.UpdateTransferStatusByReference(ctx, event.Reference, *event.TransferStatus, model.TransactionStatusSourceProvider, event.Reason)
		if err != nil {
			return "", err
		}

		return response.Transaction.ID, nil
	case model.WebhookLinkedEntityPayment:
		response, err := s.transactions.UpdatePaymentStatusByReference(ctx, event.Reference, *event.PaymentStatus, model.TransactionStatusSourceProvider, event.Reason)
		if err != nil {
			return "", err
		}

		return response.Transaction.ID, nil
	default:
		return "", ErrWebhookInvalidPayload
	}
}

func (s *DefaultWebhookService) markWebhookEventProcessed(ctx context.Context, recordID string, event model.ProviderWebhookEvent, linkedEntityID string) {
	if s.events == nil || strings.TrimSpace(recordID) == "" {
		return
	}

	now := time.Now().UTC()
	payload := map[string]any{
		"processing_status":  string(model.WebhookProcessingStatusProcessed),
		"linked_entity_type": string(event.LinkedEntityType),
		"linked_entity_id":   linkedEntityID,
		"linked_reference":   event.Reference,
		"status_message":     "processed",
		"processed_at":       now,
		"updated_at":         now,
	}

	if _, err := s.events.UpdateProcessing(ctx, recordID, payload); err != nil {
		s.logger.Warn("failed to mark webhook event processed", slog.String("record_id", recordID), slog.String("event_id", event.EventID), slog.String("error", err.Error()))
	}
}

func (s *DefaultWebhookService) markWebhookEventFailed(ctx context.Context, recordID string, processErr error) {
	if s.events == nil || strings.TrimSpace(recordID) == "" {
		return
	}

	now := time.Now().UTC()
	payload := map[string]any{
		"processing_status": string(model.WebhookProcessingStatusFailed),
		"status_message":    safeWebhookFailureMessage(processErr),
		"updated_at":        now,
	}

	if _, err := s.events.UpdateProcessing(ctx, recordID, payload); err != nil {
		s.logger.Warn("failed to mark webhook event failed", slog.String("record_id", recordID), slog.String("error", err.Error()))
	}
}

func safeWebhookFailureMessage(err error) string {
	switch {
	case errors.Is(err, ErrWebhookVerificationFailed):
		return "verification_failed"
	case errors.Is(err, ErrWebhookInvalidPayload):
		return "invalid_payload"
	case errors.Is(err, ErrFundingTransactionNotFound),
		errors.Is(err, ErrTransferTransactionNotFound),
		errors.Is(err, ErrPaymentTransactionNotFound):
		return "transaction_not_found"
	case errors.Is(err, ErrInvalidTransactionTransition):
		return "invalid_transaction_transition"
	case errors.Is(err, ErrInsufficientFunds):
		return "insufficient_funds"
	default:
		return "processing_failed"
	}
}

func webhookEntityTypePointer(value model.WebhookLinkedEntityType) *model.WebhookLinkedEntityType {
	if !value.IsValid() {
		return nil
	}

	copy := value
	return &copy
}
