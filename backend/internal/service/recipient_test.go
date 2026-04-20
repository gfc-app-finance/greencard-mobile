package service

import (
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestValidateCreateRecipientInputRequiresAccountNumberForBank(t *testing.T) {
	record, validationErrors := validateCreateRecipientInput("user_123", model.CreateRecipientInput{
		Type:     model.RecipientTypeBank,
		FullName: "John Doe",
		BankName: "Providus Bank",
		Country:  "Nigeria",
		Currency: model.AccountCurrencyNGN,
	})

	if record.UserID != "user_123" {
		t.Fatalf("expected recipient to retain user ID, got %q", record.UserID)
	}

	if len(validationErrors) == 0 {
		t.Fatal("expected bank recipient without account number to fail validation")
	}
}

func TestBuildRecipientMasksSensitiveValues(t *testing.T) {
	accountNumber := "1234567890"
	iban := "GB29NWBK60161331926819"

	recipient := buildRecipient(model.RecipientRecord{
		ID:            "recipient_123",
		Type:          model.RecipientTypeInternationalBank,
		FullName:      "John Doe",
		BankName:      "Barclays",
		AccountNumber: &accountNumber,
		IBAN:          &iban,
		Country:       "United Kingdom",
		Currency:      model.AccountCurrencyGBP,
	})

	if recipient.AccountNumber == nil || *recipient.AccountNumber != "******7890" {
		t.Fatalf("expected masked account number, got %#v", recipient.AccountNumber)
	}

	if recipient.IBAN == nil || *recipient.IBAN == iban {
		t.Fatalf("expected masked IBAN, got %#v", recipient.IBAN)
	}
}
