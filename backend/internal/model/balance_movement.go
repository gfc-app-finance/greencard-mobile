package model

import "time"

type BalanceMovementDirection string

const (
	BalanceMovementDirectionCredit BalanceMovementDirection = "credit"
	BalanceMovementDirectionDebit  BalanceMovementDirection = "debit"
)

type BalanceMovementType string

const (
	BalanceMovementTypeFundingCredit  BalanceMovementType = "funding_credit"
	BalanceMovementTypeTransferDebit  BalanceMovementType = "transfer_debit"
	BalanceMovementTypeTransferCredit BalanceMovementType = "transfer_credit"
	BalanceMovementTypePaymentDebit   BalanceMovementType = "payment_debit"
	BalanceMovementTypeReversal       BalanceMovementType = "reversal"
)

type BalanceMovementRecord struct {
	ID               string                   `json:"id"`
	UserID           string                   `json:"user_id"`
	AccountID        string                   `json:"account_id"`
	LinkedEntityType LinkedEntityType         `json:"linked_entity_type"`
	LinkedEntityID   string                   `json:"linked_entity_id"`
	MovementType     BalanceMovementType      `json:"movement_type"`
	Direction        BalanceMovementDirection `json:"direction"`
	Amount           float64                  `json:"amount"`
	Currency         AccountCurrency          `json:"currency"`
	CreatedAt        *time.Time               `json:"created_at,omitempty"`
}

func (direction BalanceMovementDirection) IsValid() bool {
	switch direction {
	case BalanceMovementDirectionCredit, BalanceMovementDirectionDebit:
		return true
	default:
		return false
	}
}

func (movementType BalanceMovementType) IsValid() bool {
	switch movementType {
	case BalanceMovementTypeFundingCredit,
		BalanceMovementTypeTransferDebit,
		BalanceMovementTypeTransferCredit,
		BalanceMovementTypePaymentDebit,
		BalanceMovementTypeReversal:
		return true
	default:
		return false
	}
}
