package service

import (
	"context"
	"log/slog"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

type VerificationResolver interface {
	ResolveForUser(ctx context.Context, userID string) (model.VerificationStatus, error)
	NormalizeProfile(profile model.ProfileRecord) model.VerificationStatus
}

type DefaultVerificationResolver struct {
	logger      *slog.Logger
	profileRepo repository.ProfileRepository
}

func NewVerificationResolver(logger *slog.Logger, profileRepo repository.ProfileRepository) VerificationResolver {
	return &DefaultVerificationResolver{
		logger:      logger,
		profileRepo: profileRepo,
	}
}

func (r *DefaultVerificationResolver) ResolveForUser(ctx context.Context, userID string) (model.VerificationStatus, error) {
	record, found, err := r.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		if r.logger != nil {
			r.logger.Error("failed to resolve verification status", slog.String("user_id", userID), slog.String("error", err.Error()))
		}
		return "", err
	}

	if !found {
		record = model.ProfileRecord{
			ID:                 userID,
			VerificationStatus: model.VerificationStatusBasic,
		}
	}

	return ResolveVerificationStatus(record.VerificationStatus, record), nil
}

func (DefaultVerificationResolver) NormalizeProfile(profile model.ProfileRecord) model.VerificationStatus {
	return ResolveVerificationStatus(profile.VerificationStatus, profile)
}
