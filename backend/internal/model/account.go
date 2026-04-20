package model

import "time"

type AccountCurrency string

const (
	AccountCurrencyNGN AccountCurrency = "NGN"
	AccountCurrencyUSD AccountCurrency = "USD"
	AccountCurrencyGBP AccountCurrency = "GBP"
	AccountCurrencyEUR AccountCurrency = "EUR"
)

type AccountStatus string

const (
	AccountStatusPending    AccountStatus = "pending"
	AccountStatusActive     AccountStatus = "active"
	AccountStatusRestricted AccountStatus = "restricted"
)

type AccountRecord struct {
	ID               string          `json:"id"`
	UserID           string          `json:"user_id"`
	Currency         AccountCurrency `json:"currency"`
	AccountType      string          `json:"account_type"`
	DisplayName      string          `json:"display_name"`
	Balance          float64         `json:"balance"`
	AvailableBalance float64         `json:"available_balance"`
	MaskedIdentifier string          `json:"masked_identifier,omitempty"`
	Provider         string          `json:"provider,omitempty"`
	Status           AccountStatus   `json:"status"`
	CreatedAt        *time.Time      `json:"created_at,omitempty"`
	UpdatedAt        *time.Time      `json:"updated_at,omitempty"`
}

type AccountBalance struct {
	Current   float64         `json:"current"`
	Available float64         `json:"available"`
	Currency  AccountCurrency `json:"currency"`
}

type Account struct {
	ID               string          `json:"id"`
	Currency         AccountCurrency `json:"currency"`
	AccountType      string          `json:"account_type"`
	DisplayName      string          `json:"display_name"`
	MaskedIdentifier string          `json:"masked_identifier,omitempty"`
	Provider         string          `json:"provider,omitempty"`
	Status           AccountStatus   `json:"status"`
	Balance          AccountBalance  `json:"balance"`
	CreatedAt        *time.Time      `json:"created_at,omitempty"`
	UpdatedAt        *time.Time      `json:"updated_at,omitempty"`
}

type AccountListResponse struct {
	Accounts []Account `json:"accounts"`
}

type AccountDetailResponse struct {
	Account Account `json:"account"`
}

func (currency AccountCurrency) IsValid() bool {
	switch currency {
	case AccountCurrencyNGN,
		AccountCurrencyUSD,
		AccountCurrencyGBP,
		AccountCurrencyEUR:
		return true
	default:
		return false
	}
}

func (status AccountStatus) IsValid() bool {
	switch status {
	case AccountStatusPending,
		AccountStatusActive,
		AccountStatusRestricted:
		return true
	default:
		return false
	}
}
