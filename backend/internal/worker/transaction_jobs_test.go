package worker

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeFundingScanner struct {
	list func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error)
}

func (f fakeFundingScanner) ListFundingByStatusesChangedBefore(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
	if f.list != nil {
		return f.list(ctx, statuses, before, limit)
	}

	return nil, nil
}

type fakeTransferScanner struct {
	list func(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error)
}

func (f fakeTransferScanner) ListTransfersByStatusesChangedBefore(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
	if f.list != nil {
		return f.list(ctx, statuses, before, limit)
	}

	return nil, nil
}

type fakePaymentScanner struct {
	list func(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error)
}

func (f fakePaymentScanner) ListPaymentsByStatusesChangedBefore(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
	if f.list != nil {
		return f.list(ctx, statuses, before, limit)
	}

	return nil, nil
}

type lifecycleCall struct {
	transactionType string
	reference       string
	target          string
	source          model.TransactionStatusSource
	reason          *string
}

type fakeLifecycleUpdater struct {
	updateFundingByReference  func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error)
	updateTransferByReference func(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error)
	updatePaymentByReference  func(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error)
}

func (f fakeLifecycleUpdater) UpdateFundingStatusByReference(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
	if f.updateFundingByReference != nil {
		return f.updateFundingByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.FundingTransactionResponse{}, nil
}

func (f fakeLifecycleUpdater) UpdateTransferStatusByReference(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error) {
	if f.updateTransferByReference != nil {
		return f.updateTransferByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.TransferTransactionResponse{}, nil
}

func (f fakeLifecycleUpdater) UpdatePaymentStatusByReference(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error) {
	if f.updatePaymentByReference != nil {
		return f.updatePaymentByReference(ctx, reference, targetStatus, source, reason)
	}

	return model.PaymentTransactionResponse{}, nil
}

func TestRunProgressionChecksAdvancesEligibleTransactions(t *testing.T) {
	now := time.Date(2026, time.April, 20, 12, 0, 0, 0, time.UTC)
	calls := make([]lifecycleCall, 0, 3)

	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{BatchSize: 10, EnableSimulationProgression: true},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				if len(statuses) == 1 && statuses[0] == model.FundingStatusInitiated {
					return []model.FundingTransactionRecord{{Reference: "funding_ref_123"}}, nil
				}
				return nil, nil
			},
		},
		fakeTransferScanner{
			list: func(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
				if len(statuses) == 1 && statuses[0] == model.TransferStatusInitiated {
					return []model.TransferTransactionRecord{{Reference: "transfer_ref_123"}}, nil
				}
				return nil, nil
			},
		},
		fakePaymentScanner{
			list: func(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
				if len(statuses) == 1 && statuses[0] == model.PaymentStatusSubmitted {
					return []model.PaymentTransactionRecord{{Reference: "payment_ref_123"}}, nil
				}
				return nil, nil
			},
		},
		fakeLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "funding", reference: reference, target: string(targetStatus), source: source, reason: reason})
				return model.FundingTransactionResponse{}, nil
			},
			updateTransferByReference: func(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "transfer", reference: reference, target: string(targetStatus), source: source, reason: reason})
				return model.TransferTransactionResponse{}, nil
			},
			updatePaymentByReference: func(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "payment", reference: reference, target: string(targetStatus), source: source, reason: reason})
				return model.PaymentTransactionResponse{}, nil
			},
		},
	)
	jobs.now = func() time.Time { return now }

	result, err := jobs.RunProgressionChecks(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.Checked != 3 || result.Updated != 3 {
		t.Fatalf("expected 3 checked and 3 updated, got %#v", result)
	}

	if len(calls) != 3 {
		t.Fatalf("expected 3 lifecycle calls, got %d", len(calls))
	}

	for _, call := range calls {
		if call.source != model.TransactionStatusSourceSimulation {
			t.Fatalf("expected simulation source, got %q", call.source)
		}
		if call.reason == nil || *call.reason == "" {
			t.Fatalf("expected progression reason for %#v", call)
		}
	}
}

func TestRunStaleTimeoutChecksFailsTimedOutTransactions(t *testing.T) {
	now := time.Date(2026, time.April, 20, 12, 0, 0, 0, time.UTC)
	calls := make([]lifecycleCall, 0, 3)

	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{
			BatchSize:                 10,
			FundingPendingTimeout:     15 * time.Minute,
			TransferConvertingTimeout: 20 * time.Minute,
			PaymentSubmittedTimeout:   10 * time.Minute,
			PaymentUnderReviewTimeout: 20 * time.Minute,
			PaymentProcessingTimeout:  30 * time.Minute,
		},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				return []model.FundingTransactionRecord{{Reference: "funding_ref_123"}}, nil
			},
		},
		fakeTransferScanner{
			list: func(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
				return []model.TransferTransactionRecord{{Reference: "transfer_ref_123"}}, nil
			},
		},
		fakePaymentScanner{
			list: func(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
				return []model.PaymentTransactionRecord{{Reference: "payment_ref_123"}}, nil
			},
		},
		fakeLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "funding", reference: reference, target: string(targetStatus), source: source})
				return model.FundingTransactionResponse{}, nil
			},
			updateTransferByReference: func(ctx context.Context, reference string, targetStatus model.TransferStatus, source model.TransactionStatusSource, reason *string) (model.TransferTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "transfer", reference: reference, target: string(targetStatus), source: source})
				return model.TransferTransactionResponse{}, nil
			},
			updatePaymentByReference: func(ctx context.Context, reference string, targetStatus model.PaymentStatus, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionResponse, error) {
				calls = append(calls, lifecycleCall{transactionType: "payment", reference: reference, target: string(targetStatus), source: source})
				return model.PaymentTransactionResponse{}, nil
			},
		},
	)
	jobs.now = func() time.Time { return now }

	result, err := jobs.RunStaleTimeoutChecks(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.TimedOut != 5 || result.Updated != 5 {
		t.Fatalf("expected 5 timed out updates, got %#v", result)
	}

	if len(calls) != 5 {
		t.Fatalf("expected 5 lifecycle calls, got %d", len(calls))
	}

	for _, call := range calls {
		if call.target != "failed" {
			t.Fatalf("expected failed target, got %#v", call)
		}
		if call.source != model.TransactionStatusSourceSystem {
			t.Fatalf("expected system source, got %#v", call)
		}
	}
}

