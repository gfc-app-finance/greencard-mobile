package model

import "time"

type WebhookProvider string

const (
	WebhookProviderSandboxPay WebhookProvider = "sandboxpay"
)

type WebhookProcessingStatus string

const (
	WebhookProcessingStatusReceived  WebhookProcessingStatus = "received"
	WebhookProcessingStatusProcessed WebhookProcessingStatus = "processed"
	WebhookProcessingStatusFailed    WebhookProcessingStatus = "failed"
)

type WebhookLinkedEntityType string

const (
	WebhookLinkedEntityFunding  WebhookLinkedEntityType = "funding_transaction"
	WebhookLinkedEntityTransfer WebhookLinkedEntityType = "transfer_transaction"
	WebhookLinkedEntityPayment  WebhookLinkedEntityType = "payment_transaction"
)

type ProviderWebhookEvent struct {
	Provider         WebhookProvider
	EventID          string
	EventType        string
	LinkedEntityType WebhookLinkedEntityType
	Reference        string
	Reason           *string
	FundingStatus    *FundingStatus
	TransferStatus   *TransferStatus
	PaymentStatus    *PaymentStatus
}

type WebhookEventRecord struct {
	ID               string                   `json:"id"`
	Provider         WebhookProvider          `json:"provider"`
	EventID          string                   `json:"event_id"`
	EventType        string                   `json:"event_type"`
	LinkedEntityType *WebhookLinkedEntityType `json:"linked_entity_type,omitempty"`
	LinkedEntityID   *string                  `json:"linked_entity_id,omitempty"`
	LinkedReference  *string                  `json:"linked_reference,omitempty"`
	ProcessingStatus WebhookProcessingStatus  `json:"processing_status"`
	StatusMessage    *string                  `json:"status_message,omitempty"`
	ReceivedAt       *time.Time               `json:"received_at,omitempty"`
	ProcessedAt      *time.Time               `json:"processed_at,omitempty"`
	UpdatedAt        *time.Time               `json:"updated_at,omitempty"`
}

type WebhookHandleResult struct {
	Provider WebhookProvider `json:"provider"`
	EventID  string          `json:"event_id"`
	Status   string          `json:"status"`
}

func (provider WebhookProvider) IsValid() bool {
	switch provider {
	case WebhookProviderSandboxPay:
		return true
	default:
		return false
	}
}

func (status WebhookProcessingStatus) IsValid() bool {
	switch status {
	case WebhookProcessingStatusReceived, WebhookProcessingStatusProcessed, WebhookProcessingStatusFailed:
		return true
	default:
		return false
	}
}

func (entityType WebhookLinkedEntityType) IsValid() bool {
	switch entityType {
	case WebhookLinkedEntityFunding, WebhookLinkedEntityTransfer, WebhookLinkedEntityPayment:
		return true
	default:
		return false
	}
}
