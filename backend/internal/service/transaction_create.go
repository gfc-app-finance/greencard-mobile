package service

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func (s *DefaultTransactionService) CreateFunding(ctx context.Context, user model.AuthenticatedUser, input model.CreateFundingTransactionInput) (model.FundingTransactionResponse, error) {
	status, err := s.verification.ResolveForUser(ctx, user.ID)
	if err != nil {
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}

	if !s.permissions.CanCreateFunding(status) {
		s.recordAudit(ctx, user.ID, model.AuditActionPermissionDenied, model.AuditEntityPermission, user.ID, model.AuditSourceAPI, map[string]any{
			"permission":          "transaction.funding.create",
			"verification_status": status,
		})
		return model.FundingTransactionResponse{}, ErrTransactionPermissionDenied
	}

	account, validationErrors := s.validateFundingInput(ctx, user.ID, input)
	if len(validationErrors) > 0 {
		return model.FundingTransactionResponse{}, validationErrors
	}

	now := time.Now().UTC()
	record := model.FundingTransactionRecord{
		UserID:             user.ID,
		AccountID:          account.ID,
		Amount:             roundTo2(input.Amount),
		Currency:           input.Currency,
		Status:             model.FundingStatusInitiated,
		StatusSource:       statusSourcePointer(model.TransactionStatusSourceSystem),
		LastStatusChangeAt: &now,
		Reference:          newTransactionReference("FUND", user.ID),
		CreatedAt:          &now,
		UpdatedAt:          &now,
	}

	savedRecord, err := s.fundingRepo.CreateFunding(ctx, record)
	if err != nil {
		s.logger.Error("failed to create funding transaction", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}

	s.syncFundingActivity(ctx, user.ID, savedRecord)
	s.recordAudit(ctx, user.ID, model.AuditActionTransactionCreated, model.AuditEntityFundingTransaction, savedRecord.ID, model.AuditSourceAPI, map[string]any{
		"account_id": savedRecord.AccountID,
		"amount":     savedRecord.Amount,
		"currency":   savedRecord.Currency,
		"status":     savedRecord.Status,
		"reference":  savedRecord.Reference,
	})

	return model.FundingTransactionResponse{Transaction: buildFundingTransaction(savedRecord)}, nil
}

func (s *DefaultTransactionService) CreateTransfer(ctx context.Context, user model.AuthenticatedUser, input model.CreateTransferTransactionInput) (model.TransferTransactionResponse, error) {
	status, err := s.verification.ResolveForUser(ctx, user.ID)
	if err != nil {
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}

	if !s.permissions.CanCreateTransfer(status) {
		s.recordAudit(ctx, user.ID, model.AuditActionPermissionDenied, model.AuditEntityPermission, user.ID, model.AuditSourceAPI, map[string]any{
			"permission":          "transaction.transfer.create",
			"verification_status": status,
		})
		return model.TransferTransactionResponse{}, ErrTransactionPermissionDenied
	}

	sourceAccount, destinationAccount, destinationAmount, fxRate, validationErrors := s.validateTransferInput(ctx, user.ID, input)
	if len(validationErrors) > 0 {
		return model.TransferTransactionResponse{}, validationErrors
	}

	now := time.Now().UTC()
	record := model.TransferTransactionRecord{
		UserID:               user.ID,
		SourceAccountID:      sourceAccount.ID,
		DestinationAccountID: destinationAccount.ID,
		SourceCurrency:       input.SourceCurrency,
		DestinationCurrency:  input.DestinationCurrency,
		SourceAmount:         roundTo2(input.SourceAmount),
		DestinationAmount:    destinationAmount,
		FXRate:               fxRate,
		Status:               model.TransferStatusInitiated,
		StatusSource:         statusSourcePointer(model.TransactionStatusSourceSystem),
		LastStatusChangeAt:   &now,
		Reference:            newTransactionReference("XFER", user.ID),
		CreatedAt:            &now,
		UpdatedAt:            &now,
	}

	savedRecord, err := s.transferRepo.CreateTransfer(ctx, record)
	if err != nil {
		s.logger.Error("failed to create transfer transaction", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}

	s.syncTransferActivity(ctx, user.ID, savedRecord)
	s.recordAudit(ctx, user.ID, model.AuditActionTransactionCreated, model.AuditEntityTransferTransaction, savedRecord.ID, model.AuditSourceAPI, map[string]any{
		"source_account_id":      savedRecord.SourceAccountID,
		"destination_account_id": savedRecord.DestinationAccountID,
		"source_amount":          savedRecord.SourceAmount,
		"source_currency":        savedRecord.SourceCurrency,
		"destination_amount":     savedRecord.DestinationAmount,
		"destination_currency":   savedRecord.DestinationCurrency,
		"status":                 savedRecord.Status,
		"reference":              savedRecord.Reference,
	})

	return model.TransferTransactionResponse{Transaction: buildTransferTransaction(savedRecord)}, nil
}

func (s *DefaultTransactionService) CreatePayment(ctx context.Context, user model.AuthenticatedUser, input model.CreatePaymentTransactionInput) (model.PaymentTransactionResponse, error) {
	status, err := s.verification.ResolveForUser(ctx, user.ID)
	if err != nil {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}

	if !s.permissions.CanCreatePayment(status) {
		s.recordAudit(ctx, user.ID, model.AuditActionPermissionDenied, model.AuditEntityPermission, user.ID, model.AuditSourceAPI, map[string]any{
			"permission":          "transaction.payment.create",
			"verification_status": status,
		})
		return model.PaymentTransactionResponse{}, ErrTransactionPermissionDenied
	}

	sourceAccount, recipient, fee, fxRate, validationErrors := s.validatePaymentInput(ctx, user.ID, input)
	if len(validationErrors) > 0 {
		return model.PaymentTransactionResponse{}, validationErrors
	}

	now := time.Now().UTC()
	amount := roundTo2(input.Amount)
	totalAmount := roundTo2(amount + fee)
	recipientReference := recipientDisplayLabel(recipient)
	recipientID := strings.TrimSpace(recipient.ID)

	record := model.PaymentTransactionRecord{
		UserID:             user.ID,
		SourceAccountID:    sourceAccount.ID,
		RecipientID:        optionalStringPointer(recipientID),
		RecipientReference: recipientReference,
		PaymentType:        input.PaymentType,
		Amount:             amount,
		Currency:           input.Currency,
		Fee:                fee,
		FXRate:             fxRate,
		TotalAmount:        totalAmount,
		Status:             model.PaymentStatusSubmitted,
		StatusSource:       statusSourcePointer(model.TransactionStatusSourceSystem),
		LastStatusChangeAt: &now,
		Reference:          newTransactionReference("PMT", user.ID),
		CreatedAt:          &now,
		UpdatedAt:          &now,
	}

	savedRecord, err := s.paymentRepo.CreatePayment(ctx, record)
	if err != nil {
		s.logger.Error("failed to create payment transaction", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}

	s.syncPaymentActivity(ctx, user.ID, savedRecord)
	s.recordAudit(ctx, user.ID, model.AuditActionTransactionCreated, model.AuditEntityPaymentTransaction, savedRecord.ID, model.AuditSourceAPI, map[string]any{
		"source_account_id": savedRecord.SourceAccountID,
		"recipient_id":      savedRecord.RecipientID,
		"payment_type":      savedRecord.PaymentType,
		"amount":            savedRecord.Amount,
		"currency":          savedRecord.Currency,
		"fee":               savedRecord.Fee,
		"total_amount":      savedRecord.TotalAmount,
		"status":            savedRecord.Status,
		"reference":         savedRecord.Reference,
	})

	return model.PaymentTransactionResponse{Transaction: buildPaymentTransaction(savedRecord)}, nil
}
