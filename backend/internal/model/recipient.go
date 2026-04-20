package model

import "time"

type RecipientType string

const (
	RecipientTypeBank              RecipientType = "bank"
	RecipientTypeInternationalBank RecipientType = "international_bank"
)

type RecipientRecord struct {
	ID            string          `json:"id"`
	UserID        string          `json:"user_id"`
	Type          RecipientType   `json:"type"`
	FullName      string          `json:"full_name"`
	BankName      string          `json:"bank_name"`
	AccountNumber *string         `json:"account_number,omitempty"`
	IBAN          *string         `json:"iban,omitempty"`
	RoutingNumber *string         `json:"routing_number,omitempty"`
	SortCode      *string         `json:"sort_code,omitempty"`
	SwiftCode     *string         `json:"swift_code,omitempty"`
	Country       string          `json:"country"`
	Currency      AccountCurrency `json:"currency"`
	Nickname      *string         `json:"nickname,omitempty"`
	CreatedAt     *time.Time      `json:"created_at,omitempty"`
	UpdatedAt     *time.Time      `json:"updated_at,omitempty"`
}

type Recipient struct {
	ID            string          `json:"id"`
	Type          RecipientType   `json:"type"`
	FullName      string          `json:"full_name"`
	BankName      string          `json:"bank_name"`
	AccountNumber *string         `json:"account_number,omitempty"`
	IBAN          *string         `json:"iban,omitempty"`
	RoutingNumber *string         `json:"routing_number,omitempty"`
	SortCode      *string         `json:"sort_code,omitempty"`
	SwiftCode     *string         `json:"swift_code,omitempty"`
	Country       string          `json:"country"`
	Currency      AccountCurrency `json:"currency"`
	Nickname      *string         `json:"nickname,omitempty"`
	CreatedAt     *time.Time      `json:"created_at,omitempty"`
	UpdatedAt     *time.Time      `json:"updated_at,omitempty"`
}

type CreateRecipientInput struct {
	Type          RecipientType   `json:"type"`
	FullName      string          `json:"full_name"`
	BankName      string          `json:"bank_name"`
	AccountNumber string          `json:"account_number"`
	IBAN          string          `json:"iban"`
	RoutingNumber string          `json:"routing_number"`
	SortCode      string          `json:"sort_code"`
	SwiftCode     string          `json:"swift_code"`
	Country       string          `json:"country"`
	Currency      AccountCurrency `json:"currency"`
	Nickname      string          `json:"nickname"`
}

type RecipientListResponse struct {
	Recipients []Recipient `json:"recipients"`
}

type RecipientResponse struct {
	Recipient Recipient `json:"recipient"`
}

func (recipientType RecipientType) IsValid() bool {
	switch recipientType {
	case RecipientTypeBank, RecipientTypeInternationalBank:
		return true
	default:
		return false
	}
}
