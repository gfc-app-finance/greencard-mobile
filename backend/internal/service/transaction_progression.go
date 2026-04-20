package service

import (
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
