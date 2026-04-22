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

var ErrProfileUnavailable = errors.New("profile unavailable")

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type ValidationErrors []ValidationError

func (errors ValidationErrors) Error() string {
	if len(errors) == 0 {
		return "validation failed"
	}

	return fmt.Sprintf("validation failed: %s", errors[0].Message)
}

type ProfileService interface {
	GetCurrentProfile(ctx context.Context, user model.AuthenticatedUser) (model.CurrentUserProfileResponse, error)
	UpdateCurrentProfile(ctx context.Context, user model.AuthenticatedUser, input model.UpdateProfileInput) (model.CurrentUserProfileResponse, error)
}

type DefaultProfileService struct {
	logger       *slog.Logger
	repository   repository.ProfileRepository
	permissions  PermissionHelper
	verification VerificationResolver
	audit        AuditRecorder
}

func NewProfileService(logger *slog.Logger, repository repository.ProfileRepository, permissions PermissionHelper, verification VerificationResolver, auditors ...AuditRecorder) ProfileService {
	var audit AuditRecorder
	if len(auditors) > 0 {
		audit = auditors[0]
	}

	return &DefaultProfileService{
		logger:       logger,
		repository:   repository,
		permissions:  permissions,
		verification: verification,
		audit:        audit,
	}
}

func (s *DefaultProfileService) GetCurrentProfile(ctx context.Context, user model.AuthenticatedUser) (model.CurrentUserProfileResponse, error) {
	record, found, err := s.repository.GetByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to fetch current profile", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.CurrentUserProfileResponse{}, ErrProfileUnavailable
	}

	if !found {
		record = model.ProfileRecord{
			ID:                 user.ID,
			VerificationStatus: model.VerificationStatusBasic,
		}
	}

	record.VerificationStatus = s.verification.NormalizeProfile(record)

	return buildProfileResponse(user, record, s.permissions), nil
}

func (s *DefaultProfileService) UpdateCurrentProfile(ctx context.Context, user model.AuthenticatedUser, input model.UpdateProfileInput) (model.CurrentUserProfileResponse, error) {
	input, validationErrors := validateUpdateProfileInput(input)
	if len(validationErrors) > 0 {
		return model.CurrentUserProfileResponse{}, validationErrors
	}

	record, found, err := s.repository.GetByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to fetch profile before update", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.CurrentUserProfileResponse{}, ErrProfileUnavailable
	}

	if !found {
		record = model.ProfileRecord{
			ID:                 user.ID,
			VerificationStatus: model.VerificationStatusBasic,
		}
	}
	previousStatus := s.verification.NormalizeProfile(record)
	updatedFields := updatedProfileFields(input)

	mergedRecord := mergeProfileRecord(record, input)
	mergedRecord.ID = user.ID
	mergedRecord.VerificationStatus = s.verification.NormalizeProfile(model.ProfileRecord{
		ID:                 mergedRecord.ID,
		FullName:           mergedRecord.FullName,
		DateOfBirth:        mergedRecord.DateOfBirth,
		ResidentialAddress: mergedRecord.ResidentialAddress,
		Nationality:        mergedRecord.Nationality,
		VerificationStatus: record.VerificationStatus,
		CreatedAt:          mergedRecord.CreatedAt,
		UpdatedAt:          mergedRecord.UpdatedAt,
	})

	savedRecord, err := s.repository.Upsert(ctx, mergedRecord)
	if err != nil {
		s.logger.Error("failed to persist current profile", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.CurrentUserProfileResponse{}, ErrProfileUnavailable
	}

	savedRecord.VerificationStatus = s.verification.NormalizeProfile(savedRecord)
	s.recordAudit(ctx, model.AuditActionProfileUpdated, model.AuditEntityProfile, savedRecord.ID, map[string]any{
		"fields_updated":               updatedFields,
		"verification_status_before":   previousStatus,
		"verification_status_after":    savedRecord.VerificationStatus,
		"profile_completion_triggered": previousStatus != savedRecord.VerificationStatus,
	})
	if previousStatus != savedRecord.VerificationStatus {
		s.recordAudit(ctx, model.AuditActionVerificationStatusChanged, model.AuditEntityVerification, savedRecord.ID, map[string]any{
			"status_before": previousStatus,
			"status_after":  savedRecord.VerificationStatus,
			"reason":        "profile_update",
		})
	}

	return buildProfileResponse(user, savedRecord, s.permissions), nil
}

func buildProfileResponse(user model.AuthenticatedUser, record model.ProfileRecord, permissions PermissionHelper) model.CurrentUserProfileResponse {
	profile := model.UserProfile{
		ID:                 record.ID,
		Email:              user.Email,
		Phone:              user.Phone,
		FullName:           record.FullName,
		DateOfBirth:        record.DateOfBirth,
		ResidentialAddress: record.ResidentialAddress,
		Nationality:        record.Nationality,
		VerificationStatus: record.VerificationStatus,
		CreatedAt:          record.CreatedAt,
		UpdatedAt:          record.UpdatedAt,
	}

	return model.CurrentUserProfileResponse{
		Profile:     profile,
		Permissions: permissions.PermissionsForStatus(profile.VerificationStatus),
	}
}

