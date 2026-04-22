package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

func TestDefaultTransactionServiceCreateFundingDeniedByPermission(t *testing.T) {
	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canCreateFunding: false,
		},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusBasic),
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
		testVerificationResolver(model.VerificationStatusVerified),
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
		testVerificationResolver(model.VerificationStatusVerified),
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
			updateFundingStatus: func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
				updateCalled = true
				return model.FundingTransactionRecord{}, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canAccessFunding: true,
		},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
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

func TestSimulateAdvanceFundingAppliesValidatedTransitionMetadata(t *testing.T) {
	createdAt := time.Now().Add(-10 * time.Second)
	updatedAt := createdAt
	activityCalls := 0

	service := NewTransactionService(
		nil,
		fakeTransactionRepository{
			getFunding: func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
				return model.FundingTransactionRecord{
					ID:        transactionID,
					UserID:    userID,
					AccountID: "acct_ngn_user",
					Amount:    100,
					Currency:  model.AccountCurrencyNGN,
					Status:    model.FundingStatusInitiated,
					CreatedAt: &createdAt,
					UpdatedAt: &updatedAt,
				}, true, nil
			},
			updateFundingStatus: func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
				status, ok := payload["status"].(model.FundingStatus)
				if !ok {
					t.Fatalf("expected funding status payload, got %#v", payload["status"])
				}

				source, ok := payload["status_source"].(model.TransactionStatusSource)
				if !ok {
					t.Fatalf("expected status source payload, got %#v", payload["status_source"])
				}

				reason, ok := payload["status_reason"].(string)
				if !ok {
					t.Fatalf("expected status reason payload, got %#v", payload["status_reason"])
				}

				nextUpdatedAt, ok := payload["updated_at"].(time.Time)
				if !ok {
					t.Fatalf("expected updated_at payload, got %#v", payload["updated_at"])
				}

				lastStatusChangeAt, ok := payload["last_status_change_at"].(time.Time)
				if !ok {
					t.Fatalf("expected last_status_change_at payload, got %#v", payload["last_status_change_at"])
				}

				return model.FundingTransactionRecord{
					ID:                 transactionID,
					UserID:             userID,
					AccountID:          "acct_ngn_user",
					Amount:             100,
					Currency:           model.AccountCurrencyNGN,
					Status:             status,
					StatusSource:       statusSourcePointer(source),
					StatusReason:       optionalStringPointer(reason),
					LastStatusChangeAt: &lastStatusChangeAt,
					CreatedAt:          &createdAt,
					UpdatedAt:          &nextUpdatedAt,
				}, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canAccessFunding: true,
		},
		recordingActivityRecorder{
			recordFunding: func(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
				activityCalls++
				if record.Status != model.FundingStatusPending {
					t.Fatalf("expected synced funding activity with pending status, got %q", record.Status)
				}
				if record.StatusSource == nil || *record.StatusSource != model.TransactionStatusSourceSimulation {
					t.Fatalf("expected synced funding activity with simulation source, got %#v", record.StatusSource)
				}
				return nil
			},
		},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	response, err := service.SimulateAdvanceFunding(context.Background(), model.AuthenticatedUser{ID: "user_123"}, "funding_123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if response.Transaction.Status != model.FundingStatusPending {
		t.Fatalf("expected funding status pending, got %q", response.Transaction.Status)
	}

	if response.Transaction.StatusSource == nil || *response.Transaction.StatusSource != model.TransactionStatusSourceSimulation {
		t.Fatalf("expected simulation status source, got %#v", response.Transaction.StatusSource)
	}

	if response.Transaction.StatusReason == nil || *response.Transaction.StatusReason != "advanced by non-production simulation" {
		t.Fatalf("expected simulation status reason, got %#v", response.Transaction.StatusReason)
	}

	if response.Transaction.LastStatusChangeAt == nil {
		t.Fatal("expected last status change timestamp to be populated")
	}

	if activityCalls != 1 {
		t.Fatalf("expected one activity sync, got %d", activityCalls)
	}
}

