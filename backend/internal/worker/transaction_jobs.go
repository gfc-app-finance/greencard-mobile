package worker

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

var ErrWorkerMisconfigured = errors.New("worker is misconfigured")

type FundingStatusScanner interface {
	ListFundingByStatusesChangedBefore(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error)
}

type TransferStatusScanner interface {
	ListTransfersByStatusesChangedBefore(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error)
}

type PaymentStatusScanner interface {
	ListPaymentsByStatusesChangedBefore(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error)
}

type TransactionJobs struct {
	logger    *slog.Logger
	config    config.WorkerConfig
	funding   FundingStatusScanner
	transfers TransferStatusScanner
	payments  PaymentStatusScanner
	lifecycle service.TransactionLifecycleUpdateService
	now       func() time.Time
}

func NewTransactionJobs(
	logger *slog.Logger,
	cfg config.WorkerConfig,
	funding FundingStatusScanner,
	transfers TransferStatusScanner,
	payments PaymentStatusScanner,
	lifecycle service.TransactionLifecycleUpdateService,
) *TransactionJobs {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	return &TransactionJobs{
		logger:    logger,
		config:    cfg,
		funding:   funding,
		transfers: transfers,
		payments:  payments,
		lifecycle: lifecycle,
		now: func() time.Time {
			return time.Now().UTC()
		},
	}
}

func (j *TransactionJobs) Jobs() []Job {
	if j == nil {
		return nil
	}

	jobs := make([]Job, 0, 3)
	if j.config.EnableSimulationProgression {
		jobs = append(jobs, namedJob{name: "transaction_progression", run: j.RunProgressionChecks})
	}

	jobs = append(
		jobs,
		namedJob{name: "transaction_stale_timeouts", run: j.RunStaleTimeoutChecks},
		namedJob{name: "transaction_retry_evaluation", run: j.RunRetryEvaluation},
	)

	return jobs
}

func (j *TransactionJobs) RunProgressionChecks(ctx context.Context) (Result, error) {
	if err := j.validate(); err != nil {
		return Result{}, err
	}

	result := Result{}

	nextResult, err := j.advanceFundingStatuses(ctx, model.FundingStatusInitiated, model.FundingStatusPending, 5*time.Second, "background simulation advanced funding to pending")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advanceFundingStatuses(ctx, model.FundingStatusPending, model.FundingStatusCompleted, 10*time.Second, "background simulation advanced funding to completed")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advanceTransferStatuses(ctx, model.TransferStatusInitiated, model.TransferStatusConverting, 5*time.Second, "background simulation advanced transfer to converting")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advanceTransferStatuses(ctx, model.TransferStatusConverting, model.TransferStatusCompleted, 10*time.Second, "background simulation advanced transfer to completed")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advancePaymentStatuses(ctx, model.PaymentStatusSubmitted, model.PaymentStatusUnderReview, 4*time.Second, "background simulation advanced payment to under_review")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advancePaymentStatuses(ctx, model.PaymentStatusUnderReview, model.PaymentStatusProcessing, 8*time.Second, "background simulation advanced payment to processing")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.advancePaymentStatuses(ctx, model.PaymentStatusProcessing, model.PaymentStatusCompleted, 13*time.Second, "background simulation advanced payment to completed")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}

	return result, nil
}

func (j *TransactionJobs) RunStaleTimeoutChecks(ctx context.Context) (Result, error) {
	if err := j.validate(); err != nil {
		return Result{}, err
	}

	result := Result{}

	nextResult, err := j.failFundingStatuses(ctx, []model.FundingStatus{model.FundingStatusPending}, j.config.FundingPendingTimeout, "background worker timed out funding pending too long")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.failTransferStatuses(ctx, []model.TransferStatus{model.TransferStatusConverting}, j.config.TransferConvertingTimeout, "background worker timed out transfer converting too long")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.failPaymentStatuses(ctx, []model.PaymentStatus{model.PaymentStatusSubmitted}, j.config.PaymentSubmittedTimeout, "background worker timed out payment submission too long")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.failPaymentStatuses(ctx, []model.PaymentStatus{model.PaymentStatusUnderReview}, j.config.PaymentUnderReviewTimeout, "background worker timed out payment review too long")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}
	nextResult, err = j.failPaymentStatuses(ctx, []model.PaymentStatus{model.PaymentStatusProcessing}, j.config.PaymentProcessingTimeout, "background worker timed out payment processing too long")
	if err := accumulateResult(&result, nextResult, err); err != nil {
		return result, err
	}

	return result, nil
}

func (j *TransactionJobs) RunRetryEvaluation(ctx context.Context) (Result, error) {
	if err := j.validate(); err != nil {
		return Result{}, err
	}

	before := j.now().Add(-j.config.RetryEvaluationAge)
	result := Result{}

	fundingRecords, err := j.funding.ListFundingByStatusesChangedBefore(ctx, []model.FundingStatus{model.FundingStatusInitiated, model.FundingStatusPending}, before, j.config.BatchSize)
	if err != nil {
		return result, err
	}
	result.Checked += len(fundingRecords)
	result.RetryCandidates += len(fundingRecords)

	transferRecords, err := j.transfers.ListTransfersByStatusesChangedBefore(ctx, []model.TransferStatus{model.TransferStatusInitiated, model.TransferStatusConverting}, before, j.config.BatchSize)
	if err != nil {
		return result, err
	}
	result.Checked += len(transferRecords)
	result.RetryCandidates += len(transferRecords)

	paymentRecords, err := j.payments.ListPaymentsByStatusesChangedBefore(ctx, []model.PaymentStatus{model.PaymentStatusSubmitted, model.PaymentStatusUnderReview, model.PaymentStatusProcessing}, before, j.config.BatchSize)
	if err != nil {
		return result, err
	}
	result.Checked += len(paymentRecords)
	result.RetryCandidates += len(paymentRecords)

	return result, nil
}

