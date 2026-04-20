package service

import (
	"context"
	"log/slog"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func (s *DefaultTransactionService) ListFunding(ctx context.Context, user model.AuthenticatedUser) (model.FundingTransactionListResponse, error) {
	records, err := s.fundingRepo.ListFundingByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list funding transactions", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.FundingTransactionListResponse{}, ErrFundingTransactionsUnavailable
	}

	transactions := make([]model.FundingTransaction, 0, len(records))
	for _, record := range records {
		if !s.permissions.CanAccessFundingTransaction(user, record) {
			continue
		}

		transactions = append(transactions, buildFundingTransaction(record))
	}

	return model.FundingTransactionListResponse{Transactions: transactions}, nil
}

func (s *DefaultTransactionService) GetFunding(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.FundingTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	record, found, err := s.fundingRepo.GetFundingByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch funding transaction", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.FundingTransactionResponse{}, ErrFundingTransactionsUnavailable
	}

	if !found || !s.permissions.CanAccessFundingTransaction(user, record) {
		return model.FundingTransactionResponse{}, ErrFundingTransactionNotFound
	}

	return model.FundingTransactionResponse{Transaction: buildFundingTransaction(record)}, nil
}

func (s *DefaultTransactionService) ListTransfers(ctx context.Context, user model.AuthenticatedUser) (model.TransferTransactionListResponse, error) {
	records, err := s.transferRepo.ListTransfersByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list transfer transactions", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.TransferTransactionListResponse{}, ErrTransferTransactionsUnavailable
	}

	transactions := make([]model.TransferTransaction, 0, len(records))
	for _, record := range records {
		if !s.permissions.CanAccessTransferTransaction(user, record) {
			continue
		}

		transactions = append(transactions, buildTransferTransaction(record))
	}

	return model.TransferTransactionListResponse{Transactions: transactions}, nil
}

func (s *DefaultTransactionService) GetTransfer(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.TransferTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	record, found, err := s.transferRepo.GetTransferByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch transfer transaction", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.TransferTransactionResponse{}, ErrTransferTransactionsUnavailable
	}

	if !found || !s.permissions.CanAccessTransferTransaction(user, record) {
		return model.TransferTransactionResponse{}, ErrTransferTransactionNotFound
	}

	return model.TransferTransactionResponse{Transaction: buildTransferTransaction(record)}, nil
}

func (s *DefaultTransactionService) ListPayments(ctx context.Context, user model.AuthenticatedUser) (model.PaymentTransactionListResponse, error) {
	records, err := s.paymentRepo.ListPaymentsByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list payment transactions", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.PaymentTransactionListResponse{}, ErrPaymentTransactionsUnavailable
	}

	transactions := make([]model.PaymentTransaction, 0, len(records))
	for _, record := range records {
		if !s.permissions.CanAccessPaymentTransaction(user, record) {
			continue
		}

		transactions = append(transactions, buildPaymentTransaction(record))
	}

	return model.PaymentTransactionListResponse{Transactions: transactions}, nil
}

func (s *DefaultTransactionService) GetPayment(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.PaymentTransactionResponse, error) {
	transactionID = strings.TrimSpace(transactionID)
	if transactionID == "" {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	record, found, err := s.paymentRepo.GetPaymentByIDForUser(ctx, user.ID, transactionID)
	if err != nil {
		s.logger.Error("failed to fetch payment transaction", slog.String("user_id", user.ID), slog.String("transaction_id", transactionID), slog.String("error", err.Error()))
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionsUnavailable
	}

	if !found || !s.permissions.CanAccessPaymentTransaction(user, record) {
		return model.PaymentTransactionResponse{}, ErrPaymentTransactionNotFound
	}

	return model.PaymentTransactionResponse{Transaction: buildPaymentTransaction(record)}, nil
}