func TestRunRetryEvaluationCountsCandidatesWithoutMutation(t *testing.T) {
	updateCalled := false

	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{
			BatchSize:             10,
			RetryEvaluationAge:    2 * time.Minute,
			FundingPendingTimeout: 15 * time.Minute,
		},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				return []model.FundingTransactionRecord{{Reference: "funding_ref_123"}}, nil
			},
		},
		fakeTransferScanner{
			list: func(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
				return []model.TransferTransactionRecord{{Reference: "transfer_ref_123"}}, nil
			},
		},
		fakePaymentScanner{
			list: func(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
				return []model.PaymentTransactionRecord{{Reference: "payment_ref_123"}}, nil
			},
		},
		fakeLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				updateCalled = true
				return model.FundingTransactionResponse{}, nil
			},
		},
	)

	result, err := jobs.RunRetryEvaluation(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.RetryCandidates != 3 || result.Updated != 0 {
		t.Fatalf("expected 3 retry candidates and no updates, got %#v", result)
	}

	if updateCalled {
		t.Fatal("expected retry evaluation to avoid lifecycle mutation")
	}
}

func TestRunProgressionChecksSkipsInvalidTransition(t *testing.T) {
	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{BatchSize: 10, EnableSimulationProgression: true},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				if len(statuses) == 1 && statuses[0] == model.FundingStatusInitiated {
					return []model.FundingTransactionRecord{{Reference: "funding_ref_123"}}, nil
				}
				return nil, nil
			},
		},
		fakeTransferScanner{},
		fakePaymentScanner{},
		fakeLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				return model.FundingTransactionResponse{}, service.ErrInvalidTransactionTransition
			},
		},
	)

	result, err := jobs.RunProgressionChecks(context.Background())
	if err != nil {
		t.Fatalf("expected invalid transition to be skipped, got %v", err)
	}

	if result.Checked != 1 || result.Updated != 0 {
		t.Fatalf("expected one checked record and no updates, got %#v", result)
	}
}

func TestRunStaleTimeoutChecksRemainSafeAcrossRepeatedRuns(t *testing.T) {
	callCount := 0
	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{
			BatchSize:                 10,
			FundingPendingTimeout:     15 * time.Minute,
			TransferConvertingTimeout: 20 * time.Minute,
			PaymentSubmittedTimeout:   10 * time.Minute,
			PaymentUnderReviewTimeout: 20 * time.Minute,
			PaymentProcessingTimeout:  30 * time.Minute,
		},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				if len(statuses) == 1 && statuses[0] == model.FundingStatusPending {
					return []model.FundingTransactionRecord{{Reference: "funding_ref_123"}}, nil
				}
				return nil, nil
			},
		},
		fakeTransferScanner{},
		fakePaymentScanner{},
		fakeLifecycleUpdater{
			updateFundingByReference: func(ctx context.Context, reference string, targetStatus model.FundingStatus, source model.TransactionStatusSource, reason *string) (model.FundingTransactionResponse, error) {
				callCount++
				if callCount == 1 {
					return model.FundingTransactionResponse{}, nil
				}
				return model.FundingTransactionResponse{}, service.ErrInvalidTransactionTransition
			},
		},
	)

	first, err := jobs.RunStaleTimeoutChecks(context.Background())
	if err != nil {
		t.Fatalf("expected first run to succeed, got %v", err)
	}

	second, err := jobs.RunStaleTimeoutChecks(context.Background())
	if err != nil {
		t.Fatalf("expected repeated run to stay safe, got %v", err)
	}

	if first.Updated != 1 || first.TimedOut != 1 {
		t.Fatalf("expected first run to apply one timeout, got %#v", first)
	}

	if second.Updated != 0 || second.TimedOut != 0 {
		t.Fatalf("expected second run to skip duplicate timeout, got %#v", second)
	}
}

func TestRunProgressionChecksReturnsScanError(t *testing.T) {
	jobs := NewTransactionJobs(
		nil,
		config.WorkerConfig{BatchSize: 10, EnableSimulationProgression: true},
		fakeFundingScanner{
			list: func(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
				return nil, errors.New("scan failed")
			},
		},
		fakeTransferScanner{},
		fakePaymentScanner{},
		fakeLifecycleUpdater{},
	)

	_, err := jobs.RunProgressionChecks(context.Background())
	if err == nil {
		t.Fatal("expected scan error")
	}
}
