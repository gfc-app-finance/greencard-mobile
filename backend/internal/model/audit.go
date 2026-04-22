package model

import "time"

type AuditAction string

const (
	AuditActionProfileUpdated              AuditAction = "profile.updated"
	AuditActionVerificationStatusChanged   AuditAction = "verification.status_changed"
	AuditActionVerificationProviderFailed  AuditAction = "verification.provider_failed"
	AuditActionRecipientCreated            AuditAction = "recipient.created"
	AuditActionTransactionCreated          AuditAction = "transaction.created"
	AuditActionTransactionStatusChanged    AuditAction = "transaction.status_changed"
	AuditActionBalanceEffectApplied        AuditAction = "balance.effect_applied"
	AuditActionSupportTicketCreated        AuditAction = "support.ticket_created"
	AuditActionPermissionDenied            AuditAction = "permission.denied"
	AuditActionWebhookProcessingReceived   AuditAction = "webhook.processing_received"
	AuditActionWebhookProcessingSucceeded  AuditAction = "webhook.processing_succeeded"
	AuditActionWebhookProcessingFailed     AuditAction = "webhook.processing_failed"
	AuditActionWebhookVerificationRejected AuditAction = "webhook.verification_rejected"
)

type AuditEntityType string

const (
	AuditEntityProfile             AuditEntityType = "profile"
	AuditEntityVerification        AuditEntityType = "verification"
	AuditEntityRecipient           AuditEntityType = "recipient"
	AuditEntityFundingTransaction  AuditEntityType = "funding_transaction"
	AuditEntityTransferTransaction AuditEntityType = "transfer_transaction"
	AuditEntityPaymentTransaction  AuditEntityType = "payment_transaction"
	AuditEntitySupportTicket       AuditEntityType = "support_ticket"
	AuditEntityWebhookEvent        AuditEntityType = "webhook_event"
	AuditEntityPermission          AuditEntityType = "permission"
)

type AuditSource string

const (
	AuditSourceAPI        AuditSource = "api"
	AuditSourceSystem     AuditSource = "system"
	AuditSourceProvider   AuditSource = "provider"
	AuditSourceWorker     AuditSource = "worker"
	AuditSourceSimulation AuditSource = "simulation"
)

type AuditLogRecord struct {
	ID              string          `json:"id,omitempty"`
	ActorUserID     *string         `json:"actor_user_id,omitempty"`
	Action          AuditAction     `json:"action"`
	EntityType      AuditEntityType `json:"entity_type"`
	EntityID        *string         `json:"entity_id,omitempty"`
	Source          AuditSource     `json:"source"`
	MetadataSummary map[string]any  `json:"metadata_summary,omitempty"`
	RequestID       *string         `json:"request_id,omitempty"`
	IPSummary       *string         `json:"ip_summary,omitempty"`
	Provider        *string         `json:"provider,omitempty"`
	CorrelationID   *string         `json:"correlation_id,omitempty"`
	CreatedAt       *time.Time      `json:"created_at,omitempty"`
}

type AuditEvent struct {
	ActorUserID   string
	Action        AuditAction
	EntityType    AuditEntityType
	EntityID      string
	Source        AuditSource
	Metadata      map[string]any
	RequestID     string
	IPSummary     string
	Provider      string
	CorrelationID string
}
