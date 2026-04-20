package service

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type fakePermissionHelper struct {
	permissions            model.PermissionSet
	canAddMoney            bool
	canMoveMoney           bool
	canCreateFunding       bool
	canCreateTransfer      bool
	canCreatePayment       bool
	canCreateCard          bool
	canCreateRecipient     bool
	canCreateSupportTicket bool
	canAccessAccount       bool
	canAccessFunding       bool
	canAccessTransfer      bool
	canAccessPayment       bool
	canAccessRecipient     bool
	canAccessTicket        bool
	canUseAccount          bool
}

func (f fakePermissionHelper) PermissionsForStatus(status model.VerificationStatus) model.PermissionSet {
	return f.permissions
}

func (f fakePermissionHelper) CanAddMoney(status model.VerificationStatus) bool {
	return f.canAddMoney
}

func (f fakePermissionHelper) CanMoveMoney(status model.VerificationStatus) bool {
	return f.canMoveMoney
}

func (f fakePermissionHelper) CanCreateFunding(status model.VerificationStatus) bool {
	return f.canCreateFunding
}

func (f fakePermissionHelper) CanCreateTransfer(status model.VerificationStatus) bool {
	return f.canCreateTransfer
}

func (f fakePermissionHelper) CanCreatePayment(status model.VerificationStatus) bool {
	return f.canCreatePayment
}

func (f fakePermissionHelper) CanCreateCard(status model.VerificationStatus) bool {
	return f.canCreateCard
}

func (f fakePermissionHelper) CanCreateRecipient(status model.VerificationStatus) bool {
	return f.canCreateRecipient
}

func (f fakePermissionHelper) CanCreateSupportTicket(status model.VerificationStatus) bool {
	return f.canCreateSupportTicket
}

func (f fakePermissionHelper) CanAccessAccount(user model.AuthenticatedUser, account model.AccountRecord) bool {
	return f.canAccessAccount
}

func (f fakePermissionHelper) CanAccessFundingTransaction(user model.AuthenticatedUser, record model.FundingTransactionRecord) bool {
	return f.canAccessFunding
}

func (f fakePermissionHelper) CanAccessTransferTransaction(user model.AuthenticatedUser, record model.TransferTransactionRecord) bool {
	return f.canAccessTransfer
}

func (f fakePermissionHelper) CanAccessPaymentTransaction(user model.AuthenticatedUser, record model.PaymentTransactionRecord) bool {
	return f.canAccessPayment
}

func (f fakePermissionHelper) CanAccessRecipient(user model.AuthenticatedUser, record model.RecipientRecord) bool {
	return f.canAccessRecipient
}

func (f fakePermissionHelper) CanAccessTicket(user model.AuthenticatedUser, record model.SupportTicketRecord) bool {
	return f.canAccessTicket
}

func (f fakePermissionHelper) CanUseAccount(accountStatus model.AccountStatus) bool {
	return f.canUseAccount
}

type fakeVerificationResolver struct {
	resolveForUser   func(ctx context.Context, userID string) (model.VerificationStatus, error)
	normalizeProfile func(profile model.ProfileRecord) model.VerificationStatus
}

func (f fakeVerificationResolver) ResolveForUser(ctx context.Context, userID string) (model.VerificationStatus, error) {
	if f.resolveForUser != nil {
		return f.resolveForUser(ctx, userID)
	}

	return model.VerificationStatusBasic, nil
}

func (f fakeVerificationResolver) NormalizeProfile(profile model.ProfileRecord) model.VerificationStatus {
	if f.normalizeProfile != nil {
		return f.normalizeProfile(profile)
	}

	return ResolveVerificationStatus(profile.VerificationStatus, profile)
}

type fakeProfileRepository struct {
	getByUserID func(ctx context.Context, userID string) (model.ProfileRecord, bool, error)
	upsert      func(ctx context.Context, profile model.ProfileRecord) (model.ProfileRecord, error)
}

func (f fakeProfileRepository) GetByUserID(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
	return f.getByUserID(ctx, userID)
}

func (f fakeProfileRepository) Upsert(ctx context.Context, profile model.ProfileRecord) (model.ProfileRecord, error) {
	if f.upsert != nil {
		return f.upsert(ctx, profile)
	}

	return profile, nil
}

