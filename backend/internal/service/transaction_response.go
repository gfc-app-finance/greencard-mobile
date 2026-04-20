package service

import (
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func buildFundingTransaction(record model.FundingTransactionRecord) model.FundingTransaction {
	return model.FundingTransaction{
		ID:        record.ID,
		Type:      "funding",
		AccountID: record.AccountID,
		Amount: model.TransactionAmount{
			Value:    roundTo2(record.Amount),
			Currency: record.Currency,
		},
		Status:             record.Status,
		StatusReason:       copyOptionalString(record.StatusReason),
		StatusSource:       copyOptionalStatusSource(record.StatusSource),
		LastStatusChangeAt: copyOptionalTime(record.LastStatusChangeAt),
		Reference:          record.Reference,
		CreatedAt:          record.CreatedAt,
		UpdatedAt:          record.UpdatedAt,
		Timeline:           fundingTimeline(record),
	}
}

func buildTransferTransaction(record model.TransferTransactionRecord) model.TransferTransaction {
	return model.TransferTransaction{
		ID:                   record.ID,
		Type:                 "transfer",
		SourceAccountID:      record.SourceAccountID,
		DestinationAccountID: record.DestinationAccountID,
		SourceAmount: model.TransactionAmount{
			Value:    roundTo2(record.SourceAmount),
			Currency: record.SourceCurrency,
		},
		DestinationAmount: model.TransactionAmount{
			Value:    roundTo2(record.DestinationAmount),
			Currency: record.DestinationCurrency,
		},
		FXRate:             record.FXRate,
		Status:             record.Status,
		StatusReason:       copyOptionalString(record.StatusReason),
		StatusSource:       copyOptionalStatusSource(record.StatusSource),
		LastStatusChangeAt: copyOptionalTime(record.LastStatusChangeAt),
		Reference:          record.Reference,
		CreatedAt:          record.CreatedAt,
		UpdatedAt:          record.UpdatedAt,
		Timeline:           transferTimeline(record),
	}
}

func buildPaymentTransaction(record model.PaymentTransactionRecord) model.PaymentTransaction {
	return model.PaymentTransaction{
		ID:                 record.ID,
		Type:               "payment",
		SourceAccountID:    record.SourceAccountID,
		RecipientID:        copyOptionalString(record.RecipientID),
		RecipientReference: record.RecipientReference,
		PaymentType:        record.PaymentType,
		Amount: model.TransactionAmount{
			Value:    roundTo2(record.Amount),
			Currency: record.Currency,
		},
		Fee: model.TransactionAmount{
			Value:    roundTo2(record.Fee),
			Currency: record.Currency,
		},
		FXRate: record.FXRate,
		TotalAmount: model.TransactionAmount{
			Value:    roundTo2(record.TotalAmount),
			Currency: record.Currency,
		},
		Status:             record.Status,
		StatusReason:       copyOptionalString(record.StatusReason),
		StatusSource:       copyOptionalStatusSource(record.StatusSource),
		LastStatusChangeAt: copyOptionalTime(record.LastStatusChangeAt),
		Reference:          record.Reference,
		CreatedAt:          record.CreatedAt,
		UpdatedAt:          record.UpdatedAt,
		Timeline:           paymentTimeline(record),
	}
}

func fundingTimeline(record model.FundingTransactionRecord) []model.TransactionStepState {
	stepTimes := timelineStepTimes(record.CreatedAt, coalesceStatusChangeTime(record.LastStatusChangeAt, record.UpdatedAt), 3)
	if record.Status == model.FundingStatusFailed {
		return []model.TransactionStepState{
			{Code: "initiated", Label: "Initiated", IsCompleted: true, UpdatedAt: stepTimes[0]},
			{Code: "failed", Label: "Failed", IsCurrent: true, UpdatedAt: stepTimes[1]},
		}
	}

	return []model.TransactionStepState{
		newTimelineStep("initiated", "Initiated", fundingProgressIndex(record.Status), 0, stepTimes[0]),
		newTimelineStep("pending", "Pending", fundingProgressIndex(record.Status), 1, stepTimes[1]),
		newTimelineStep("completed", "Completed", fundingProgressIndex(record.Status), 2, stepTimes[2]),
	}
}

func transferTimeline(record model.TransferTransactionRecord) []model.TransactionStepState {
	stepTimes := timelineStepTimes(record.CreatedAt, coalesceStatusChangeTime(record.LastStatusChangeAt, record.UpdatedAt), 3)
	if record.Status == model.TransferStatusFailed {
		return []model.TransactionStepState{
			{Code: "initiated", Label: "Initiated", IsCompleted: true, UpdatedAt: stepTimes[0]},
			{Code: "failed", Label: "Failed", IsCurrent: true, UpdatedAt: stepTimes[1]},
		}
	}

	return []model.TransactionStepState{
		newTimelineStep("initiated", "Initiated", transferProgressIndex(record.Status), 0, stepTimes[0]),
		newTimelineStep("converting", "Converting", transferProgressIndex(record.Status), 1, stepTimes[1]),
		newTimelineStep("completed", "Completed", transferProgressIndex(record.Status), 2, stepTimes[2]),
	}
}

func paymentTimeline(record model.PaymentTransactionRecord) []model.TransactionStepState {
	stepTimes := timelineStepTimes(record.CreatedAt, coalesceStatusChangeTime(record.LastStatusChangeAt, record.UpdatedAt), 4)
	if record.Status == model.PaymentStatusFailed {
		return []model.TransactionStepState{
			{Code: "submitted", Label: "Submitted", IsCompleted: true, UpdatedAt: stepTimes[0]},
			{Code: "failed", Label: "Failed", IsCurrent: true, UpdatedAt: stepTimes[1]},
		}
	}

	progressIndex := paymentProgressIndex(record.Status)

	return []model.TransactionStepState{
		newTimelineStep("submitted", "Submitted", progressIndex, 0, stepTimes[0]),
		newTimelineStep("under_review", "Under review", progressIndex, 1, stepTimes[1]),
		newTimelineStep("processing", "Processing", progressIndex, 2, stepTimes[2]),
		newTimelineStep("completed", "Completed", progressIndex, 3, stepTimes[3]),
	}
}

func newTimelineStep(code, label string, progressIndex, currentIndex int, updatedAt *time.Time) model.TransactionStepState {
	return model.TransactionStepState{
		Code:        code,
		Label:       label,
		IsCompleted: progressIndex > currentIndex,
		IsCurrent:   progressIndex == currentIndex,
		UpdatedAt:   updatedAt,
	}
}

func fundingProgressIndex(status model.FundingStatus) int {
	switch status {
	case model.FundingStatusCompleted:
		return 2
	case model.FundingStatusPending:
		return 1
	default:
		return 0
	}
}

func transferProgressIndex(status model.TransferStatus) int {
	switch status {
	case model.TransferStatusCompleted:
		return 2
	case model.TransferStatusConverting:
		return 1
	default:
		return 0
	}
}

func paymentProgressIndex(status model.PaymentStatus) int {
	switch status {
	case model.PaymentStatusCompleted:
		return 3
	case model.PaymentStatusProcessing:
		return 2
	case model.PaymentStatusUnderReview:
		return 1
	default:
		return 0
	}
}

func copyOptionalStatusSource(value *model.TransactionStatusSource) *model.TransactionStatusSource {
	if value == nil {
		return nil
	}

	copy := *value
	return &copy
}

func copyOptionalTime(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}

	copy := *value
	return &copy
}

func timelineStepTimes(createdAt, updatedAt *time.Time, count int) []*time.Time {
	steps := make([]*time.Time, count)
	if createdAt == nil {
		return steps
	}

	steps[0] = createdAt
	if updatedAt == nil || count == 1 {
		return steps
	}

	for index := 1; index < count; index++ {
		if index == count-1 {
			steps[index] = updatedAt
			continue
		}

		offset := time.Duration(index) * time.Second
		stepTime := createdAt.Add(offset)
		steps[index] = &stepTime
	}

	return steps
}

func coalesceStatusChangeTime(lastStatusChangeAt, updatedAt *time.Time) *time.Time {
	if lastStatusChangeAt != nil {
		return lastStatusChangeAt
	}

	return updatedAt
}

func recipientDisplayLabel(recipient model.RecipientRecord) string {
	if recipient.Nickname != nil && *recipient.Nickname != "" {
		return *recipient.Nickname
	}

	return recipient.FullName
}
