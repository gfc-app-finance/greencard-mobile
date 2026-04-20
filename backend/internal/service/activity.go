package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

const recentActivityLimit = 5

var ErrActivityUnavailable = errors.New("activity unavailable")

type ActivityEventRecorder interface {
	RecordFundingEvent(ctx context.Context, userID string, record model.FundingTransactionRecord) error
	RecordTransferEvent(ctx context.Context, userID string, record model.TransferTransactionRecord) error
	RecordPaymentEvent(ctx context.Context, userID string, record model.PaymentTransactionRecord) error
	RecordSupportTicketCreated(ctx context.Context, userID string, record model.SupportTicketRecord) error
}

type ActivityService interface {
	ActivityEventRecorder
	ListActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error)
	ListRecentActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error)
}

type DefaultActivityService struct {
	logger          *slog.Logger
	repository      repository.ActivityRepository
	accountRepo     repository.AccountRepository
	accountSeedData AccountSeedProvider
}

func NewActivityService(
	logger *slog.Logger,
	repository repository.ActivityRepository,
	accountRepo repository.AccountRepository,
) ActivityService {
	return &DefaultActivityService{
		logger:          logger,
		repository:      repository,
		accountRepo:     accountRepo,
		accountSeedData: NewSeededAccountProvider(),
	}
}

func (s *DefaultActivityService) RecordFundingEvent(ctx context.Context, userID string, record model.FundingTransactionRecord) error {
	activity, err := s.buildFundingActivity(ctx, userID, record)
	if err != nil {
		return err
	}

	return s.upsertActivity(ctx, activity)
}

func (s *DefaultActivityService) RecordTransferEvent(ctx context.Context, userID string, record model.TransferTransactionRecord) error {
	activity, err := s.buildTransferActivity(ctx, userID, record)
	if err != nil {
		return err
	}

	return s.upsertActivity(ctx, activity)
}

func (s *DefaultActivityService) RecordPaymentEvent(ctx context.Context, userID string, record model.PaymentTransactionRecord) error {
	activity, err := s.buildPaymentActivity(ctx, userID, record)
	if err != nil {
		return err
	}

	return s.upsertActivity(ctx, activity)
}

func (s *DefaultActivityService) RecordSupportTicketCreated(ctx context.Context, userID string, record model.SupportTicketRecord) error {
	activity, err := s.buildSupportTicketActivity(record, userID)
	if err != nil {
		return err
	}

	return s.upsertActivity(ctx, activity)
}

func (s *DefaultActivityService) ListActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error) {
	records, err := s.repository.ListByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list activity", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.ActivityListResponse{}, ErrActivityUnavailable
	}

	return model.ActivityListResponse{Activities: buildActivityItems(records)}, nil
}

