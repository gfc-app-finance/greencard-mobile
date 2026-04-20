package service

import (
	"context"
	"log/slog"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func (s *DefaultTransactionService) validateFundingInput(ctx context.Context, userID string, input model.CreateFundingTransactionInput) (model.AccountRecord, ValidationErrors) {
	var validationErrors ValidationErrors

	input.AccountID = strings.TrimSpace(input.AccountID)
	if input.AccountID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "account_id", Message: "account_id is required"})
	}

	if input.Amount <= 0 {
		validationErrors = append(validationErrors, ValidationError{Field: "amount", Message: "amount must be greater than zero"})
	}

	if !input.Currency.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "currency", Message: "currency must be one of NGN, USD, GBP, or EUR"})
	}

	if len(validationErrors) > 0 {
		return model.AccountRecord{}, validationErrors
	}

	account, found, err := s.lookupOwnedAccount(ctx, userID, input.AccountID)
	if err != nil {
		s.logger.Error("failed to validate funding account", slog.String("user_id", userID), slog.String("account_id", input.AccountID), slog.String("error", err.Error()))
		return model.AccountRecord{}, ValidationErrors{{Field: "account_id", Message: "account data is temporarily unavailable"}}
	}

	if !found {
		return model.AccountRecord{}, ValidationErrors{{Field: "account_id", Message: "account_id must reference one of the authenticated user's accounts"}}
	}

	if !s.permissions.CanUseAccount(account.Status) {
		return model.AccountRecord{}, ValidationErrors{{Field: "account_id", Message: "funding is only available for active accounts"}}
	}

	if account.Currency != input.Currency {
		return model.AccountRecord{}, ValidationErrors{{Field: "currency", Message: "currency must match the selected account"}}
	}

	return account, nil
}

func (s *DefaultTransactionService) validateTransferInput(
	ctx context.Context,
	userID string,
	input model.CreateTransferTransactionInput,
) (model.AccountRecord, model.AccountRecord, float64, *float64, ValidationErrors) {
	var validationErrors ValidationErrors

	input.SourceAccountID = strings.TrimSpace(input.SourceAccountID)
	input.DestinationAccountID = strings.TrimSpace(input.DestinationAccountID)

	if input.SourceAccountID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "source_account_id", Message: "source_account_id is required"})
	}

	if input.DestinationAccountID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "destination_account_id", Message: "destination_account_id is required"})
	}

	if input.SourceAccountID != "" && input.SourceAccountID == input.DestinationAccountID {
		validationErrors = append(validationErrors, ValidationError{Field: "destination_account_id", Message: "destination_account_id must be different from source_account_id"})
	}

	if input.SourceAmount <= 0 {
		validationErrors = append(validationErrors, ValidationError{Field: "source_amount", Message: "source_amount must be greater than zero"})
	}

	if !input.SourceCurrency.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "source_currency", Message: "source_currency must be one of NGN, USD, GBP, or EUR"})
	}

	if !input.DestinationCurrency.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "destination_currency", Message: "destination_currency must be one of NGN, USD, GBP, or EUR"})
	}

	if len(validationErrors) > 0 {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, validationErrors
	}

	sourceAccount, found, err := s.lookupOwnedAccount(ctx, userID, input.SourceAccountID)
	if err != nil {
		s.logger.Error("failed to validate source transfer account", slog.String("user_id", userID), slog.String("account_id", input.SourceAccountID), slog.String("error", err.Error()))
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "source account data is temporarily unavailable"}}
	}

	if !found {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "source_account_id must reference one of the authenticated user's accounts"}}
	}

	destinationAccount, found, err := s.lookupOwnedAccount(ctx, userID, input.DestinationAccountID)
	if err != nil {
		s.logger.Error("failed to validate destination transfer account", slog.String("user_id", userID), slog.String("account_id", input.DestinationAccountID), slog.String("error", err.Error()))
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "destination_account_id", Message: "destination account data is temporarily unavailable"}}
	}

	if !found {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "destination_account_id", Message: "destination_account_id must reference one of the authenticated user's accounts"}}
	}

	if !s.permissions.CanUseAccount(sourceAccount.Status) {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "transfers are only available from active accounts"}}
	}

	if !s.permissions.CanUseAccount(destinationAccount.Status) {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "destination_account_id", Message: "transfers are only available into active accounts"}}
	}

	if sourceAccount.Currency != input.SourceCurrency {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "source_currency", Message: "source_currency must match the source account"}}
	}

	if destinationAccount.Currency != input.DestinationCurrency {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "destination_currency", Message: "destination_currency must match the destination account"}}
	}

	sourceAmount := roundTo2(input.SourceAmount)
	if sourceAccount.AvailableBalance < sourceAmount || sourceAccount.Balance < sourceAmount {
		return model.AccountRecord{}, model.AccountRecord{}, 0, nil, ValidationErrors{{Field: "source_amount", Message: "source account does not have enough available balance for this transfer"}}
	}

	destinationAmount, fxRate := convertAmount(input.SourceCurrency, input.DestinationCurrency, sourceAmount)

	return sourceAccount, destinationAccount, destinationAmount, fxRate, nil
}

