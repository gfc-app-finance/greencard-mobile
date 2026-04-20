package model

import "time"

type SupportIssueType string

const (
	SupportIssueTypePaymentFailed  SupportIssueType = "payment_failed"
	SupportIssueTypeDelayedPayment SupportIssueType = "delayed_payment"
	SupportIssueTypeTransferIssue  SupportIssueType = "transfer_issue"
	SupportIssueTypeFundingIssue   SupportIssueType = "funding_issue"
	SupportIssueTypeAccountIssue   SupportIssueType = "account_issue"
	SupportIssueTypeCardIssue      SupportIssueType = "card_issue"
	SupportIssueTypeOther          SupportIssueType = "other"
)

type SupportTicketStatus string

const (
	SupportTicketStatusOpen          SupportTicketStatus = "open"
	SupportTicketStatusInvestigating SupportTicketStatus = "investigating"
	SupportTicketStatusResolved      SupportTicketStatus = "resolved"
	SupportTicketStatusClosed        SupportTicketStatus = "closed"
)

type SupportTicketPriority string

const (
	SupportTicketPriorityLow    SupportTicketPriority = "low"
	SupportTicketPriorityNormal SupportTicketPriority = "normal"
	SupportTicketPriorityHigh   SupportTicketPriority = "high"
)

type SupportMessageSenderType string

const (
	SupportMessageSenderTypeUser    SupportMessageSenderType = "user"
	SupportMessageSenderTypeSupport SupportMessageSenderType = "support"
)

type SupportTicketRecord struct {
	ID               string                 `json:"id"`
	UserID           string                 `json:"user_id"`
	Title            string                 `json:"title"`
	IssueType        SupportIssueType       `json:"issue_type"`
	Description      string                 `json:"description"`
	Status           SupportTicketStatus    `json:"status"`
	LinkedEntityType *LinkedEntityType      `json:"linked_entity_type,omitempty"`
	LinkedEntityID   *string                `json:"linked_entity_id,omitempty"`
	Priority         *SupportTicketPriority `json:"priority,omitempty"`
	CreatedAt        *time.Time             `json:"created_at,omitempty"`
	UpdatedAt        *time.Time             `json:"updated_at,omitempty"`
}

type SupportTicket struct {
	ID               string                 `json:"id"`
	Title            string                 `json:"title"`
	IssueType        SupportIssueType       `json:"issue_type"`
	Description      string                 `json:"description"`
	Status           SupportTicketStatus    `json:"status"`
	LinkedEntityType *LinkedEntityType      `json:"linked_entity_type,omitempty"`
	LinkedEntityID   *string                `json:"linked_entity_id,omitempty"`
	Priority         *SupportTicketPriority `json:"priority,omitempty"`
	CreatedAt        *time.Time             `json:"created_at,omitempty"`
	UpdatedAt        *time.Time             `json:"updated_at,omitempty"`
}

type SupportTicketMessageRecord struct {
	ID         string                   `json:"id"`
	TicketID   string                   `json:"ticket_id"`
	SenderType SupportMessageSenderType `json:"sender_type"`
	Message    string                   `json:"message"`
	CreatedAt  *time.Time               `json:"created_at,omitempty"`
}

type SupportTicketMessage struct {
	ID         string                   `json:"id"`
	TicketID   string                   `json:"ticket_id"`
	SenderType SupportMessageSenderType `json:"sender_type"`
	Message    string                   `json:"message"`
	CreatedAt  *time.Time               `json:"created_at,omitempty"`
}

type CreateSupportTicketInput struct {
	Title            string                 `json:"title"`
	IssueType        SupportIssueType       `json:"issue_type"`
	Description      string                 `json:"description"`
	LinkedEntityType *LinkedEntityType      `json:"linked_entity_type"`
	LinkedEntityID   *string                `json:"linked_entity_id"`
	Priority         *SupportTicketPriority `json:"priority"`
}

type CreateSupportTicketMessageInput struct {
	Message string `json:"message"`
}

type SupportTicketListResponse struct {
	Tickets []SupportTicket `json:"tickets"`
}

type SupportTicketResponse struct {
	Ticket SupportTicket `json:"ticket"`
}

type SupportTicketMessageListResponse struct {
	Messages []SupportTicketMessage `json:"messages"`
}

type SupportTicketMessageResponse struct {
	Message SupportTicketMessage `json:"message"`
}

func (issueType SupportIssueType) IsValid() bool {
	switch issueType {
	case SupportIssueTypePaymentFailed,
		SupportIssueTypeDelayedPayment,
		SupportIssueTypeTransferIssue,
		SupportIssueTypeFundingIssue,
		SupportIssueTypeAccountIssue,
		SupportIssueTypeCardIssue,
		SupportIssueTypeOther:
		return true
	default:
		return false
	}
}

func (status SupportTicketStatus) IsValid() bool {
	switch status {
	case SupportTicketStatusOpen,
		SupportTicketStatusInvestigating,
		SupportTicketStatusResolved,
		SupportTicketStatusClosed:
		return true
	default:
		return false
	}
}

func (priority SupportTicketPriority) IsValid() bool {
	switch priority {
	case SupportTicketPriorityLow,
		SupportTicketPriorityNormal,
		SupportTicketPriorityHigh:
		return true
	default:
		return false
	}
}

func (senderType SupportMessageSenderType) IsValid() bool {
	switch senderType {
	case SupportMessageSenderTypeUser, SupportMessageSenderTypeSupport:
		return true
	default:
		return false
	}
}
