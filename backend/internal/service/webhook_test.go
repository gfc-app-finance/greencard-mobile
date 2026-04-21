package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strconv"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type fakeWebhookEventRepository struct {
	create           func(ctx context.Context, record model.WebhookEventRecord) (model.WebhookEventRecord, error)
	getByProviderID  func(ctx context.Context, provider model.WebhookProvider, eventID string) (model.WebhookEventRecord, bool, error)
	updateProcessing func(ctx context.Context, recordID string, payload map[string]any) (model.WebhookEventRecord, error)
}

func (f fakeWebhookEventRepository) Create(ctx context.Context, record model.WebhookEventRecord) (model.WebhookEventRecord, error) {
	if f.create != nil {
		return f.create(ctx, record)
	}

	return record, nil
}

func (f fakeWebhookEventRepository) GetByProviderEventID(ctx context.Context, provider model.WebhookProvider, eventID string) (model.WebhookEventRecord, bool, error) {
	if f.getByProviderID != nil {
		return f.getByProviderID(ctx, provider, eventID)
	}

	return model.WebhookEventRecord{}, false, nil
}

func (f fakeWebhookEventRepository) ListByProcessingStatusesBefore(ctx context.Context, statuses []model.WebhookProcessingStatus, before time.Time, limit int) ([]model.WebhookEventRecord, error) {
	return nil, nil
}

func (f fakeWebhookEventRepository) UpdateProcessing(ctx context.Context, recordID string, payload map[string]any) (model.WebhookEventRecord, error) {
	if f.updateProcessing != nil {
		return f.updateProcessing(ctx, recordID, payload)
	}

	return model.WebhookEventRecord{ID: recordID}, nil
}

type fakeTransactionLifecycleUpdater struct {
	updateFundingByReference  func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error)
	updateTransferByReference func(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error)
	updatePaymentByReference  func(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error)
}

