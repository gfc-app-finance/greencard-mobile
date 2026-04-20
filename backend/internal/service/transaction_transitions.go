package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var ErrInvalidTransactionTransition = errors.New("invalid transaction transition")

func (s *DefaultTransactionService) applyFundingStatusTransition(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.FundingStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.FundingTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	record, found, err := s.fundingRepo.GetFundingByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch funding transaction for status update", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessFundingTransaction(user, record) {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	updated, changed, err := s.transitionFundingRecord(ctx, user.ID, record, targetStatus, source, reason)
	if err != nil {
		return model.FundingTransactionResponse{}, err
	}
	if changed {
		s.syncFundingActivity(ctx, user.ID, updated)
	}

	return model.FundingTransactionResponse{Transaction: buildFundingTransaction(updated)}, nil
}

func (s *DefaultTransactionService) UpdateFundingStatus(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.FundingStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.FundingTransactionResponse, error) {
	return s.applyFundingStatusTransition(ctx, user, transactionID, targetStatus, source, reason)
}

func (s *DefaultTransactionService) UpdateFundingStatusByReference(
	ctx context.Context,
	reference string,
	targetStatus model.FundingStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.FundingTransactionResponse, error) {
	reference = strings.TrimSpace(reference)
	if reference == "" {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	record, found, err := s.fundingRepo.GetFundingByReference(ctx, reference)
	if err != nil {
		s.logger.Error("failed to fetch funding transaction by reference", slog.String("reference", reference), slog.String("error", err.Error()))
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}
	if !found {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	updated, changed, err := s.transitionFundingRecord(ctx, record.UserID, record, targetStatus, source, reason)
	if err != nil {
		return model.FundingTransactionResponse{}, err
	}
	if changed {
		s.syncFundingActivity(ctx, record.UserID, updated)
	}

	return model.FundingTransactionResponse{Transaction: buildFundingTransaction(updated)}, nil
}

func (s *DefaultTransactionService) applyTransferStatusTransition(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.TransferStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.TransferTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	record, found, err := s.transferRepo.GetTransferByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch transfer transaction for status update", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessTransferTransaction(user, record) {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	updated, changed, err := s.transitionTransferRecord(ctx, user.ID, record, targetStatus, source, reason)
	if err != nil {
		return model.TransferTransactionResponse{}, err
	}
	if changed {
		s.syncTransferActivity(ctx, user.ID, updated)
	}

	return model.TransferTransactionResponse{Transaction: buildTransferTransaction(updated)}, nil
}

func (s *DefaultTransactionService) UpdateTransferStatus(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.TransferStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.TransferTransactionResponse, error) {
	return s.applyTransferStatusTransition(ctx, user, transactionID, targetStatus, source, reason)
}

func (s *DefaultTransactionService) UpdateTransferStatusByReference(
	ctx context.Context,
	reference string,
	targetStatus model.TransferStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.TransferTransactionResponse, error) {
	reference = strings.TrimSpace(reference)
	if reference == "" {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	record, found, err := s.transferRepo.GetTransferByReference(ctx, reference)
	if err != nil {
		s.logger.Error("failed to fetch transfer transaction by reference", slog.String("reference", reference), slog.String("error", err.Error()))
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}
	if !found {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	updated, changed, err := s.transitionTransferRecord(ctx, record.UserID, record, targetStatus, source, reason)
	if err != nil {
		return model.TransferTransactionResponse{}, err
	}
	if changed {
		s.syncTransferActivity(ctx, record.UserID, updated)
	}

	return model.TransferTransactionResponse{Transaction: buildTransferTransaction(updated)}, nil
}

func (s *DefaultTransactionService) applyPaymentStatusTransition(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.PaymentStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.PaymentTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	record, found, err := s.paymentRepo.GetPaymentByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch payment transaction for status update", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}
	if !found || !s.permissions.CanAccessPaymentTransaction(user, record) {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	updated, changed, err := s.transitionPaymentRecord(ctx, user.ID, record, targetStatus, source, reason)
	if err != nil {
		return model.PaymentTransactionResponse{}, err
	}
	if changed {
		s.syncPaymentActivity(ctx, user.ID, updated)
	}

	return model.PaymentTransactionResponse{Transaction: buildPaymentTransaction(updated)}, nil
}

func (s *DefaultTransactionService) UpdatePaymentStatus(
	ctx context.Context,
	user model.AuthenticatedUser,
	transactionID string,
	targetStatus model.PaymentStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.PaymentTransactionResponse, error) {
	return s.applyPaymentStatusTransition(ctx, user, transactionID, targetStatus, source, reason)
}

func (s *DefaultTransactionService) UpdatePaymentStatusByReference(
	ctx context.Context,
	reference string,
	targetStatus model.PaymentStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.PaymentTransactionResponse, error) {
	reference = strings.TrimSpace(reference)
	if reference == "" {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	record, found, err := s.paymentRepo.GetPaymentByReference(ctx, reference)
	if err != nil {
		s.logger.Error("failed to fetch payment transaction by reference", slog.String("reference", reference), slog.String("error", err.Error()))
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}
	if !found {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	updated, changed, err := s.transitionPaymentRecord(ctx, record.UserID, record, targetStatus, source, reason)
	if err != nil {
		return model.PaymentTransactionResponse{}, err
	}
	if changed {
		s.syncPaymentActivity(ctx, record.UserID, updated)
	}

	return model.PaymentTransactionResponse{Transaction: buildPaymentTransaction(updated)}, nil
}

func (s *DefaultTransactionService) transitionFundingRecord(
	ctx context.Context,
	userID string,
	record model.FundingTransactionRecord,
	targetStatus model.FundingStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.FundingTransactionRecord, bool, error) {
	if err := validateFundingStatusTransition(record.Status, targetStatus); err != nil {
		return model.FundingTransactionRecord{}, false, ErrInvalidTransactionTransition
	}
	if targetStatus == model.FundingStatusCompleted {
		updated, err := s.completeFundingRecord(ctx, userID, record, source, reason)
		if err != nil {
			return model.FundingTransactionRecord{}, false, err
		}

		return updated, record.Status != updated.Status, nil
	}
	if targetStatus == record.Status {
		return record, false, nil
	}

	updatedAt := time.Now().UTC()
	payload := buildStatusUpdatePayload(updatedAt, source, reason)
	payload["status"] = targetStatus

	updated, err := s.fundingRepo.UpdateFundingStatus(ctx, userID, record.ID, payload)
	if err != nil {
		s.logger.Error("failed to persist funding transaction status transition", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.FundingTransactionRecord{}, false, ErrFundingTransactionsUnavailable
	}

	return updated, true, nil
}

func (s *DefaultTransactionService) transitionTransferRecord(
	ctx context.Context,
	userID string,
	record model.TransferTransactionRecord,
	targetStatus model.TransferStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.TransferTransactionRecord, bool, error) {
	if err := validateTransferStatusTransition(record.Status, targetStatus); err != nil {
		return model.TransferTransactionRecord{}, false, ErrInvalidTransactionTransition
	}
	if targetStatus == model.TransferStatusCompleted {
		updated, err := s.completeTransferRecord(ctx, userID, record, source, reason)
		if err != nil {
			return model.TransferTransactionRecord{}, false, err
		}

		return updated, record.Status != updated.Status, nil
	}
	if targetStatus == record.Status {
		return record, false, nil
	}

	updatedAt := time.Now().UTC()
	payload := buildStatusUpdatePayload(updatedAt, source, reason)
	payload["status"] = targetStatus

	updated, err := s.transferRepo.UpdateTransferStatus(ctx, userID, record.ID, payload)
	if err != nil {
		s.logger.Error("failed to persist transfer transaction status transition", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.TransferTransactionRecord{}, false, ErrTransferTransactionsUnavailable
	}

	return updated, true, nil
}

func (s *DefaultTransactionService) transitionPaymentRecord(
	ctx context.Context,
	userID string,
	record model.PaymentTransactionRecord,
	targetStatus model.PaymentStatus,
	source model.TransactionStatusSource,
	reason *string,
) (model.PaymentTransactionRecord, bool, error) {
	if err := validatePaymentStatusTransition(record.Status, targetStatus); err != nil {
		return model.PaymentTransactionRecord{}, false, ErrInvalidTransactionTransition
	}
	if targetStatus == model.PaymentStatusCompleted {
		updated, err := s.completePaymentRecord(ctx, userID, record, source, reason)
		if err != nil {
			return model.PaymentTransactionRecord{}, false, err
		}

		return updated, record.Status != updated.Status, nil
	}
	if targetStatus == record.Status {
		return record, false, nil
	}

	updatedAt := time.Now().UTC()
	payload := buildStatusUpdatePayload(updatedAt, source, reason)
	payload["status"] = targetStatus

	updated, err := s.paymentRepo.UpdatePaymentStatus(ctx, userID, record.ID, payload)
	if err != nil {
		s.logger.Error("failed to persist payment transaction status transition", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.PaymentTransactionRecord{}, false, ErrPaymentTransactionsUnavailable
	}

	return updated, true, nil
}

func validateFundingStatusTransition(current, target model.FundingStatus) error {
	if !current.IsValid() || !target.IsValid() {
		return ErrInvalidTransactionTransition
	}

	if current == target {
		return nil
	}

	switch current {
	case model.FundingStatusInitiated:
		if target == model.FundingStatusPending || target == model.FundingStatusFailed {
			return nil
		}
	case model.FundingStatusPending:
		if target == model.FundingStatusCompleted || target == model.FundingStatusFailed {
			return nil
		}
	}

	return ErrInvalidTransactionTransition
}

func validateTransferStatusTransition(current, target model.TransferStatus) error {
	if !current.IsValid() || !target.IsValid() {
		return ErrInvalidTransactionTransition
	}

	if current == target {
		return nil
	}

	switch current {
	case model.TransferStatusInitiated:
		if target == model.TransferStatusConverting || target == model.TransferStatusFailed {
			return nil
		}
	case model.TransferStatusConverting:
		if target == model.TransferStatusCompleted || target == model.TransferStatusFailed {
			return nil
		}
	}

	return ErrInvalidTransactionTransition
}

func validatePaymentStatusTransition(current, target model.PaymentStatus) error {
	if !current.IsValid() || !target.IsValid() {
		return ErrInvalidTransactionTransition
	}

	if current == target {
		return nil
	}

	switch current {
	case model.PaymentStatusSubmitted:
		if target == model.PaymentStatusUnderReview || target == model.PaymentStatusFailed {
			return nil
		}
	case model.PaymentStatusUnderReview:
		if target == model.PaymentStatusProcessing || target == model.PaymentStatusFailed {
			return nil
		}
	case model.PaymentStatusProcessing:
		if target == model.PaymentStatusCompleted || target == model.PaymentStatusFailed {
			return nil
		}
	}

	return ErrInvalidTransactionTransition
}

func (s *DefaultTransactionService) completeFundingRecord(
	ctx context.Context,
	userID string,
	record model.FundingTransactionRecord,
	source model.TransactionStatusSource,
	reason *string,
) (model.FundingTransactionRecord, error) {
	updated, err := s.fundingRepo.CompleteFunding(ctx, userID, record.ID, source, reason)
	if err != nil {
		if errors.Is(err, repository.ErrInsufficientFunds) {
			return model.FundingTransactionRecord{}, ErrInsufficientFunds
		}

		s.logger.Error("failed to settle funding transaction", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.FundingTransactionRecord{}, ErrFundingTransactionsUnavailable
	}

	return updated, nil
}

func (s *DefaultTransactionService) completeTransferRecord(
	ctx context.Context,
	userID string,
	record model.TransferTransactionRecord,
	source model.TransactionStatusSource,
	reason *string,
) (model.TransferTransactionRecord, error) {
	updated, err := s.transferRepo.CompleteTransfer(ctx, userID, record.ID, source, reason)
	if err != nil {
		if errors.Is(err, repository.ErrInsufficientFunds) {
			return model.TransferTransactionRecord{}, ErrInsufficientFunds
		}

		s.logger.Error("failed to settle transfer transaction", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.TransferTransactionRecord{}, ErrTransferTransactionsUnavailable
	}

	return updated, nil
}

func (s *DefaultTransactionService) completePaymentRecord(
	ctx context.Context,
	userID string,
	record model.PaymentTransactionRecord,
	source model.TransactionStatusSource,
	reason *string,
) (model.PaymentTransactionRecord, error) {
	updated, err := s.paymentRepo.CompletePayment(ctx, userID, record.ID, source, reason)
	if err != nil {
		if errors.Is(err, repository.ErrInsufficientFunds) {
			return model.PaymentTransactionRecord{}, ErrInsufficientFunds
		}

		s.logger.Error("failed to settle payment transaction", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
		return model.PaymentTransactionRecord{}, ErrPaymentTransactionsUnavailable
	}

	return updated, nil
}

func buildStatusUpdatePayload(updatedAt time.Time, source model.TransactionStatusSource, reason *string) map[string]any {
	payload := map[string]any{
		"status_source":         source,
		"updated_at":            updatedAt,
		"last_status_change_at": updatedAt,
	}
	if normalizedReason := normalizeStatusReason(reason); normalizedReason != nil {
		payload["status_reason"] = *normalizedReason
	} else {
		payload["status_reason"] = nil
	}

	return payload
}