func TestUpdateTransferStatusAppliesValidTransitionAndSyncsActivity(t *testing.T) {
	createdAt := time.Now().Add(-10 * time.Second)
	updatedAt := createdAt
	activityCalls := 0

	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{
			getTransfer: func(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error) {
				return model.TransferTransactionRecord{
					ID:                   transactionID,
					UserID:               userID,
					SourceAccountID:      "acct_usd_user",
					DestinationAccountID: "acct_gbp_user",
					SourceCurrency:       model.AccountCurrencyUSD,
					DestinationCurrency:  model.AccountCurrencyGBP,
					SourceAmount:         150,
					DestinationAmount:    118.50,
					Status:               model.TransferStatusInitiated,
					CreatedAt:            &createdAt,
					UpdatedAt:            &updatedAt,
				}, true, nil
			},
			updateTransferStatus: func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.TransferTransactionRecord, error) {
				status, ok := payload["status"].(model.TransferStatus)
				if !ok {
					t.Fatalf("expected transfer status payload, got %#v", payload["status"])
				}

				lastStatusChangeAt, ok := payload["last_status_change_at"].(time.Time)
				if !ok {
					t.Fatalf("expected last_status_change_at payload, got %#v", payload["last_status_change_at"])
				}

				nextUpdatedAt, ok := payload["updated_at"].(time.Time)
				if !ok {
					t.Fatalf("expected updated_at payload, got %#v", payload["updated_at"])
				}

				return model.TransferTransactionRecord{
					ID:                   transactionID,
					UserID:               userID,
					SourceAccountID:      "acct_usd_user",
					DestinationAccountID: "acct_gbp_user",
					SourceCurrency:       model.AccountCurrencyUSD,
					DestinationCurrency:  model.AccountCurrencyGBP,
					SourceAmount:         150,
					DestinationAmount:    118.50,
					Status:               status,
					StatusSource:         statusSourcePointer(model.TransactionStatusSourceProvider),
					StatusReason:         optionalStringPointer("provider confirmed fx conversion"),
					LastStatusChangeAt:   &lastStatusChangeAt,
					CreatedAt:            &createdAt,
					UpdatedAt:            &nextUpdatedAt,
				}, nil
			},
		},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessTransfer: true},
		recordingActivityRecorder{
			recordTransfer: func(ctx context.Context, userID string, record model.TransferTransactionRecord) error {
				activityCalls++
				if record.Status != model.TransferStatusConverting {
					t.Fatalf("expected synced transfer activity with converting status, got %q", record.Status)
				}
				return nil
			},
		},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	response, err := service.UpdateTransferStatus(
		context.Background(),
		model.AuthenticatedUser{ID: "user_123"},
		"transfer_123",
		model.TransferStatusConverting,
		model.TransactionStatusSourceProvider,
		optionalStringPointer("provider confirmed fx conversion"),
	)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if response.Transaction.Status != model.TransferStatusConverting {
		t.Fatalf("expected converting status, got %q", response.Transaction.Status)
	}

	if response.Transaction.LastStatusChangeAt == nil {
		t.Fatal("expected last status change timestamp to be populated")
	}

	if activityCalls != 1 {
		t.Fatalf("expected one activity sync, got %d", activityCalls)
	}
}

func TestUpdatePaymentStatusRejectsInvalidTransition(t *testing.T) {
	createdAt := time.Now().Add(-10 * time.Second)
	updatedAt := createdAt

	service := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{
			getPayment: func(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
				return model.PaymentTransactionRecord{
					ID:              transactionID,
					UserID:          userID,
					SourceAccountID: "acct_usd_user",
					PaymentType:     model.PaymentTypeInternational,
					Amount:          200,
					Currency:        model.AccountCurrencyUSD,
					Fee:             2.50,
					TotalAmount:     202.50,
					Status:          model.PaymentStatusCompleted,
					CreatedAt:       &createdAt,
					UpdatedAt:       &updatedAt,
				}, true, nil
			},
		},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessPayment: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	_, err := service.UpdatePaymentStatus(
		context.Background(),
		model.AuthenticatedUser{ID: "user_123"},
		"payment_123",
		model.PaymentStatusSubmitted,
		model.TransactionStatusSourceManual,
		optionalStringPointer("unsafe rewind"),
	)
	if !errors.Is(err, ErrInvalidTransactionTransition) {
		t.Fatalf("expected invalid transaction transition, got %v", err)
	}
}

