package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/provider"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrIdentityVerificationProviderNotConfigured = errors.New("identity verification provider not configured")
	ErrIdentityVerificationUnavailable           = errors.New("identity verification unavailable")
	ErrIdentityVerificationDenied                = errors.New("identity verification denied")
)

type IdentityVerificationService interface {
	SubmitIdentityVerification(ctx context.Context, user model.AuthenticatedUser, input model.SubmitIdentityVerificationInput) (model.IdentityVerificationResponse, error)
}

type DefaultIdentityVerificationService struct {
	logger       *slog.Logger
	profiles     repository.ProfileRepository
	permissions  PermissionHelper
	verification VerificationResolver
	provider     provider.IdentityVerifier
	audit        AuditRecorder
}

func NewIdentityVerificationService(
	logger *slog.Logger,
	profiles repository.ProfileRepository,
	permissions PermissionHelper,
	verification VerificationResolver,
	identityProvider provider.IdentityVerifier,
	auditors ...AuditRecorder,
) IdentityVerificationService {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}
	var audit AuditRecorder
	if len(auditors) > 0 {
		audit = auditors[0]
	}

	return &DefaultIdentityVerificationService{
		logger:       logger,
		profiles:     profiles,
		permissions:  permissions,
		verification: verification,
		provider:     identityProvider,
		audit:        audit,
	}
}

func (s *DefaultIdentityVerificationService) SubmitIdentityVerification(ctx context.Context, user model.AuthenticatedUser, input model.SubmitIdentityVerificationInput) (model.IdentityVerificationResponse, error) {
	if s.provider == nil {
		return model.IdentityVerificationResponse{}, ErrIdentityVerificationProviderNotConfigured
	}

	input, validationErrors := validateSubmitIdentityVerificationInput(input)
	if len(validationErrors) > 0 {
		return model.IdentityVerificationResponse{}, validationErrors
	}

	profile, found, err := s.profiles.GetByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to fetch profile before identity verification", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.IdentityVerificationResponse{}, ErrIdentityVerificationUnavailable
	}
	if !found {
		profile = model.ProfileRecord{
			ID:                 user.ID,
			VerificationStatus: model.VerificationStatusBasic,
		}
	}
	profile.VerificationStatus = s.verification.NormalizeProfile(profile)
	previousStatus := profile.VerificationStatus
	if profile.VerificationStatus == model.VerificationStatusRestricted {
		s.recordAudit(ctx, user.ID, model.AuditActionPermissionDenied, model.AuditEntityVerification, user.ID, model.AuditSourceAPI, map[string]any{
			"permission":          "identity_verification.submit",
			"verification_status": profile.VerificationStatus,
		}, "")
		return model.IdentityVerificationResponse{}, ErrIdentityVerificationDenied
	}

	jobID := newIdentityVerificationJobID(user.ID)
	result, err := s.provider.VerifyIdentity(ctx, provider.IdentityVerificationRequest{
		UserID:      user.ID,
		JobID:       jobID,
		Country:     input.Country,
		IDType:      input.IDType,
		IDNumber:    input.IDNumber,
		FirstName:   valueOrEmpty(input.FirstName),
		MiddleName:  valueOrEmpty(input.MiddleName),
		LastName:    valueOrEmpty(input.LastName),
		DateOfBirth: valueOrEmpty(input.DateOfBirth),
		PhoneNumber: valueOrEmpty(input.PhoneNumber),
	})
	if err != nil {
		s.logger.Warn("identity provider verification failed", slog.String("user_id", user.ID), slog.String("provider", "identity"), slog.String("error", err.Error()))
		s.recordAudit(ctx, user.ID, model.AuditActionVerificationProviderFailed, model.AuditEntityVerification, user.ID, model.AuditSourceProvider, map[string]any{
			"provider": "identity",
			"outcome":  "provider_error",
			"error":    mapIdentityProviderError(err).Error(),
		}, "identity")
		return model.IdentityVerificationResponse{}, mapIdentityProviderError(err)
	}

	nextStatus, err := mapIdentityDecisionToVerificationStatus(result.Decision)
	if err != nil {
		s.logger.Warn("identity provider returned unmapped decision", slog.String("user_id", user.ID), slog.String("decision", string(result.Decision)), slog.String("result_code", result.ResultCode))
		return model.IdentityVerificationResponse{}, ErrIdentityVerificationUnavailable
	}

	profile.ID = user.ID
	profile.VerificationStatus = nextStatus
	updatedProfile, err := s.profiles.Upsert(ctx, profile)
	if err != nil {
		s.logger.Error("failed to persist profile identity verification state", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.IdentityVerificationResponse{}, ErrIdentityVerificationUnavailable
	}
	updatedProfile.VerificationStatus = s.verification.NormalizeProfile(updatedProfile)
	if previousStatus != updatedProfile.VerificationStatus {
		s.recordAudit(ctx, user.ID, model.AuditActionVerificationStatusChanged, model.AuditEntityVerification, user.ID, model.AuditSourceProvider, map[string]any{
			"status_before":      previousStatus,
			"status_after":       updatedProfile.VerificationStatus,
			"provider":           result.Provider,
			"provider_reference": result.ProviderReference,
			"partner_job_id":     result.PartnerJobID,
			"decision":           string(result.Decision),
			"result_code":        result.ResultCode,
		}, result.Provider)
	}

	profileResponse := buildProfileResponse(user, updatedProfile, s.permissions)

	return model.IdentityVerificationResponse{
		Verification: model.IdentityVerification{
			Provider:          result.Provider,
			ProviderReference: result.ProviderReference,
			PartnerJobID:      result.PartnerJobID,
			Decision:          string(result.Decision),
			ResultCode:        result.ResultCode,
			ResultText:        result.ResultText,
			VerificationState: updatedProfile.VerificationStatus,
		},
		Profile:     profileResponse.Profile,
		Permissions: profileResponse.Permissions,
	}, nil
}

