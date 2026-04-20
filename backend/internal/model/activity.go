package model

import "time"

type ActivityType string

const (
	ActivityTypeFundingCreated    ActivityType = "funding_created"
	ActivityTypeFundingCompleted  ActivityType = "funding_completed"
	ActivityTypeFundingFailed     ActivityType = "funding_failed"
	ActivityTypeTransferCreated   ActivityType = "transfer_created"
	ActivityTypeTransferCompleted ActivityType = "transfer_completed"
	ActivityTypeTransferFailed    ActivityType = "transfer_failed"
	ActivityTypePaymentCreated    ActivityType = "payment_created"
	ActivityTypePaymentProcessing ActivityType = "payment_processing"
	ActivityTypePaymentCompleted  ActivityType = "payment_completed"
	ActivityTypePaymentFailed     ActivityType = "payment_failed"
	ActivityTypeTicketCreated     ActivityType = "ticket_created"
	ActivityTypeTicketUpdated     ActivityType = "ticket_updated"
	ActivityTypeTicketResolved    ActivityType = "ticket_resolved"
	ActivityTypeAccountCreated    ActivityType = "account_created"
)

type ActivityStatus string

const (
	ActivityStatusInitiated   ActivityStatus = "initiated"
	ActivityStatusPending     ActivityStatus = "pending"
	ActivityStatusCompleted   ActivityStatus = "completed"
	ActivityStatusFailed      ActivityStatus = "failed"
	ActivityStatusSubmitted   ActivityStatus = "submitted"
	ActivityStatusUnderReview ActivityStatus = "under_review"
	ActivityStatusProcessing  ActivityStatus = "processing"
	ActivityStatusConverting  ActivityStatus = "converting"
	ActivityStatusOpen        ActivityStatus = "open"
	ActivityStatusInvestigating ActivityStatus = "investigating"
	ActivityStatusResolved    ActivityStatus = "resolved"
	ActivityStatusClosed      ActivityStatus = "closed"
)

type LinkedEntityType string

const (
	LinkedEntityTypeFundingTransaction  LinkedEntityType = "funding_transaction"
	LinkedEntityTypeTransferTransaction LinkedEntityType = "transfer_transaction"
	LinkedEntityTypePaymentTransaction  LinkedEntityType = "payment_transaction"
	LinkedEntityTypeSupportTicket       LinkedEntityType = "support_ticket"
	LinkedEntityTypeAccount             LinkedEntityType = "account"
)

type ActivityRecord struct {
	ID               string            `json:"id,omitempty"`
	UserID           string            `json:"user_id"`
	Type             ActivityType      `json:"type"`
	Title            string            `json:"title"`
	Subtitle         string            `json:"subtitle,omitempty"`
	Amount           *float64          `json:"amount,omitempty"`
	Currency         *AccountCurrency  `json:"currency,omitempty"`
	Status           ActivityStatus    `json:"status"`
	LinkedEntityType LinkedEntityType  `json:"linked_entity_type"`
	LinkedEntityID   string            `json:"linked_entity_id"`
	CreatedAt        *time.Time        `json:"created_at,omitempty"`
	UpdatedAt        *time.Time        `json:"updated_at,omitempty"`
}

type ActivityItem struct {
	ID               string           `json:"id"`
	Type             ActivityType     `json:"type"`
	Title            string           `json:"title"`
	Subtitle         string           `json:"subtitle,omitempty"`
	Amount           *float64         `json:"amount,omitempty"`
	Currency         *AccountCurrency `json:"currency,omitempty"`
	Status           ActivityStatus   `json:"status"`
	LinkedEntityType LinkedEntityType `json:"linked_entity_type"`
	LinkedEntityID   string           `json:"linked_entity_id"`
	CreatedAt        *time.Time       `json:"created_at,omitempty"`
	UpdatedAt        *time.Time       `json:"updated_at,omitempty"`
}

type ActivityListResponse struct {
	Activities []ActivityItem `json:"activities"`
}

func (activityType ActivityType) IsValid() bool {
	switch activityType {
	case ActivityTypeFundingCreated,
		ActivityTypeFundingCompleted,
		ActivityTypeFundingFailed,
		ActivityTypeTransferCreated,
		ActivityTypeTransferCompleted,
		ActivityTypeTransferFailed,
		ActivityTypePaymentCreated,
		ActivityTypePaymentProcessing,
		ActivityTypePaymentCompleted,
		ActivityTypePaymentFailed,
		ActivityTypeTicketCreated,
		ActivityTypeTicketUpdated,
		ActivityTypeTicketResolved,
		ActivityTypeAccountCreated:
		return true
	default:
		return false
	}
}

func (status ActivityStatus) IsValid() bool {
	switch status {
	case ActivityStatusInitiated,
		ActivityStatusPending,
		ActivityStatusCompleted,
		ActivityStatusFailed,
		ActivityStatusSubmitted,
		ActivityStatusUnderReview,
		ActivityStatusProcessing,
		ActivityStatusConverting,
		ActivityStatusOpen,
		ActivityStatusInvestigating,
		ActivityStatusResolved,
		ActivityStatusClosed:
		return true
	default:
		return false
	}
}

func (linkedEntityType LinkedEntityType) IsValid() bool {
	switch linkedEntityType {
	case LinkedEntityTypeFundingTransaction,
		LinkedEntityTypeTransferTransaction,
		LinkedEntityTypePaymentTransaction,
		LinkedEntityTypeSupportTicket,
		LinkedEntityTypeAccount:
		return true
	default:
		return false
	}
}