func TestSimulateAdvanceFundingRejectsInvalidTransition(t *testing.T) {
	createdAt := time.Now().Add(-10 * time.Second)
	updatedAt := createdAt
	updateCalled := false
	activityCalls := 0

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{
			getFunding: func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
				return model.FundingTransactionRecord{
					ID:        transactionID,
					UserID:    userID,
					AccountID: "acct_ngn_user",
					Amount:    100,
					Currency:  model.AccountCurrencyNGN,
					Status:    model.FundingStatusCompleted,
					CreatedAt: &createdAt,
					UpdatedAt: &updatedAt,
				}, true, nil
			},
			updateFundingStatus: func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
				updateCalled = true
				return model.FundingTransactionRecord{}, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{
			canAccessFunding: true,
		},
		recordingActivityRecorder{
			recordFunding: func(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
				activityCalls++
				return nil
			},
		},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyFundingStatusTransition(
		context.Background(),
		model.AuthenticatedUser{ID: "user_123"},
		"funding_123",
		model.FundingStatusInitiated,
		model.TransactionStatusSourceSimulation,
		optionalStringPointer("invalid rewind"),
	)
	if !errors.Is(err, ErrInvalidTransactionTransition) {
		t.Fatalf("expected invalid transaction transition, got %v", err)
	}

	if updateCalled {
		t.Fatal("expected invalid transition to avoid persistence")
	}

	if activityCalls != 0 {
		t.Fatalf("expected no activity sync for invalid transition, got %d", activityCalls)
	}
}

type recordingActivityRecorder struct {
	recordFunding  func(ctx context.Context, userID string, record model.FundingTransactionRecord) error
	recordTransfer func(ctx context.Context, userID string, record model.TransferTransactionRecord) error
	recordPayment  func(ctx context.Context, userID string, record model.PaymentTransactionRecord) error
}

func (r recordingActivityRecorder) RecordFundingEvent(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
	if r.recordFunding != nil {
		return r.recordFunding(ctx, userID, record)
	}

	return nil
}

func (r recordingActivityRecorder) RecordTransferEvent(ctx context.Context, userID string, record model.TransferTransactionRecord) error {
	if r.recordTransfer != nil {
		return r.recordTransfer(ctx, userID, record)
	}

	return nil
}

func (r recordingActivityRecorder) RecordPaymentEvent(ctx context.Context, userID string, record model.PaymentTransactionRecord) error {
	if r.recordPayment != nil {
		return r.recordPayment(ctx, userID, record)
	}

	return nil
}

func (recordingActivityRecorder) RecordSupportTicketCreated(ctx context.Context, userID string, record model.SupportTicketRecord) error {
	return nil
}

func TestFundingCompletionAppliesCreditOnce(t *testing.T) {
	createdAt := time.Now().Add(-5 * time.Minute)
	updatedAt := createdAt
	fundingRecord := model.FundingTransactionRecord{
		ID:        "funding_123",
		UserID:    "user_123",
		AccountID: "acct_ngn_user",
		Amount:    125,
		Currency:  model.AccountCurrencyNGN,
		Status:    model.FundingStatusPending,
		CreatedAt: &createdAt,
		UpdatedAt: &updatedAt,
	}
	accountBalance := 1000.0
	availableBalance := 1000.0
	movements := make([]model.BalanceMovementType, 0, 1)

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{
			getFunding: func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
				return fundingRecord, true, nil
			},
			completeFunding: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error) {
				if len(movements) == 0 {
					movements = append(movements, model.BalanceMovementTypeFundingCredit)
					accountBalance += fundingRecord.Amount
					availableBalance += fundingRecord.Amount
				}

				now := time.Now().UTC()
				fundingRecord.Status = model.FundingStatusCompleted
				fundingRecord.StatusSource = statusSourcePointer(source)
				fundingRecord.StatusReason = normalizeStatusReason(reason)
				fundingRecord.UpdatedAt = &now

				return fundingRecord, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessFunding: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyFundingStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, fundingRecord.ID, model.FundingStatusCompleted, model.TransactionStatusSourceSystem, optionalStringPointer("provider settled funding"))
	if err != nil {
		t.Fatalf("expected no error on first funding completion, got %v", err)
	}

	_, err = service.applyFundingStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, fundingRecord.ID, model.FundingStatusCompleted, model.TransactionStatusSourceProvider, optionalStringPointer("duplicate provider completion"))
	if err != nil {
		t.Fatalf("expected no error on repeated funding completion, got %v", err)
	}

	if len(movements) != 1 || movements[0] != model.BalanceMovementTypeFundingCredit {
		t.Fatalf("expected exactly one funding_credit movement, got %#v", movements)
	}

	if accountBalance != 1125 || availableBalance != 1125 {
		t.Fatalf("expected funding credit once, got balance %.2f available %.2f", accountBalance, availableBalance)
	}
}