func (s *DefaultTransactionService) validatePaymentInput(
	ctx context.Context,
	userID string,
	input model.CreatePaymentTransactionInput,
) (model.AccountRecord, model.RecipientRecord, float64, *float64, ValidationErrors) {
	var validationErrors ValidationErrors

	input.SourceAccountID = strings.TrimSpace(input.SourceAccountID)
	input.RecipientID = strings.TrimSpace(input.RecipientID)

	if input.SourceAccountID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "source_account_id", Message: "source_account_id is required"})
	}

	if input.RecipientID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "recipient_id", Message: "recipient_id is required"})
	}

	if !input.PaymentType.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "payment_type", Message: "payment_type must be bank or international"})
	}

	if input.Amount <= 0 {
		validationErrors = append(validationErrors, ValidationError{Field: "amount", Message: "amount must be greater than zero"})
	}

	if !input.Currency.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "currency", Message: "currency must be one of NGN, USD, GBP, or EUR"})
	}

	if len(validationErrors) > 0 {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, validationErrors
	}

	sourceAccount, found, err := s.lookupOwnedAccount(ctx, userID, input.SourceAccountID)
	if err != nil {
		s.logger.Error("failed to validate payment source account", slog.String("user_id", userID), slog.String("account_id", input.SourceAccountID), slog.String("error", err.Error()))
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "source account data is temporarily unavailable"}}
	}

	if !found {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "source_account_id must reference one of the authenticated user's accounts"}}
	}

	if !s.permissions.CanUseAccount(sourceAccount.Status) {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "source_account_id", Message: "payments are only available from active accounts"}}
	}

	if sourceAccount.Currency != input.Currency {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "currency", Message: "currency must match the selected source account"}}
	}

	recipient, found, err := s.lookupOwnedRecipient(ctx, userID, input.RecipientID)
	if err != nil {
		s.logger.Error("failed to validate payment recipient", slog.String("user_id", userID), slog.String("recipient_id", input.RecipientID), slog.String("error", err.Error()))
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "recipient_id", Message: "recipient data is temporarily unavailable"}}
	}

	if !found {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "recipient_id", Message: "recipient_id must reference one of the authenticated user's recipients"}}
	}

	if recipient.Currency != input.Currency {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "currency", Message: "currency must match the selected recipient"}}
	}

	if !paymentTypeSupportsRecipient(input.PaymentType, recipient.Type) {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "payment_type", Message: "payment_type is not compatible with the selected recipient"}}
	}

	amount := roundTo2(input.Amount)
	_, fxRate := convertAmount(sourceAccount.Currency, input.Currency, amount)
	fee := roundTo2(mockPaymentFee(input.PaymentType, input.Currency))
	totalAmount := roundTo2(amount + fee)
	if sourceAccount.AvailableBalance < totalAmount || sourceAccount.Balance < totalAmount {
		return model.AccountRecord{}, model.RecipientRecord{}, 0, nil, ValidationErrors{{Field: "amount", Message: "source account does not have enough available balance for this payment"}}
	}

	return sourceAccount, recipient, fee, fxRate, nil
}

func (s *DefaultTransactionService) lookupOwnedAccount(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error) {
	return s.accountRepo.GetByIDForUser(ctx, userID, accountID)
}

func (s *DefaultTransactionService) lookupOwnedRecipient(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error) {
	if s.recipientRepo == nil {
		return model.RecipientRecord{}, false, nil
	}

	return s.recipientRepo.GetByIDForUser(ctx, userID, recipientID)
}

func paymentTypeSupportsRecipient(paymentType model.PaymentType, recipientType model.RecipientType) bool {
	switch paymentType {
	case model.PaymentTypeInternational:
		return recipientType == model.RecipientTypeInternationalBank
	case model.PaymentTypeBank:
		return recipientType == model.RecipientTypeBank
	default:
		return false
	}
}
