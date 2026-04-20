package service

import (
	"context"
	"errors"
	"log/slog"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrFundingTransactionsUnavailable  = errors.New("funding transactions unavailable")
	ErrFundingTransactionNotFound      = errors.New("funding transaction not found")
	ErrTransferTransactionsUnavailable = errors.New("transfer transactions unavailable")
	ErrTransferTransactionNotFound     = errors.New("transfer transaction not found")
	ErrPaymentTransactionsUnavailable  = errors.New("payment transactions unavailable")
	ErrPaymentTransactionNotFound      = errors.New("payment transaction not found")
	ErrTransactionPermissionDenied     = errors.New("transaction permission denied")
	ErrInsufficientFunds               = errors.New("insufficient funds")
)

type TransactionService interface {
	CreateFunding(ctx context.Context, user model.AuthenticatedUser, input model.CreateFundingTransactionInput) (model.FundingTransactionResponse, error)
	ListFunding(ctx context.Context, user model.AuthenticatedUser) (model.FundingTransactionListResponse, error)
	GetFunding(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.FundingTransactionResponse, error)
	UpdateFundingStatus(ctx context.Context, user model.AuthenticatedUser, transactionID string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error)
	SimulateAdvanceFunding(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.FundingTransactionResponse, error)
	CreateTransfer(ctx context.Context, user model.AuthenticatedUser, input model.CreateTransferTransactionInput) (model.TransferTransactionResponse, error)
	ListTransfers(ctx context.Context, user model.AuthenticatedUser) (model.TransferTransactionListResponse, error)
	GetTransfer(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.TransferTransactionResponse, error)
	UpdateTransferStatus(ctx context.Context, user model.AuthenticatedUser, transactionID string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error)
	SimulateAdvanceTransfer(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.TransferTransactionResponse, error)
	CreatePayment(ctx context.Context, user model.AuthenticatedUser, input model.CreatePaymentTransactionInput) (model.PaymentTransactionResponse, error)
	ListPayments(ctx context.Context, user model.AuthenticatedUser) (model.PaymentTransactionListResponse, error)
	GetPayment(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.PaymentTransactionResponse, error)
	UpdatePaymentStatus(ctx context.Context, user model.AuthenticatedUser, transactionID string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error)
	SimulateAdvancePayment(ctx context.Context, user model.AuthenticatedUser, transactionID string) (model.PaymentTransactionResponse, error)
}

type TransactionLifecycleUpdateService interface {
	UpdateFundingStatusByReference(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error)
	UpdateTransferStatusByReference(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error)
	UpdatePaymentStatusByReference(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error)
}

type DefaultTransactionService struct {
	logger        *slog.Logger
	fundingRepo   repository.FundingTransactionRepository
	transferRepo  repository.TransferTransactionRepository
	paymentRepo   repository.PaymentTransactionRepository
	accountRepo   repository.AccountRepository
	recipientRepo repository.RecipientRepository
	permissions   PermissionHelper
	activities    ActivityEventRecorder
	verification  VerificationResolver
}

func NewTransactionService(
	logger *slog.Logger,
	fundingRepo repository.FundingTransactionRepository,
	transferRepo repository.TransferTransactionRepository,
	paymentRepo repository.PaymentTransactionRepository,
	accountRepo repository.AccountRepository,
	recipientRepo repository.RecipientRepository,
	permissions PermissionHelper,
	activities ActivityEventRecorder,
	verification VerificationResolver,
) TransactionService {
	return &DefaultTransactionService{
		logger:        logger,
		fundingRepo:   fundingRepo,
		transferRepo:  transferRepo,
		paymentRepo:   paymentRepo,
		accountRepo:   accountRepo,
		recipientRepo: recipientRepo,
		permissions:   permissions,
		activities:    activities,
		verification:  verification,
	}
}

func (s *DefaultTransactionService) syncFundingActivity(ctx context.Context, userID string, record model.FundingTransactionRecord) {
	if s.activities == nil {
		return
	}

	if err := s.activities.RecordFundingEvent(ctx, userID, record); err != nil {
		s.logger.Warn("failed to sync funding activity", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
	}
}

func (s *DefaultTransactionService) syncTransferActivity(ctx context.Context, userID string, record model.TransferTransactionRecord) {
	if s.activities == nil {
		return
	}

	if err := s.activities.RecordTransferEvent(ctx, userID, record); err != nil {
		s.logger.Warn("failed to sync transfer activity", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
	}
}

func (s *DefaultTransactionService) syncPaymentActivity(ctx context.Context, userID string, record model.PaymentTransactionRecord) {
	if s.activities == nil {
		return
	}

	if err := s.activities.RecordPaymentEvent(ctx, userID, record); err != nil {
		s.logger.Warn("failed to sync payment activity", slog.String("user_id", userID), slog.String("transaction_id", record.ID), slog.String("error", err.Error()))
	}
}
