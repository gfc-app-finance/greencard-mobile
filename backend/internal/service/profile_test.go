package service

import (
	"context"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestResolveVerificationStatus(t *testing.T) {
	profileComplete := model.ProfileRecord{
		FullName:           "Sodiq Ojodu",
		DateOfBirth:        "2002-01-01",
		ResidentialAddress: "14 Broad Street, Lagos",
		Nationality:        "Nigerian",
	}

	if got := ResolveVerificationStatus(model.VerificationStatusBasic, profileComplete); got != model.VerificationStatusProfileCompleted {
		t.Fatalf("expected profile_completed, got %q", got)
	}

	if got := ResolveVerificationStatus(model.VerificationStatusVerified, model.ProfileRecord{}); got != model.VerificationStatusVerified {
		t.Fatalf("expected verified status to be preserved, got %q", got)
	}

	if got := ResolveVerificationStatus(model.VerificationStatusUnderReview, model.ProfileRecord{}); got != model.VerificationStatusUnderReview {
		t.Fatalf("expected under_review status to be preserved, got %q", got)
	}

	if got := ResolveVerificationStatus(model.VerificationStatusBasic, model.ProfileRecord{FullName: "Only name"}); got != model.VerificationStatusBasic {
		t.Fatalf("expected incomplete profile to remain basic, got %q", got)
	}
}

func TestValidateUpdateProfileInputRejectsFutureDate(t *testing.T) {
	dateOfBirth := "2999-01-01"
	input := model.UpdateProfileInput{DateOfBirth: &dateOfBirth}

	_, validationErrors := validateUpdateProfileInput(input)
	if len(validationErrors) == 0 {
		t.Fatal("expected future date_of_birth to be rejected")
	}
}

func TestVerificationResolverDefaultsMissingProfileToBasic(t *testing.T) {
	resolver := NewVerificationResolver(nil, fakeProfileRepository{
		getByUserID: func(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
			return model.ProfileRecord{}, false, nil
		},
	})

	status, err := resolver.ResolveForUser(context.Background(), "user_123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if status != model.VerificationStatusBasic {
		t.Fatalf("expected basic verification status, got %q", status)
	}
}