func (f fakeTransactionLifecycleUpdater) UpdateFundingStatusByReference(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
	if f.updateFundingByReference != nil {
		return f.updateFundingByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.FundingTransactionResponse{}, nil
}

func (f fakeTransactionLifecycleUpdater) UpdateTransferStatusByReference(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error) {
	if f.updateTransferByReference != nil {
		return f.updateTransferByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.TransferTransactionResponse{}, nil
}

func (f fakeTransactionLifecycleUpdater) UpdatePaymentStatusByReference(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error) {
	if f.updatePaymentByReference != nil {
		return f.updatePaymentByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.PaymentTransactionResponse{}, nil
}

func TestHandleProviderWebhookProcessesValidPaymentEvent(t *testing.T) {
	processedPayload := map[string]any{}
	updaterCalls := 0
	service := NewWebhookService(
		nil,
		fakeWebhookEventRepository{
			create: func(ctx context.Context, record model.WebhookEventRecord) (model.WebhookEventRecord, error) {
				record.ID = "webhook_123"
				return record, nil
			},
			updateProcessing: func(ctx context.Context, recordID string, payload map[string]any) (model.WebhookEventRecord, error) {
				processedPayload = payload
				return model.WebhookEventRecord{ID: recordID}, nil
			},
		},
		fakeTransactionLifecycleUpdater{
			updatePaymentByReference: func(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error) {
				updaterCalls++
				if reference != "GCF-PMT-123" {
					t.Fatalf("expected payment reference GCF-PMT-123, got %q", reference)
				}
				if targetStatus != model.PaymentStatusCompleted {
					t.Fatalf("expected completed payment status, got %q", targetStatus)
				}
				if source != model.TransactionStatusSourceProvider {
					t.Fatalf("expected provider source, got %q", source)
				}
				if reason == nil || *reason != "settled by provider" {
					t.Fatalf("expected provider reason, got %#v", reason)
				}

				return model.PaymentTransactionResponse{
					Transaction: model.PaymentTransaction{
						ID: "payment_txn_123",
					},
				}, nil
			},
		},
		NewSandboxPayProvider("super-secret", 5*time.Minute),
	)

	body := []byte(`{"event_id":"evt_123","event_type":"payment_completed","reference":"GCF-PMT-123","reason":"settled by provider"}`)
	headers := signedSandboxHeaders("super-secret", body, time.Now().UTC())

	result, err := service.HandleProviderWebhook(context.Background(), "sandboxpay", headers, body)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.Status != "processed" {
		t.Fatalf("expected processed result, got %q", result.Status)
	}

	if updaterCalls != 1 {
		t.Fatalf("expected one lifecycle updater call, got %d", updaterCalls)
	}

	if processedPayload["processing_status"] != string(model.WebhookProcessingStatusProcessed) {
		t.Fatalf("expected processed webhook status, got %#v", processedPayload["processing_status"])
	}

	if processedPayload["linked_entity_id"] != "payment_txn_123" {
		t.Fatalf("expected linked payment transaction id, got %#v", processedPayload["linked_entity_id"])
	}
}

func TestHandleProviderWebhookRejectsInvalidSignature(t *testing.T) {
	service := NewWebhookService(
		nil,
		fakeWebhookEventRepository{},
		fakeTransactionLifecycleUpdater{},
		NewSandboxPayProvider("super-secret", 5*time.Minute),
	)

	body := []byte(`{"event_id":"evt_123","event_type":"payment_completed","reference":"GCF-PMT-123"}`)
	headers := http.Header{}
	headers.Set(sandboxPayTimestampHeader, strconv.FormatInt(time.Now().UTC().Unix(), 10))
	headers.Set(sandboxPaySignatureHeader, "sha256=invalid")

	_, err := service.HandleProviderWebhook(context.Background(), "sandboxpay", headers, body)
	if err != ErrWebhookVerificationFailed {
		t.Fatalf("expected verification failure, got %v", err)
	}
}

func TestHandleProviderWebhookIgnoresDuplicateProcessedEvent(t *testing.T) {
	updaterCalls := 0
	service := NewWebhookService(
		nil,
		fakeWebhookEventRepository{
			getByProviderID: func(ctx context.Context, provider model.WebhookProvider, eventID string) (model.WebhookEventRecord, bool, error) {
				return model.WebhookEventRecord{
					ID:               "webhook_123",
					Provider:         provider,
					EventID:          eventID,
					ProcessingStatus: model.WebhookProcessingStatusProcessed,
				}, true, nil
			},
		},
		fakeTransactionLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				updaterCalls++
				return model.FundingTransactionResponse{}, nil
			},
		},
		NewSandboxPayProvider("super-secret", 5*time.Minute),
	)

	body := []byte(`{"event_id":"evt_123","event_type":"funding_received","reference":"GCF-FUND-123"}`)
	headers := signedSandboxHeaders("super-secret", body, time.Now().UTC())

	result, err := service.HandleProviderWebhook(context.Background(), "sandboxpay", headers, body)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.Status != "duplicate_ignored" {
		t.Fatalf("expected duplicate_ignored status, got %q", result.Status)
	}

	if updaterCalls != 0 {
		t.Fatalf("expected no lifecycle updater calls for processed duplicate, got %d", updaterCalls)
	}
}

func TestSandboxPayProviderMapsTransferProcessingEvent(t *testing.T) {
	provider := NewSandboxPayProvider("super-secret", 5*time.Minute)
	event, err := provider.Parse([]byte(`{"event_id":"evt_456","event_type":"transfer_processing","reference":"GCF-XFER-123","reason":"provider accepted payout"}`))
	if err != nil {
		t.Fatalf("expected no parse error, got %v", err)
	}

	if event.LinkedEntityType != model.WebhookLinkedEntityTransfer {
		t.Fatalf("expected transfer linked entity type, got %q", event.LinkedEntityType)
	}

	if event.TransferStatus == nil || *event.TransferStatus != model.TransferStatusConverting {
		t.Fatalf("expected converting transfer status, got %#v", event.TransferStatus)
	}
}

func signedSandboxHeaders(secret string, body []byte, timestamp time.Time) http.Header {
	timestampValue := strconv.FormatInt(timestamp.UTC().Unix(), 10)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestampValue))
	mac.Write([]byte("."))
	mac.Write(body)

	headers := http.Header{}
	headers.Set(sandboxPayTimestampHeader, timestampValue)
	headers.Set(sandboxPaySignatureHeader, "sha256="+hex.EncodeToString(mac.Sum(nil)))

	return headers
}
