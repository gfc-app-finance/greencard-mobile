package model

import "time"

type PaymentType string

const (
	PaymentTypeBank          PaymentType = "bank"
	PaymentTypeInternational PaymentType = "international"
)

type FundingStatus string

const (
	FundingStatusInitiated FundingStatus = "initiated"
	FundingStatusPending   FundingStatus = "pending"
	FundingStatusCompleted FundingStatus = "completed"
	FundingStatusFailed    FundingStatus = "failed"
)

type TransferStatus string

const (
	TransferStatusInitiated  TransferStatus = "initiated"
	TransferStatusConverting TransferStatus = "converting"
	TransferStatusCompleted  TransferStatus = "completed"
	TransferStatusFailed     TransferStatus = "failed"
)

type PaymentStatus string

const (
	PaymentStatusSubmitted   PaymentStatus = "submitted"
	PaymentStatusUnderReview PaymentStatus = "under_review"
	PaymentStatusProcessing  PaymentStatus = "processing"
	PaymentStatusCompleted   PaymentStatus = "completed"
	PaymentStatusFailed      PaymentStatus = "failed"
)

type FundingTransactionRecord struct {
	ID        string          `json:"id"`
	UserID    string          `json:"user_id"`
	AccountID string          `json:"account_id"`
	Amount    float64         `json:"amount"`
	Currency  AccountCurrency `json:"currency"`
	Status    FundingStatus   `json:"status"`
	Reference string          `json:"reference"`
	CreatedAt *time.Time      `json:"created_at,omitempty"`
	UpdatedAt *time.Time      `json:"updated_at,omitempty"`
}

type TransferTransactionRecord struct {
	ID                   string          `json:"id"`
	UserID               string          `json:"user_id"`
	SourceAccountID      string          `json:"source_account_id"`
	DestinationAccountID string          `json:"destination_account_id"`
	SourceCurrency       AccountCurrency `json:"source_currency"`
	DestinationCurrency  AccountCurrency `json:"destination_currency"`
	SourceAmount         float64         `json:"source_amount"`
	DestinationAmount    float64         `json:"destination_amount"`
	FXRate               *float64        `json:"fx_rate,omitempty"`
	Status               TransferStatus  `json:"status"`
	Reference            string          `json:"reference"`
	CreatedAt            *time.Time      `json:"created_at,omitempty"`
	UpdatedAt            *time.Time      `json:"updated_at,omitempty"`
}

type PaymentTransactionRecord struct {
	ID                 string          `json:"id"`
	UserID             string          `json:"user_id"`
	SourceAccountID    string          `json:"source_account_id"`
	RecipientID        *string         `json:"recipient_id,omitempty"`
	RecipientReference string          `json:"recipient_reference"`
	PaymentType        PaymentType     `json:"payment_type"`
	Amount             float64         `json:"amount"`
	Currency           AccountCurrency `json:"currency"`
	Fee                float64         `json:"fee"`
	FXRate             *float64        `json:"fx_rate,omitempty"`
	TotalAmount        float64         `json:"total_amount"`
	Status             PaymentStatus   `json:"status"`
	Reference          string          `json:"reference"`
	CreatedAt          *time.Time      `json:"created_at,omitempty"`
	UpdatedAt          *time.Time      `json:"updated_at,omitempty"`
}

type FundingTransaction struct {
	ID        string                 `json:"id"`
	Type      string                 `json:"type"`
	AccountID string                 `json:"account_id"`
	Amount    TransactionAmount      `json:"amount"`
	Status    FundingStatus          `json:"status"`
	Reference string                 `json:"reference"`
	CreatedAt *time.Time             `json:"created_at,omitempty"`
	UpdatedAt *time.Time             `json:"updated_at,omitempty"`
	Timeline  []TransactionStepState `json:"timeline,omitempty"`
}