func TestTransferCompletionAppliesDebitAndCreditOnce(t *testing.T) {
	createdAt := time.Now().Add(-5 * time.Minute)
	updatedAt := createdAt
	transferRecord := model.TransferTransactionRecord{
		ID:                   "transfer_123",
		UserID:               "user_123",
		SourceAccountID:      "acct_usd_user",
		DestinationAccountID: "acct_gbp_user",
		SourceCurrency:       model.AccountCurrencyUSD,
		DestinationCurrency:  model.AccountCurrencyGBP,
		SourceAmount:         150,
		DestinationAmount:    118.50,
		Status:               model.TransferStatusConverting,
		CreatedAt:            &createdAt,
		UpdatedAt:            &updatedAt,
	}
	sourceBalance := 500.0
	sourceAvailable := 500.0
	destinationBalance := 40.0
	destinationAvailable := 40.0
	movements := make([]model.BalanceMovementType, 0, 2)

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{
			getTransfer: func(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error) {
				return transferRecord, true, nil
			},
			completeTransfer: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.TransferTransactionRecord, error) {
				if len(movements) == 0 {
					movements = append(movements, model.BalanceMovementTypeTransferDebit, model.BalanceMovementTypeTransferCredit)
					sourceBalance -= transferRecord.SourceAmount
					sourceAvailable -= transferRecord.SourceAmount
					destinationBalance += transferRecord.DestinationAmount
					destinationAvailable += transferRecord.DestinationAmount
				}

				now := time.Now().UTC()
				transferRecord.Status = model.TransferStatusCompleted
				transferRecord.StatusSource = statusSourcePointer(source)
				transferRecord.StatusReason = normalizeStatusReason(reason)
				transferRecord.UpdatedAt = &now

				return transferRecord, nil
			},
		},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessTransfer: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyTransferStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, transferRecord.ID, model.TransferStatusCompleted, model.TransactionStatusSourceSystem, optionalStringPointer("fx conversion settled"))
	if err != nil {
		t.Fatalf("expected no error on first transfer completion, got %v", err)
	}

	_, err = service.applyTransferStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, transferRecord.ID, model.TransferStatusCompleted, model.TransactionStatusSourceProvider, optionalStringPointer("duplicate provider completion"))
	if err != nil {
		t.Fatalf("expected no error on repeated transfer completion, got %v", err)
	}

	if len(movements) != 2 || movements[0] != model.BalanceMovementTypeTransferDebit || movements[1] != model.BalanceMovementTypeTransferCredit {
		t.Fatalf("expected transfer debit and credit once, got %#v", movements)
	}

	if sourceBalance != 350 || sourceAvailable != 350 {
		t.Fatalf("expected source account debited once, got balance %.2f available %.2f", sourceBalance, sourceAvailable)
	}

	if destinationBalance != 158.50 || destinationAvailable != 158.50 {
		t.Fatalf("expected destination account credited once, got balance %.2f available %.2f", destinationBalance, destinationAvailable)
	}
}

func TestPaymentCompletionAppliesDebitOnce(t *testing.T) {
	createdAt := time.Now().Add(-5 * time.Minute)
	updatedAt := createdAt
	paymentRecord := model.PaymentTransactionRecord{
		ID:              "payment_123",
		UserID:          "user_123",
		SourceAccountID: "acct_usd_user",
		PaymentType:     model.PaymentTypeInternational,
		Amount:          200,
		Currency:        model.AccountCurrencyUSD,
		Fee:             2.50,
		TotalAmount:     202.50,
		Status:          model.PaymentStatusProcessing,
		CreatedAt:       &createdAt,
		UpdatedAt:       &updatedAt,
	}
	sourceBalance := 500.0
	sourceAvailable := 500.0
	movements := make([]model.BalanceMovementType, 0, 1)

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{
			getPayment: func(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
				return paymentRecord, true, nil
			},
			completePayment: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error) {
				if len(movements) == 0 {
					movements = append(movements, model.BalanceMovementTypePaymentDebit)
					sourceBalance -= paymentRecord.TotalAmount
					sourceAvailable -= paymentRecord.TotalAmount
				}

				now := time.Now().UTC()
				paymentRecord.Status = model.PaymentStatusCompleted
				paymentRecord.StatusSource = statusSourcePointer(source)
				paymentRecord.StatusReason = normalizeStatusReason(reason)
				paymentRecord.UpdatedAt = &now

				return paymentRecord, nil
			},
		},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessPayment: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyPaymentStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, paymentRecord.ID, model.PaymentStatusCompleted, model.TransactionStatusSourceSystem, optionalStringPointer("payment settled"))
	if err != nil {
		t.Fatalf("expected no error on first payment completion, got %v", err)
	}

	_, err = service.applyPaymentStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, paymentRecord.ID, model.PaymentStatusCompleted, model.TransactionStatusSourceProvider, optionalStringPointer("duplicate provider completion"))
	if err != nil {
		t.Fatalf("expected no error on repeated payment completion, got %v", err)
	}

	if len(movements) != 1 || movements[0] != model.BalanceMovementTypePaymentDebit {
		t.Fatalf("expected exactly one payment_debit movement, got %#v", movements)
	}

	if sourceBalance != 297.50 || sourceAvailable != 297.50 {
		t.Fatalf("expected payment debit once, got balance %.2f available %.2f", sourceBalance, sourceAvailable)
	}
}