func (s *DefaultActivityService) ListRecentActivity(ctx context.Context, user model.AuthenticatedUser) (model.ActivityListResponse, error) {
	records, err := s.repository.ListRecentByUserID(ctx, user.ID, recentActivityLimit)
	if err != nil {
		s.logger.Error("failed to list recent activity", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.ActivityListResponse{}, ErrActivityUnavailable
	}

	return model.ActivityListResponse{Activities: buildActivityItems(records)}, nil
}

func (s *DefaultActivityService) upsertActivity(ctx context.Context, activity model.ActivityRecord) error {
	if !activity.Type.IsValid() || !activity.Status.IsValid() || !activity.LinkedEntityType.IsValid() {
		return fmt.Errorf("activity record is invalid for type %q status %q entity %q", activity.Type, activity.Status, activity.LinkedEntityType)
	}

	if _, err := s.repository.Upsert(ctx, activity); err != nil {
		s.logger.Error("failed to upsert activity record", slog.String("user_id", activity.UserID), slog.String("linked_entity_type", string(activity.LinkedEntityType)), slog.String("linked_entity_id", activity.LinkedEntityID), slog.String("error", err.Error()))
		return ErrActivityUnavailable
	}

	return nil
}

func (s *DefaultActivityService) buildFundingActivity(ctx context.Context, userID string, record model.FundingTransactionRecord) (model.ActivityRecord, error) {
	accountLabel := s.accountLabel(ctx, userID, record.AccountID, record.Currency, "Funding account")
	activityType := model.ActivityTypeFundingCreated
	switch record.Status {
	case model.FundingStatusCompleted:
		activityType = model.ActivityTypeFundingCompleted
	case model.FundingStatusFailed:
		activityType = model.ActivityTypeFundingFailed
	}

	title := fmt.Sprintf("Added %.2f %s to %s", roundTo2(record.Amount), record.Currency, accountLabel)
	subtitle := fmt.Sprintf("Funding into %s", accountLabel)
	amount := roundTo2(record.Amount)
	currency := record.Currency

	return model.ActivityRecord{
		UserID:           userID,
		Type:             activityType,
		Title:            title,
		Subtitle:         subtitle,
		Amount:           &amount,
		Currency:         &currency,
		Status:           model.ActivityStatus(record.Status),
		LinkedEntityType: model.LinkedEntityTypeFundingTransaction,
		LinkedEntityID:   record.ID,
		CreatedAt:        record.CreatedAt,
		UpdatedAt:        bestActivityUpdateTime(record.CreatedAt, record.UpdatedAt),
	}, nil
}

func (s *DefaultActivityService) buildTransferActivity(ctx context.Context, userID string, record model.TransferTransactionRecord) (model.ActivityRecord, error) {
	sourceLabel := s.accountLabel(ctx, userID, record.SourceAccountID, record.SourceCurrency, "Source account")
	destinationLabel := s.accountLabel(ctx, userID, record.DestinationAccountID, record.DestinationCurrency, "Destination account")
	activityType := model.ActivityTypeTransferCreated
	switch record.Status {
	case model.TransferStatusCompleted:
		activityType = model.ActivityTypeTransferCompleted
	case model.TransferStatusFailed:
		activityType = model.ActivityTypeTransferFailed
	}

	title := fmt.Sprintf("Moved %.2f %s to %s", roundTo2(record.SourceAmount), record.SourceCurrency, destinationLabel)
	subtitle := fmt.Sprintf("%s to %s", sourceLabel, destinationLabel)
	amount := roundTo2(record.SourceAmount)
	currency := record.SourceCurrency

	return model.ActivityRecord{
		UserID:           userID,
		Type:             activityType,
		Title:            title,
		Subtitle:         subtitle,
		Amount:           &amount,
		Currency:         &currency,
		Status:           model.ActivityStatus(record.Status),
		LinkedEntityType: model.LinkedEntityTypeTransferTransaction,
		LinkedEntityID:   record.ID,
		CreatedAt:        record.CreatedAt,
		UpdatedAt:        bestActivityUpdateTime(record.CreatedAt, record.UpdatedAt),
	}, nil
}

func (s *DefaultActivityService) buildPaymentActivity(ctx context.Context, userID string, record model.PaymentTransactionRecord) (model.ActivityRecord, error) {
	sourceLabel := s.accountLabel(ctx, userID, record.SourceAccountID, record.Currency, "Funding account")
	activityType := model.ActivityTypePaymentCreated
	switch record.Status {
	case model.PaymentStatusUnderReview, model.PaymentStatusProcessing:
		activityType = model.ActivityTypePaymentProcessing
	case model.PaymentStatusCompleted:
		activityType = model.ActivityTypePaymentCompleted
	case model.PaymentStatusFailed:
		activityType = model.ActivityTypePaymentFailed
	}

	title := fmt.Sprintf("Sent %.2f %s payment", roundTo2(record.Amount), record.Currency)
	subtitle := fmt.Sprintf("%s payment from %s", paymentTypeLabel(record.PaymentType), sourceLabel)
	amount := roundTo2(record.Amount)
	currency := record.Currency

	return model.ActivityRecord{
		UserID:           userID,
		Type:             activityType,
		Title:            title,
		Subtitle:         subtitle,
		Amount:           &amount,
		Currency:         &currency,
		Status:           model.ActivityStatus(record.Status),
		LinkedEntityType: model.LinkedEntityTypePaymentTransaction,
		LinkedEntityID:   record.ID,
		CreatedAt:        record.CreatedAt,
		UpdatedAt:        bestActivityUpdateTime(record.CreatedAt, record.UpdatedAt),
	}, nil
}

func (s *DefaultActivityService) buildSupportTicketActivity(record model.SupportTicketRecord, userID string) (model.ActivityRecord, error) {
	subtitle := record.Title
	if record.LinkedEntityType != nil && record.LinkedEntityID != nil {
		subtitle = record.Title + " - linked to " + string(*record.LinkedEntityType)
	}

	return model.ActivityRecord{
		UserID:           userID,
		Type:             model.ActivityTypeTicketCreated,
		Title:            "Opened support ticket",
		Subtitle:         subtitle,
		Status:           model.ActivityStatus(record.Status),
		LinkedEntityType: model.LinkedEntityTypeSupportTicket,
		LinkedEntityID:   record.ID,
		CreatedAt:        record.CreatedAt,
		UpdatedAt:        bestActivityUpdateTime(record.CreatedAt, record.UpdatedAt),
	}, nil
}

func (s *DefaultActivityService) accountLabel(ctx context.Context, userID, accountID string, fallbackCurrency model.AccountCurrency, fallbackLabel string) string {
	if strings.TrimSpace(accountID) == "" {
		if fallbackCurrency.IsValid() {
			return "Personal " + string(fallbackCurrency)
		}
		return fallbackLabel
	}

	record, found, err := s.accountRepo.GetByIDForUser(ctx, userID, accountID)
	if err == nil && found {
		if label := strings.TrimSpace(record.DisplayName); label != "" {
			return label
		}
		if record.Currency.IsValid() {
			return "Personal " + string(record.Currency)
		}
	}

	if seeded, found := s.accountSeedData.GetByIDForUser(userID, accountID); found {
		if label := strings.TrimSpace(seeded.DisplayName); label != "" {
			return label
		}
		if seeded.Currency.IsValid() {
			return "Personal " + string(seeded.Currency)
		}
	}

	if fallbackCurrency.IsValid() {
		return "Personal " + string(fallbackCurrency)
	}

	return fallbackLabel
}

func buildActivityItems(records []model.ActivityRecord) []model.ActivityItem {
	activities := make([]model.ActivityItem, 0, len(records))
	for _, record := range records {
		if !record.Type.IsValid() || !record.Status.IsValid() || !record.LinkedEntityType.IsValid() {
			continue
		}

		activities = append(activities, model.ActivityItem{
			ID:               record.ID,
			Type:             record.Type,
			Title:            record.Title,
			Subtitle:         record.Subtitle,
			Amount:           record.Amount,
			Currency:         record.Currency,
			Status:           record.Status,
			LinkedEntityType: record.LinkedEntityType,
			LinkedEntityID:   record.LinkedEntityID,
			CreatedAt:        record.CreatedAt,
			UpdatedAt:        record.UpdatedAt,
		})
	}

	return activities
}

func bestActivityUpdateTime(createdAt, updatedAt *time.Time) *time.Time {
	if updatedAt != nil {
		return updatedAt
	}

	if createdAt != nil {
		return createdAt
	}

	now := time.Now().UTC()
	return &now
}

func paymentTypeLabel(paymentType model.PaymentType) string {
	switch paymentType {
	case model.PaymentTypeInternational:
		return "International"
	default:
		return "Bank"
	}
}