func (j *TransactionJobs) advanceFundingStatuses(ctx context.Context, current, target model.FundingStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.funding.ListFundingByStatusesChangedBefore(ctx, []model.FundingStatus{current}, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdateFundingStatusByReference(ctx, record.Reference, target, model.TransactionStatusSourceSimulation, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "funding") {
				continue
			}

			return result, err
		}

		result.Updated++
	}

	return result, nil
}

func (j *TransactionJobs) advanceTransferStatuses(ctx context.Context, current, target model.TransferStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.transfers.ListTransfersByStatusesChangedBefore(ctx, []model.TransferStatus{current}, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdateTransferStatusByReference(ctx, record.Reference, target, model.TransactionStatusSourceSimulation, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "transfer") {
				continue
			}

			return result, err
		}

		result.Updated++
	}

	return result, nil
}

func (j *TransactionJobs) advancePaymentStatuses(ctx context.Context, current, target model.PaymentStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.payments.ListPaymentsByStatusesChangedBefore(ctx, []model.PaymentStatus{current}, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdatePaymentStatusByReference(ctx, record.Reference, target, model.TransactionStatusSourceSimulation, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "payment") {
				continue
			}

			return result, err
		}

		result.Updated++
	}

	return result, nil
}

func (j *TransactionJobs) failFundingStatuses(ctx context.Context, statuses []model.FundingStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.funding.ListFundingByStatusesChangedBefore(ctx, statuses, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdateFundingStatusByReference(ctx, record.Reference, model.FundingStatusFailed, model.TransactionStatusSourceSystem, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "funding") {
				continue
			}

			return result, err
		}

		result.Updated++
		result.TimedOut++
	}

	return result, nil
}

func (j *TransactionJobs) failTransferStatuses(ctx context.Context, statuses []model.TransferStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.transfers.ListTransfersByStatusesChangedBefore(ctx, statuses, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdateTransferStatusByReference(ctx, record.Reference, model.TransferStatusFailed, model.TransactionStatusSourceSystem, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "transfer") {
				continue
			}

			return result, err
		}

		result.Updated++
		result.TimedOut++
	}

	return result, nil
}

func (j *TransactionJobs) failPaymentStatuses(ctx context.Context, statuses []model.PaymentStatus, threshold time.Duration, reason string) (Result, error) {
	before := j.now().Add(-threshold)
	records, err := j.payments.ListPaymentsByStatusesChangedBefore(ctx, statuses, before, j.config.BatchSize)
	if err != nil {
		return Result{}, err
	}

	result := Result{Checked: len(records)}
	for _, record := range records {
		if ctx.Err() != nil {
			return result, nil
		}

		if _, err := j.lifecycle.UpdatePaymentStatusByReference(ctx, record.Reference, model.PaymentStatusFailed, model.TransactionStatusSourceSystem, optionalReason(reason)); err != nil {
			if j.shouldSkipUpdateError(err, record.Reference, "payment") {
				continue
			}

			return result, err
		}

		result.Updated++
		result.TimedOut++
	}

	return result, nil
}

func (j *TransactionJobs) validate() error {
	switch {
	case j == nil:
		return ErrWorkerMisconfigured
	case j.funding == nil || j.transfers == nil || j.payments == nil || j.lifecycle == nil:
		return ErrWorkerMisconfigured
	case j.now == nil:
		return ErrWorkerMisconfigured
	default:
		return nil
	}
}

func (j *TransactionJobs) shouldSkipUpdateError(err error, reference, transactionType string) bool {
	if !isSkippableUpdateError(err) {
		return false
	}

	j.logger.Warn(
		"worker skipped transaction update",
		slog.String("transaction_type", transactionType),
		slog.String("reference", reference),
		slog.String("error", err.Error()),
	)

	return true
}

func isSkippableUpdateError(err error) bool {
	return errors.Is(err, service.ErrInvalidTransactionTransition) ||
		errors.Is(err, service.ErrFundingTransactionNotFound) ||
		errors.Is(err, service.ErrTransferTransactionNotFound) ||
		errors.Is(err, service.ErrPaymentTransactionNotFound) ||
		errors.Is(err, service.ErrInsufficientFunds)
}

func optionalReason(value string) *string {
	if value == "" {
		return nil
	}

	return &value
}

func accumulateResult(target *Result, next Result, err error) error {
	mergeResult(target, next)
	return err
}

func mergeResult(target *Result, next Result) {
	if target == nil {
		return
	}

	target.Checked += next.Checked
	target.Updated += next.Updated
	target.TimedOut += next.TimedOut
	target.RetryCandidates += next.RetryCandidates
}
