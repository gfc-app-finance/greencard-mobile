package service

import (
	"context"
	"errors"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/provider"
)

type fakeIdentityProvider struct {
	verify func(ctx context.Context, request provider.IdentityVerificationRequest) (provider.IdentityVerificationResult, error)
}

func (f fakeIdentityProvider) VerifyIdentity(ctx context.Context, request provider.IdentityVerificationRequest) (provider.IdentityVerificationResult, error) {
	if f.verify != nil {
		return f.verify(ctx, request)
	}

	return provider.IdentityVerificationResult{}, nil
}

func TestSubmitIdentityVerificationApprovesAndUpdatesProfile(t *testing.T) {
	var savedProfile model.ProfileRecord
	service := NewIdentityVerificationService(
		nil,
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{
					ID:                 userID,
					FullName:           "Ada Lovelace",
					DateOfBirth:        "1990-01-01",
					ResidentialAddress: "1 Lagos Street",
					Nationality:        "Nigerian",
					VerificationStatus: model.VerificationStatusProfileCompleted,
				}, true, nil
			},
			upsert: func(ctx context.Context, profile model.ProfileRecord) (model.ProfileRecord, error) {
				savedProfile = profile
				return profile, nil
			},
		},
		NewPermissionHelper(),
		fakeVerificationResolver{},
		fakeIdentityProvider{
			verify: func(ctx context.Context, request provider.IdentityVerificationRequest) (provider.IdentityVerificationResult, error) {
				if request.IDNumber != "12345678901" {
					t.Fatalf("expected provider request to include raw id only in outbound call, got %#v", request)
				}
				return provider.IdentityVerificationResult{
					Provider:          provider.SmileIDProviderName,
					ProviderReference: "100000001",
					PartnerJobID:      request.JobID,
					Decision:          provider.IdentityDecisionApproved,
					ResultCode:        "1012",
					ResultText:        "ID Number Validated",
				}, nil
			},
		},
	)

	response, err := service.SubmitIdentityVerification(context.Background(), model.AuthenticatedUser{ID: "user-123", Email: "ada@example.com"}, model.SubmitIdentityVerificationInput{
		Country:  "ng",
		IDType:   "nin_v2",
		IDNumber: "12345678901",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if savedProfile.VerificationStatus != model.VerificationStatusVerified {
		t.Fatalf("expected verified profile status, got %#v", savedProfile)
	}
	if response.Verification.VerificationState != model.VerificationStatusVerified {
		t.Fatalf("expected verified response, got %#v", response)
	}
	if response.Verification.ProviderReference != "100000001" {
		t.Fatalf("expected provider reference in response, got %#v", response.Verification)
	}
}

func TestSubmitIdentityVerificationRejectsRestrictedProfile(t *testing.T) {
	service := NewIdentityVerificationService(
		nil,
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusRestricted}, true, nil
			},
		},
		NewPermissionHelper(),
		fakeVerificationResolver{},
		fakeIdentityProvider{},
	)

	_, err := service.SubmitIdentityVerification(context.Background(), model.AuthenticatedUser{ID: "user-123"}, model.SubmitIdentityVerificationInput{
		Country:  "NG",
		IDType:   "NIN_V2",
		IDNumber: "12345678901",
	})
	if !errors.Is(err, ErrIdentityVerificationDenied) {
		t.Fatalf("expected denied error, got %v", err)
	}
}

func TestSubmitIdentityVerificationMapsProviderUnavailable(t *testing.T) {
	service := NewIdentityVerificationService(
		nil,
		fakeProfileRepository{
			getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
				return model.ProfileRecord{ID: userID, VerificationStatus: model.VerificationStatusProfileCompleted}, true, nil
			},
		},
		NewPermissionHelper(),
		fakeVerificationResolver{},
		fakeIdentityProvider{
			verify: func(ctx context.Context, request provider.IdentityVerificationRequest) (provider.IdentityVerificationResult, error) {
				return provider.IdentityVerificationResult{}, provider.ErrProviderUnavailable
			},
		},
	)

	_, err := service.SubmitIdentityVerification(context.Background(), model.AuthenticatedUser{ID: "user-123"}, model.SubmitIdentityVerificationInput{
		Country:  "NG",
		IDType:   "NIN_V2",
		IDNumber: "12345678901",
	})
	if !errors.Is(err, ErrIdentityVerificationUnavailable) {
		t.Fatalf("expected unavailable error, got %v", err)
	}
}