func (s *DefaultIdentityVerificationService) recordAudit(ctx context.Context, actorUserID string, action model.AuditAction, entityType model.AuditEntityType, entityID string, source model.AuditSource, metadata map[string]any, providerName string) {
	if s.audit == nil {
		return
	}

	if err := s.audit.Record(ctx, model.AuditEvent{
		ActorUserID: actorUserID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Source:      source,
		Metadata:    metadata,
		Provider:    providerName,
	}); err != nil {
		s.logger.Warn("failed to record identity verification audit event", slog.String("user_id", actorUserID), slog.String("action", string(action)), slog.String("error", err.Error()))
	}
}

func validateSubmitIdentityVerificationInput(input model.SubmitIdentityVerificationInput) (model.SubmitIdentityVerificationInput, ValidationErrors) {
	var validationErrors ValidationErrors

	input.Country = strings.ToUpper(strings.TrimSpace(input.Country))
	input.IDType = strings.ToUpper(strings.TrimSpace(input.IDType))
	input.IDNumber = strings.TrimSpace(input.IDNumber)
	input.FirstName = normalizeOptionalString(input.FirstName)
	input.MiddleName = normalizeOptionalString(input.MiddleName)
	input.LastName = normalizeOptionalString(input.LastName)
	input.DateOfBirth = normalizeOptionalString(input.DateOfBirth)
	input.PhoneNumber = normalizeOptionalString(input.PhoneNumber)

	if len(input.Country) != 2 {
		validationErrors = append(validationErrors, ValidationError{Field: "country", Message: "country must be a 2-letter ISO country code"})
	}
	if input.IDType == "" || len(input.IDType) > 40 {
		validationErrors = append(validationErrors, ValidationError{Field: "id_type", Message: "id_type is required and must be 40 characters or fewer"})
	}
	if input.IDNumber == "" || len(input.IDNumber) > 64 {
		validationErrors = append(validationErrors, ValidationError{Field: "id_number", Message: "id_number is required and must be 64 characters or fewer"})
	}
	if input.FirstName != nil && len(*input.FirstName) > 80 {
		validationErrors = append(validationErrors, ValidationError{Field: "first_name", Message: "first_name must be 80 characters or fewer"})
	}
	if input.MiddleName != nil && len(*input.MiddleName) > 80 {
		validationErrors = append(validationErrors, ValidationError{Field: "middle_name", Message: "middle_name must be 80 characters or fewer"})
	}
	if input.LastName != nil && len(*input.LastName) > 80 {
		validationErrors = append(validationErrors, ValidationError{Field: "last_name", Message: "last_name must be 80 characters or fewer"})
	}
	if input.PhoneNumber != nil && len(*input.PhoneNumber) > 32 {
		validationErrors = append(validationErrors, ValidationError{Field: "phone_number", Message: "phone_number must be 32 characters or fewer"})
	}
	if input.DateOfBirth != nil && *input.DateOfBirth != "" {
		if len(*input.DateOfBirth) > 10 {
			validationErrors = append(validationErrors, ValidationError{Field: "date_of_birth", Message: "date_of_birth must use YYYY-MM-DD format"})
		}
		if _, err := time.Parse("2006-01-02", *input.DateOfBirth); err != nil {
			validationErrors = append(validationErrors, ValidationError{Field: "date_of_birth", Message: "date_of_birth must use YYYY-MM-DD format"})
		}
	}

	return input, validationErrors
}

func normalizeOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	normalized := strings.TrimSpace(*value)

	return &normalized
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}

	return strings.TrimSpace(*value)
}

func mapIdentityDecisionToVerificationStatus(decision provider.IdentityDecision) (model.VerificationStatus, error) {
	switch decision {
	case provider.IdentityDecisionApproved:
		return model.VerificationStatusVerified, nil
	case provider.IdentityDecisionPending:
		return model.VerificationStatusUnderReview, nil
	case provider.IdentityDecisionRejected:
		return model.VerificationStatusRestricted, nil
	default:
		return "", ErrIdentityVerificationUnavailable
	}
}

func mapIdentityProviderError(err error) error {
	switch {
	case errors.Is(err, provider.ErrProviderMisconfigured):
		return ErrIdentityVerificationProviderNotConfigured
	case errors.Is(err, provider.ErrProviderInvalidInput):
		return ValidationErrors{{Field: "identity", Message: "identity verification request was rejected by the provider"}}
	default:
		return ErrIdentityVerificationUnavailable
	}
}

func newIdentityVerificationJobID(userID string) string {
	var randomBytes [8]byte
	if _, err := rand.Read(randomBytes[:]); err != nil {
		return fmt.Sprintf("kyc-%s-%d", safeJobUserID(userID), time.Now().UTC().UnixNano())
	}

	return fmt.Sprintf("kyc-%s-%s", safeJobUserID(userID), hex.EncodeToString(randomBytes[:]))
}

func safeJobUserID(userID string) string {
	userID = strings.TrimSpace(userID)
	if len(userID) <= 8 {
		return userID
	}

	return userID[:8]
}
