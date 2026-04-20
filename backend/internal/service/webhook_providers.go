package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const (
	sandboxPayTimestampHeader = "X-Sandboxpay-Timestamp"
	sandboxPaySignatureHeader = "X-Sandboxpay-Signature"
)

type SandboxPayProvider struct {
	secret             string
	signatureTolerance time.Duration
}

type sandboxPayWebhookPayload struct {
	EventID   string `json:"event_id"`
	EventType string `json:"event_type"`
	Reference string `json:"reference"`
	Reason    string `json:"reason,omitempty"`
}

func NewWebhookProviders(cfg config.WebhookConfig) []WebhookProviderAdapter {
	providers := make([]WebhookProviderAdapter, 0, 1)
	if strings.TrimSpace(cfg.SandboxPaySecret) != "" {
		providers = append(providers, NewSandboxPayProvider(cfg.SandboxPaySecret, cfg.SignatureTolerance))
	}

	return providers
}

func NewSandboxPayProvider(secret string, signatureTolerance time.Duration) *SandboxPayProvider {
	return &SandboxPayProvider{
		secret:             strings.TrimSpace(secret),
		signatureTolerance: signatureTolerance,
	}
}

func (p *SandboxPayProvider) Name() model.WebhookProvider {
	return model.WebhookProviderSandboxPay
}

func (p *SandboxPayProvider) Verify(headers http.Header, body []byte) error {
	timestampValue := strings.TrimSpace(headers.Get(sandboxPayTimestampHeader))
	signatureValue := strings.TrimSpace(headers.Get(sandboxPaySignatureHeader))
	if timestampValue == "" || signatureValue == "" || p.secret == "" {
		return ErrWebhookVerificationFailed
	}

	timestampSeconds, err := strconv.ParseInt(timestampValue, 10, 64)
	if err != nil {
		return ErrWebhookVerificationFailed
	}

	now := time.Now().UTC()
	timestamp := time.Unix(timestampSeconds, 0).UTC()
	delta := now.Sub(timestamp)
	if delta < 0 {
		delta = -delta
	}
	if delta > p.signatureTolerance {
		return ErrWebhookVerificationFailed
	}

	mac := hmac.New(sha256.New, []byte(p.secret))
	mac.Write([]byte(timestampValue))
	mac.Write([]byte("."))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	providedSignature := strings.TrimPrefix(strings.ToLower(signatureValue), "sha256=")

	if subtle.ConstantTimeCompare([]byte(expectedSignature), []byte(providedSignature)) != 1 {
		return ErrWebhookVerificationFailed
	}

	return nil
}

func (p *SandboxPayProvider) Parse(body []byte) (model.ProviderWebhookEvent, error) {
	var payload sandboxPayWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return model.ProviderWebhookEvent{}, ErrWebhookInvalidPayload
	}

	payload.EventID = strings.TrimSpace(payload.EventID)
	payload.EventType = strings.TrimSpace(strings.ToLower(payload.EventType))
	payload.Reference = strings.TrimSpace(payload.Reference)
	if payload.EventID == "" || payload.EventType == "" || payload.Reference == "" {
		return model.ProviderWebhookEvent{}, ErrWebhookInvalidPayload
	}

	reason := normalizeStatusReason(optionalStringPointer(payload.Reason))

	switch payload.EventType {
	case "funding_pending":
		status := model.FundingStatusPending
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityFunding,
			Reference:        payload.Reference,
			Reason:           reason,
			FundingStatus:    &status,
		}, nil
	case "funding_completed", "funding_received":
		status := model.FundingStatusCompleted
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityFunding,
			Reference:        payload.Reference,
			Reason:           reason,
			FundingStatus:    &status,
		}, nil
	case "funding_failed":
		status := model.FundingStatusFailed
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityFunding,
			Reference:        payload.Reference,
			Reason:           reason,
			FundingStatus:    &status,
		}, nil
	case "transfer_processing", "transfer_converting":
		status := model.TransferStatusConverting
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityTransfer,
			Reference:        payload.Reference,
			Reason:           reason,
			TransferStatus:   &status,
		}, nil
	case "transfer_completed":
		status := model.TransferStatusCompleted
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityTransfer,
			Reference:        payload.Reference,
			Reason:           reason,
			TransferStatus:   &status,
		}, nil
	case "transfer_failed":
		status := model.TransferStatusFailed
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityTransfer,
			Reference:        payload.Reference,
			Reason:           reason,
			TransferStatus:   &status,
		}, nil
	case "payment_submitted":
		status := model.PaymentStatusSubmitted
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityPayment,
			Reference:        payload.Reference,
			Reason:           reason,
			PaymentStatus:    &status,
		}, nil
	case "payment_under_review":
		status := model.PaymentStatusUnderReview
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityPayment,
			Reference:        payload.Reference,
			Reason:           reason,
			PaymentStatus:    &status,
		}, nil
	case "payment_processing":
		status := model.PaymentStatusProcessing
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityPayment,
			Reference:        payload.Reference,
			Reason:           reason,
			PaymentStatus:    &status,
		}, nil
	case "payment_completed":
		status := model.PaymentStatusCompleted
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityPayment,
			Reference:        payload.Reference,
			Reason:           reason,
			PaymentStatus:    &status,
		}, nil
	case "payment_failed":
		status := model.PaymentStatusFailed
		return model.ProviderWebhookEvent{
			Provider:         model.WebhookProviderSandboxPay,
			EventID:          payload.EventID,
			EventType:        payload.EventType,
			LinkedEntityType: model.WebhookLinkedEntityPayment,
			Reference:        payload.Reference,
			Reason:           reason,
			PaymentStatus:    &status,
		}, nil
	default:
		return model.ProviderWebhookEvent{}, ErrWebhookInvalidPayload
	}
}