type fakeIdempotencyRepository struct {
	create         func(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error)
	getByKey       func(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error)
	updateResponse func(ctx context.Context, userID, operation, key string, statusCode int, responseBody json.RawMessage) (model.IdempotencyRecord, error)
	delete         func(ctx context.Context, userID, operation, key string) error
}

func (f fakeIdempotencyRepository) Create(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error) {
	if f.create != nil {
		return f.create(ctx, record)
	}

	return record, nil
}

func (f fakeIdempotencyRepository) GetByKey(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error) {
	if f.getByKey != nil {
		return f.getByKey(ctx, userID, operation, key)
	}

	return model.IdempotencyRecord{}, false, nil
}

func (f fakeIdempotencyRepository) UpdateResponse(ctx context.Context, userID, operation, key string, statusCode int, responseBody json.RawMessage) (model.IdempotencyRecord, error) {
	if f.updateResponse != nil {
		return f.updateResponse(ctx, userID, operation, key, statusCode, responseBody)
	}

	return model.IdempotencyRecord{
		UserID:         userID,
		Operation:      operation,
		IdempotencyKey: key,
		ResponseStatus: &statusCode,
		ResponseBody:   responseBody,
	}, nil
}

func (f fakeIdempotencyRepository) Delete(ctx context.Context, userID, operation, key string) error {
	if f.delete != nil {
		return f.delete(ctx, userID, operation, key)
	}

	return nil
}

type fakeAccountRepository struct {
	listByUserID   func(ctx context.Context, userID string) ([]model.AccountRecord, error)
	getByIDForUser func(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error)
}

func (f fakeAccountRepository) ListByUserID(ctx context.Context, userID string) ([]model.AccountRecord, error) {
	if f.listByUserID != nil {
		return f.listByUserID(ctx, userID)
	}

	return nil, nil
}

func (f fakeAccountRepository) GetByIDForUser(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error) {
	if f.getByIDForUser != nil {
		return f.getByIDForUser(ctx, userID, accountID)
	}

	return model.AccountRecord{}, false, nil
}

type fakeRecipientRepository struct {
	create         func(ctx context.Context, record model.RecipientRecord) (model.RecipientRecord, error)
	listByUserID   func(ctx context.Context, userID string) ([]model.RecipientRecord, error)
	getByIDForUser func(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error)
}

func (f fakeRecipientRepository) Create(ctx context.Context, record model.RecipientRecord) (model.RecipientRecord, error) {
	if f.create != nil {
		return f.create(ctx, record)
	}

	return record, nil
}

func (f fakeRecipientRepository) ListByUserID(ctx context.Context, userID string) ([]model.RecipientRecord, error) {
	if f.listByUserID != nil {
		return f.listByUserID(ctx, userID)
	}

	return nil, nil
}

func (f fakeRecipientRepository) GetByIDForUser(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error) {
	if f.getByIDForUser != nil {
		return f.getByIDForUser(ctx, userID, recipientID)
	}

	return model.RecipientRecord{}, false, nil
}

type fakeTransactionRepository struct {
	createFunding          func(ctx context.Context, record model.FundingTransactionRecord) (model.FundingTransactionRecord, error)
	listFunding            func(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error)
	getFunding             func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error)
	getFundingByReference  func(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error)
	updateFundingStatus    func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error)
	completeFunding        func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error)
	createTransfer         func(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error)
	listTransfers          func(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error)
	getTransfer            func(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error)
	getTransferByReference func(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error)
	updateTransferStatus   func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.TransferTransactionRecord, error)
	completeTransfer       func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.TransferTransactionRecord, error)
	createPayment          func(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error)
	listPayments           func(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error)
	getPayment             func(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error)
	getPaymentByReference  func(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error)
	updatePaymentStatus    func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.PaymentTransactionRecord, error)
	completePayment        func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error)
}

func (f fakeTransactionRepository) CreateFunding(ctx context.Context, record model.FundingTransactionRecord) (model.FundingTransactionRecord, error) {
	if f.createFunding != nil {
		return f.createFunding(ctx, record)
	}

	return record, nil
}

func (f fakeTransactionRepository) ListFundingByUserID(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error) {
	if f.listFunding != nil {
		return f.listFunding(ctx, userID)
	}

	return nil, nil
}