type TransferTransaction struct {
	ID                   string                 `json:"id"`
	Type                 string                 `json:"type"`
	SourceAccountID      string                 `json:"source_account_id"`
	DestinationAccountID string                 `json:"destination_account_id"`
	SourceAmount         TransactionAmount      `json:"source_amount"`
	DestinationAmount    TransactionAmount      `json:"destination_amount"`
	FXRate               *float64               `json:"fx_rate,omitempty"`
	Status               TransferStatus         `json:"status"`
	Reference            string                 `json:"reference"`
	CreatedAt            *time.Time             `json:"created_at,omitempty"`
	UpdatedAt            *time.Time             `json:"updated_at,omitempty"`
	Timeline             []TransactionStepState `json:"timeline,omitempty"`
}

type PaymentTransaction struct {
	ID                 string                 `json:"id"`
	Type               string                 `json:"type"`
	SourceAccountID    string                 `json:"source_account_id"`
	RecipientID        *string                `json:"recipient_id,omitempty"`
	RecipientReference string                 `json:"recipient_reference"`
	PaymentType        PaymentType            `json:"payment_type"`
	Amount             TransactionAmount      `json:"amount"`
	Fee                TransactionAmount      `json:"fee"`
	FXRate             *float64               `json:"fx_rate,omitempty"`
	TotalAmount        TransactionAmount      `json:"total_amount"`
	Status             PaymentStatus          `json:"status"`
	Reference          string                 `json:"reference"`
	CreatedAt          *time.Time             `json:"created_at,omitempty"`
	UpdatedAt          *time.Time             `json:"updated_at,omitempty"`
	Timeline           []TransactionStepState `json:"timeline,omitempty"`
}

type TransactionAmount struct {
	Value    float64         `json:"value"`
	Currency AccountCurrency `json:"currency"`
}

type TransactionStepState struct {
	Code        string     `json:"code"`
	Label       string     `json:"label"`
	IsCompleted bool       `json:"is_completed"`
	IsCurrent   bool       `json:"is_current"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
}

type CreateFundingTransactionInput struct {
	AccountID string          `json:"account_id"`
	Amount    float64         `json:"amount"`
	Currency  AccountCurrency `json:"currency"`
}

type CreateTransferTransactionInput struct {
	SourceAccountID      string          `json:"source_account_id"`
	DestinationAccountID string          `json:"destination_account_id"`
	SourceCurrency       AccountCurrency `json:"source_currency"`
	DestinationCurrency  AccountCurrency `json:"destination_currency"`
	SourceAmount         float64         `json:"source_amount"`
}

type CreatePaymentTransactionInput struct {
	SourceAccountID string          `json:"source_account_id"`
	RecipientID     string          `json:"recipient_id"`
	PaymentType     PaymentType     `json:"payment_type"`
	Amount          float64         `json:"amount"`
	Currency        AccountCurrency `json:"currency"`
}

type FundingTransactionListResponse struct {
	Transactions []FundingTransaction `json:"transactions"`
}

type FundingTransactionResponse struct {
	Transaction FundingTransaction `json:"transaction"`
}

type TransferTransactionListResponse struct {
	Transactions []TransferTransaction `json:"transactions"`
}

type TransferTransactionResponse struct {
	Transaction TransferTransaction `json:"transaction"`
}

type PaymentTransactionListResponse struct {
	Transactions []PaymentTransaction `json:"transactions"`
}

type PaymentTransactionResponse struct {
	Transaction PaymentTransaction `json:"transaction"`
}

func (status FundingStatus) IsValid() bool {
	switch status {
	case FundingStatusInitiated, FundingStatusPending, FundingStatusCompleted, FundingStatusFailed:
		return true
	default:
		return false
	}
}

func (status TransferStatus) IsValid() bool {
	switch status {
	case TransferStatusInitiated, TransferStatusConverting, TransferStatusCompleted, TransferStatusFailed:
		return true
	default:
		return false
	}
}

func (status PaymentStatus) IsValid() bool {
	switch status {
	case PaymentStatusSubmitted, PaymentStatusUnderReview, PaymentStatusProcessing, PaymentStatusCompleted, PaymentStatusFailed:
		return true
	default:
		return false
	}
}

func (paymentType PaymentType) IsValid() bool {
	switch paymentType {
	case PaymentTypeBank, PaymentTypeInternational:
		return true
	default:
		return false
	}
}
