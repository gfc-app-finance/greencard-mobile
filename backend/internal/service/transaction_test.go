package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestDefaultTransactionServiceCreateFundingDeniedByPermission(t *testing.T) {
	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusBasic}, true, nil
			},
		},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canCreateFunding: false,
		},
		noopActivityRecorder{},
	)

	_, err := service.CreateFunding(context.Background(), model.AuthenticatedUser{ID: "user_123"}, model.CreateFundingTransactionInput{
		AccountID: "acct_ngn_user",
		Amount:    100,
		Currency:  model.AccountCurrencyNGN,
	})
	if !errors.Is(err, ErrTransactionPermissionDenied) {
		t.Fatalf("expected transaction permission denied, got %v", err)
	}
}

func TestNextPaymentStatusProgression(t *testing.T) {
	createdAt := time.Now().Add(-30 * time.Second)

	status := nextPaymentStatus(model.PaymentTransactionRecord{
		Status:    model.PaymentStatusSubmitted,
		CreatedAt: &createdAt,
	})

	if status != model.PaymentStatusCompleted {
		t.Fatalf("expected payment to progress to completed, got %q", status)
	}
}

func TestCreateFundingRejectsUnknownAccountWithoutSeededFallback(t *testing.T) {
	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusVerified}, true, nil
			},
		},
		fakeAccountRepository{
			getByIDForUser: func(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error) {
				return model.AccountRecord{}, false, nil
			},
		},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canCreateFunding: true,
			canUseAccount:    true,
		},
		noopActivityRecorder{},
	)

	_, err := service.CreateFunding(context.Background(), model.AuthenticatedUser{ID: "user_123"}, model.CreateFundingTransactionInput{
		AccountID: "acct_ngn_missing",
		Amount:    100,
		Currency:  model.AccountCurrencyNGN,
	})

	var validationErrors ValidationErrors
	if !errors.As(err, &validationErrors) {
		t.Fatalf("expected validation errors, got %v", err)
	}

	if len(validationErrors) != 1 || validationErrors[0].Field != "account_id" {
		t.Fatalf("expected account_id validation error, got %#v", validationErrors)
	}
}

func TestCreatePaymentRequiresOwnedRecipient(t *testing.T) {
	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusVerified}, true, nil
			},
		},
		fakeAccountRepository{
			getByIDForUser: func(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error) {
				return model.AccountRecord{
					ID:       accountID,
					UserID:   userID,
					Currency: model.AccountCurrencyUSD,
					Status:   model.AccountStatusActive,
				}, true, nil
			},
		},
		fakeRecipientRepository{
			getByIDForUser: func(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error) {
				return model.RecipientRecord{}, false, nil
			},
		},
		fakePermissionHelper{
			canCreatePayment: true,
			canUseAccount:    true,
		},
		noopActivityRecorder{},
	)

	_, err := service.CreatePayment(context.Background(), model.AuthenticatedUser{ID: "user_123"}, model.CreatePaymentTransactionInput{
		SourceAccountID: "acct_usd_user",
		RecipientID:     "recipient_missing",
		PaymentType:     model.PaymentTypeInternational,
		Amount:          250,
		Currency:        model.AccountCurrencyUSD,
	})

	var validationErrors ValidationErrors
	if !errors.As(err, &validationErrors) {
		t.Fatalf("expected validation errors, got %v", err)
	}

	if len(validationErrors) != 1 || validationErrors[0].Field != "recipient_id" {
		t.Fatalf("expected recipient_id validation error, got %#v", validationErrors)
	}
}

func TestListFundingDoesNotAdvancePersistedStatusOnRead(t *testing.T) {
	createdAt := time.Now().Add(-20 * time.Second)
	updateCalled := false

	service := NewTransactionService(
		nil,
		fakeTransactionRepository{
			listFunding: func(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error) {
				return []model.FundingTransactionRecord{{
					ID:        "funding_123",
					UserID:    userID,
					AccountID: "acct_ngn_user",
					Amount:    100,
					Currency:  model.AccountCurrencyNGN,
					Status:    model.FundingStatusInitiated,
					CreatedAt: &createdAt,
					UpdatedAt: &createdAt,
				}}, nil
			},
			updateFundingStatus: func(ctx context.Context, userID, transactionID string, status model.FundingStatus) (model.FundingTransactionRecord, error) {
				updateCalled = true
				return model.FundingTransactionRecord{}, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusVerified}, true, nil
			},
		},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canAccessFunding: true,
		},
		noopActivityRecorder{},
	)

	response, err := service.ListFunding(context.Background(), model.AuthenticatedUser{ID: "user_123"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if updateCalled {
		t.Fatal("expected read path to avoid status mutation")
	}

	if len(response.Transactions) != 1 {
		t.Fatalf("expected one funding transaction, got %d", len(response.Transactions))
	}

	if response.Transactions[0].Status != model.FundingStatusInitiated {
		t.Fatalf("expected funding status to remain initiated, got %q", response.Transactions[0].Status)
	}
}