func (f fakeTransactionRepository) GetFundingByIDForUser(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
	if f.getFunding != nil {
		return f.getFunding(ctx, userID, transactionID)
	}

	return model.FundingTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) GetFundingByReference(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error) {
	if f.getFundingByReference != nil {
		return f.getFundingByReference(ctx, reference)
	}

	return model.FundingTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) UpdateFundingStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
	if f.updateFundingStatus != nil {
		return f.updateFundingStatus(ctx, userID, transactionID, payload)
	}

	return model.FundingTransactionRecord{}, nil
}

func (f fakeTransactionRepository) CompleteFunding(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error) {
	if f.completeFunding != nil {
		return f.completeFunding(ctx, userID, transactionID, source, reason)
	}

	return model.FundingTransactionRecord{}, nil
}

func (f fakeTransactionRepository) CreateTransfer(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error) {
	if f.createTransfer != nil {
		return f.createTransfer(ctx, record)
	}

	return record, nil
}

func (f fakeTransactionRepository) ListTransfersByUserID(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error) {
	if f.listTransfers != nil {
		return f.listTransfers(ctx, userID)
	}

	return nil, nil
}

func (f fakeTransactionRepository) GetTransferByIDForUser(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error) {
	if f.getTransfer != nil {
		return f.getTransfer(ctx, userID, transactionID)
	}

	return model.TransferTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) GetTransferByReference(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error) {
	if f.getTransferByReference != nil {
		return f.getTransferByReference(ctx, reference)
	}

	return model.TransferTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) UpdateTransferStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.TransferTransactionRecord, error) {
	if f.updateTransferStatus != nil {
		return f.updateTransferStatus(ctx, userID, transactionID, payload)
	}

	return model.TransferTransactionRecord{}, nil
}

func (f fakeTransactionRepository) CompleteTransfer(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.TransferTransactionRecord, error) {
	if f.completeTransfer != nil {
		return f.completeTransfer(ctx, userID, transactionID, source, reason)
	}

	return model.TransferTransactionRecord{}, nil
}

func (f fakeTransactionRepository) CreatePayment(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error) {
	if f.createPayment != nil {
		return f.createPayment(ctx, record)
	}

	return record, nil
}

func (f fakeTransactionRepository) ListPaymentsByUserID(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error) {
	if f.listPayments != nil {
		return f.listPayments(ctx, userID)
	}

	return nil, nil
}

func (f fakeTransactionRepository) GetPaymentByIDForUser(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
	if f.getPayment != nil {
		return f.getPayment(ctx, userID, transactionID)
	}

	return model.PaymentTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) GetPaymentByReference(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error) {
	if f.getPaymentByReference != nil {
		return f.getPaymentByReference(ctx, reference)
	}

	return model.PaymentTransactionRecord{}, false, nil
}

func (f fakeTransactionRepository) UpdatePaymentStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.PaymentTransactionRecord, error) {
	if f.updatePaymentStatus != nil {
		return f.updatePaymentStatus(ctx, userID, transactionID, payload)
	}

	return model.PaymentTransactionRecord{}, nil
}

func (f fakeTransactionRepository) CompletePayment(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error) {
	if f.completePayment != nil {
		return f.completePayment(ctx, userID, transactionID, source, reason)
	}

	return model.PaymentTransactionRecord{}, nil
}

type noopActivityRecorder struct{}

func (noopActivityRecorder) RecordFundingEvent(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
	return nil
}

func (noopActivityRecorder) RecordTransferEvent(ctx context.Context, userID string, record model.TransferTransactionRecord) error {
	return nil
}

func (noopActivityRecorder) RecordPaymentEvent(ctx context.Context, userID string, record model.PaymentTransactionRecord) error {
	return nil
}

func (noopActivityRecorder) RecordSupportTicketCreated(ctx context.Context, userID string, record model.SupportTicketRecord) error {
	return nil
}

func testVerificationResolver(status model.VerificationStatus) VerificationResolver {
	return NewVerificationResolver(slog.New(slog.NewTextHandler(nilWriter{}, nil)), fakeProfileRepository{
		getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
			return model.ProfileRecord{ID: userID, VerificationStatus: status}, true, nil
		},
	})
}

type nilWriter struct{}

func (nilWriter) Write(p []byte) (n int, err error) {
	return len(p), nil
}