func validateUpdateProfileInput(input model.UpdateProfileInput) (model.UpdateProfileInput, ValidationErrors) {
	var validationErrors ValidationErrors

	if input.FullName == nil && input.DateOfBirth == nil && input.ResidentialAddress == nil && input.Nationality == nil {
		validationErrors = append(validationErrors, ValidationError{
			Field:   "body",
			Message: "at least one updatable field must be provided",
		})
	}

	if input.FullName != nil {
		value := strings.TrimSpace(*input.FullName)
		if len(value) > 120 {
			validationErrors = append(validationErrors, ValidationError{
				Field:   "full_name",
				Message: "full_name must be 120 characters or fewer",
			})
		}
		input.FullName = &value
	}

	if input.DateOfBirth != nil {
		value := strings.TrimSpace(*input.DateOfBirth)
		if value != "" {
			dateOfBirth, err := time.Parse("2006-01-02", value)
			if err != nil {
				validationErrors = append(validationErrors, ValidationError{
					Field:   "date_of_birth",
					Message: "date_of_birth must use YYYY-MM-DD format",
				})
			} else if dateOfBirth.After(time.Now()) {
				validationErrors = append(validationErrors, ValidationError{
					Field:   "date_of_birth",
					Message: "date_of_birth cannot be in the future",
				})
			}
		}
		input.DateOfBirth = &value
	}

	if input.ResidentialAddress != nil {
		value := strings.TrimSpace(*input.ResidentialAddress)
		if len(value) > 240 {
			validationErrors = append(validationErrors, ValidationError{
				Field:   "residential_address",
				Message: "residential_address must be 240 characters or fewer",
			})
		}
		input.ResidentialAddress = &value
	}

	if input.Nationality != nil {
		value := strings.TrimSpace(*input.Nationality)
		if len(value) > 80 {
			validationErrors = append(validationErrors, ValidationError{
				Field:   "nationality",
				Message: "nationality must be 80 characters or fewer",
			})
		}
		input.Nationality = &value
	}

	return input, validationErrors
}

func mergeProfileRecord(existing model.ProfileRecord, input model.UpdateProfileInput) model.ProfileRecord {
	merged := existing

	if input.FullName != nil {
		merged.FullName = *input.FullName
	}

	if input.DateOfBirth != nil {
		merged.DateOfBirth = *input.DateOfBirth
	}

	if input.ResidentialAddress != nil {
		merged.ResidentialAddress = *input.ResidentialAddress
	}

	if input.Nationality != nil {
		merged.Nationality = *input.Nationality
	}

	return merged
}

func updatedProfileFields(input model.UpdateProfileInput) []string {
	fields := make([]string, 0, 4)
	if input.FullName != nil {
		fields = append(fields, "full_name")
	}
	if input.DateOfBirth != nil {
		fields = append(fields, "date_of_birth")
	}
	if input.ResidentialAddress != nil {
		fields = append(fields, "residential_address")
	}
	if input.Nationality != nil {
		fields = append(fields, "nationality")
	}

	return fields
}

func (s *DefaultProfileService) recordAudit(ctx context.Context, action model.AuditAction, entityType model.AuditEntityType, entityID string, metadata map[string]any) {
	if s.audit == nil {
		return
	}

	if err := s.audit.Record(ctx, model.AuditEvent{
		ActorUserID: entityID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Source:      model.AuditSourceAPI,
		Metadata:    metadata,
	}); err != nil {
		s.logger.Warn("failed to record profile audit event", slog.String("entity_id", entityID), slog.String("action", string(action)), slog.String("error", err.Error()))
	}
}

func ResolveVerificationStatus(current model.VerificationStatus, profile model.ProfileRecord) model.VerificationStatus {
	if !current.IsValid() {
		current = model.VerificationStatusBasic
	}

	switch current {
	case model.VerificationStatusVerified,
		model.VerificationStatusUnderReview,
		model.VerificationStatusRestricted:
		return current
	default:
		if hasCompletedProfileFields(profile) {
			return model.VerificationStatusProfileCompleted
		}

		return model.VerificationStatusBasic
	}
}

func hasCompletedProfileFields(profile model.ProfileRecord) bool {
	return strings.TrimSpace(profile.FullName) != "" &&
		strings.TrimSpace(profile.DateOfBirth) != "" &&
		strings.TrimSpace(profile.ResidentialAddress) != "" &&
		strings.TrimSpace(profile.Nationality) != ""
}
