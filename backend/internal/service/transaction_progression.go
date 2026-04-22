package service

import (
	"context"
	"log/slog"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

// These helpers intentionally remain explicit and are no longer invoked from
// list/detail reads. They are kept for controlled local simulation and future
// worker-based progression instead of mutating state from GET requests.

func nextFundingStatus(record model.FundingTransactionRecord) model.FundingStatus {
	if record.Status == model.FundingStatusCompleted || record.Status == model.FundingStatusFailed {
		return record.Status
	}

	elapsed := elapsedSince(record.CreatedAt)
	if elapsed >= 15*time.Second {
		return model.FundingStatusCompleted
	}
	if elapsed >= 5*time.Second {
		return model.FundingStatusPending
	}

	return model.FundingStatusInitiated
}

func nextTransferStatus(record model.TransferTransactionRecord) model.TransferStatus {
	if record.Status == model.TransferStatusCompleted || record.Status == model.TransferStatusFailed {
		return record.Status
	}

	elapsed := elapsedSince(record.CreatedAt)
	if elapsed >= 15*time.Second {
		return model.TransferStatusCompleted
	}
	if elapsed >= 5*time.Second {
		return model.TransferStatusConverting
	}

	return model.TransferStatusInitiated
}

func nextPaymentStatus(record model.PaymentTransactionRecord) model.PaymentStatus {
	if record.Status == model.PaymentStatusCompleted || record.Status == model.PaymentStatusFailed {
		return record.Status
	}

	elapsed := elapsedSince(record.CreatedAt)
	if elapsed >= 25*time.Second {
		return model.PaymentStatusCompleted
	}
	if elapsed >= 12*time.Second {
		return model.PaymentStatusProcessing
	}
	if elapsed >= 4*time.Second {
		return model.PaymentStatusUnderReview
	}

	return model.PaymentStatusSubmitted
}

func elapsedSince(timestamp *time.Time) time.Duration {
	if timestamp == nil {
		return 0
	}

	return time.Since(*timestamp)
}

func (s *DefaultTransactionService) SimulateAdvanceFunding(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.FundingTransactionResponse, error) {
	record, found, err := s.fundingRepo.GetFundingByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch funding transaction for simulated transition", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessFundingTransaction(user, record) {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	return s.UpdateFundingStatus(
		ctx,
		user,
		transactionID,
		simulateFundingStatusTransition(record.Status),
		model.TransactionStatusSourceSimulation,
		optionalStringPointer("advanced by non-production simulation"),
	)
}

func (s *DefaultTransactionService) SimulateAdvanceTransfer(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.TransferTransactionResponse, error) {
	record, found, err := s.transferRepo.GetTransferByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch transfer transaction for simulated transition", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessTransferTransaction(user, record) {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	return s.UpdateTransferStatus(
		ctx,
		user,
		transactionID,
		simulateTransferStatusTransition(record.Status),
		model.TransactionStatusSourceSimulation,
		optionalStringPointer("advanced by non-production simulation"),
	)
}

func (s *DefaultTransactionService) SimulateAdvancePayment(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.PaymentTransactionResponse, error) {
	record, found, err := s.paymentRepo.GetPaymentByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch payment transaction for simulated transition", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessPaymentTransaction(user, record) {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	return s.UpdatePaymentStatus(
		ctx,
		user,
		transactionID,
		simulatePaymentStatusTransition(record.Status),
		model.TransactionStatusSourceSimulation,
		optionalStringPointer("advanced by non-production simulation"),
	)
}

func simulateFundingStatusTransition(status model.FundingStatus) model.FundingStatus {
	switch status {
	case model.FundingStatusInitiated:
		return model.FundingStatusPending
	case model.FundingStatusPending:
		return model.FundingStatusCompleted
	default:
		return status
	}
}

func simulateTransferStatusTransition(status model.TransferStatus) model.TransferStatus {
	switch status {
	case model.TransferStatusInitiated:
		return model.TransferStatusConverting
	case model.TransferStatusConverting:
		return model.TransferStatusCompleted
	default:
		return status
	}
}

func simulatePaymentStatusTransition(status model.PaymentStatus) model.PaymentStatus {
	switch status {
	case model.PaymentStatusSubmitted:
		return model.PaymentStatusUnderReview
	case model.PaymentStatusUnderReview:
		return model.PaymentStatusProcessing
	case model.PaymentStatusProcessing:
		return model.PaymentStatusCompleted
	default:
		return status
	}
}