func TestFundingFailureDoesNotApplyBalanceMovement(t *testing.T) {
	createdAt := time.Now().Add(-5 * time.Minute)
	updatedAt := createdAt
	fundingRecord := model.FundingTransactionRecord{
		ID:        "funding_123",
		UserID:    "user_123",
		AccountID: "acct_ngn_user",
		Amount:    100,
		Currency:  model.AccountCurrencyNGN,
		Status:    model.FundingStatusPending,
		CreatedAt: &createdAt,
		UpdatedAt: &updatedAt,
	}
	updateCalled := 0
	completeCalled := 0

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{
			getFunding: func(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
				return fundingRecord, true, nil
			},
			updateFundingStatus: func(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
				updateCalled++
				now := time.Now().UTC()
				fundingRecord.Status = payload["status"].(model.FundingStatus)
				fundingRecord.UpdatedAt = &now
				return fundingRecord, nil
			},
			completeFunding: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error) {
				completeCalled++
				return fundingRecord, nil
			},
		},
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessFunding: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyFundingStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, fundingRecord.ID, model.FundingStatusFailed, model.TransactionStatusSourceSystem, optionalStringPointer("provider failure"))
	if err != nil {
		t.Fatalf("expected no error when marking funding failed, got %v", err)
	}

	if updateCalled != 1 {
		t.Fatalf("expected failed transition to use status update path once, got %d", updateCalled)
	}

	if completeCalled != 0 {
		t.Fatalf("expected failed transition to avoid completion settlement, got %d", completeCalled)
	}
}

func TestPaymentCompletionReturnsInsufficientFunds(t *testing.T) {
	createdAt := time.Now().Add(-5 * time.Minute)
	updatedAt := createdAt
	paymentRecord := model.PaymentTransactionRecord{
		ID:              "payment_123",
		UserID:          "user_123",
		SourceAccountID: "acct_usd_user",
		PaymentType:     model.PaymentTypeInternational,
		Amount:          200,
		Currency:        model.AccountCurrencyUSD,
		Fee:             2.50,
		TotalAmount:     202.50,
		Status:          model.PaymentStatusProcessing,
		CreatedAt:       &createdAt,
		UpdatedAt:       &updatedAt,
	}

	transactionService := NewTransactionService(
		nil,
		fakeTransactionRepository{},
		fakeTransactionRepository{},
		fakeTransactionRepository{
			getPayment: func(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
				return paymentRecord, true, nil
			},
			completePayment: func(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error) {
				return model.PaymentTransactionRecord{}, repository.ErrInsufficientFunds
			},
		},
		fakeAccountRepository{},
		fakeRecipientRepository{},
		fakePermissionHelper{canAccessPayment: true},
		noopActivityRecorder{},
		testVerificationResolver(model.VerificationStatusVerified),
	)

	service, ok := transactionService.(*DefaultTransactionService)
	if !ok {
		t.Fatal("expected default transaction service implementation")
	}

	_, err := service.applyPaymentStatusTransition(context.Background(), model.AuthenticatedUser{ID: "user_123"}, paymentRecord.ID, model.PaymentStatusCompleted, model.TransactionStatusSourceProvider, optionalStringPointer("provider settlement"))
	if !errors.Is(err, ErrInsufficientFunds) {
		t.Fatalf("expected insufficient funds error, got %v", err)
	}
}
