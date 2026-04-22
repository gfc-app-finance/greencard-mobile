package provider

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
)

func TestSmileIDSignatureRoundTrip(t *testing.T) {
	timestamp := "2026-04-21T12:00:00Z"
	partnerID := "partner-123"
	apiKey := "secret-key"

	signature := GenerateSmileIDSignature(timestamp, partnerID, apiKey)
	if signature == "" {
		t.Fatal("expected generated signature")
	}
	if !ConfirmSmileIDSignature(signature, timestamp, partnerID, apiKey) {
		t.Fatal("expected signature confirmation to pass")
	}
	if ConfirmSmileIDSignature(signature, timestamp, partnerID, "wrong-key") {
		t.Fatal("expected wrong key to fail signature confirmation")
	}
}

func TestSmileIDVerifyIdentityBuildsSignedRequestAndMapsApprovedResponse(t *testing.T) {
	var captured smileIDRequest
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/id_verification" {
			t.Fatalf("expected id verification path, got %q", r.URL.Path)
		}
		if err := json.NewDecoder(r.Body).Decode(&captured); err != nil {
			t.Fatalf("failed to decode request: %v", err)
		}

		_ = json.NewEncoder(w).Encode(smileIDResponse{
			Actions: map[string]string{
				"Verify_ID_Number":     "Verified",
				"Return_Personal_Info": "Returned",
			},
			PartnerParams: smileIDPartnerParams{
				JobID:   captured.PartnerParams.JobID,
				UserID:  captured.PartnerParams.UserID,
				JobType: smileIDJobType,
			},
			ResultCode: "1012",
			ResultText: "ID Number Validated",
			SmileJobID: "100000001",
			FullName:   "Ada Lovelace",
			DOB:        "1990-01-01",
		})
	}))
	defer server.Close()

	client, err := NewSmileIDClient(nil, config.SmileIDConfig{
		PartnerID:        "partner-123",
		APIKey:           "secret-key",
		BaseURL:          server.URL,
		SourceSDKVersion: "test-version",
		Timeout:          time.Second,
	})
	if err != nil {
		t.Fatalf("expected client, got %v", err)
	}
	client.now = func() time.Time {
		return time.Date(2026, time.April, 21, 12, 0, 0, 0, time.UTC)
	}

	result, err := client.VerifyIdentity(context.Background(), IdentityVerificationRequest{
		UserID:      "user-123",
		JobID:       "job-123",
		Country:     "ng",
		IDType:      "nin_v2",
		IDNumber:    "12345678901",
		FirstName:   "Ada",
		LastName:    "Lovelace",
		DateOfBirth: "1990-01-01",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if captured.PartnerID != "partner-123" || captured.SourceSDK != "rest_api" || captured.SourceSDKVersion != "test-version" {
		t.Fatalf("unexpected provider request metadata: %#v", captured)
	}
	if captured.Signature == "" || !ConfirmSmileIDSignature(captured.Signature, captured.Timestamp, "partner-123", "secret-key") {
		t.Fatalf("expected valid signature in provider request: %#v", captured)
	}
	if captured.Country != "NG" || captured.IDType != "NIN_V2" {
		t.Fatalf("expected normalized country/id type, got %#v", captured)
	}
	if result.Decision != IdentityDecisionApproved || result.ProviderReference != "100000001" {
		t.Fatalf("unexpected verification result: %#v", result)
	}
}

func TestSmileIDVerifyIdentityMapsUnauthorizedError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"ResultCode":"2405","ResultText":"Error - You are not authorized to do that"}`))
	}))
	defer server.Close()

	client, err := NewSmileIDClient(nil, config.SmileIDConfig{
		PartnerID: "partner-123",
		APIKey:    "secret-key",
		BaseURL:   server.URL,
		Timeout:   time.Second,
	})
	if err != nil {
		t.Fatalf("expected client, got %v", err)
	}

	_, err = client.VerifyIdentity(context.Background(), IdentityVerificationRequest{
		UserID:   "user-123",
		JobID:    "job-123",
		Country:  "NG",
		IDType:   "NIN_V2",
		IDNumber: "12345678901",
	})
	if !errors.Is(err, ErrProviderUnauthorized) {
		t.Fatalf("expected unauthorized provider error, got %v", err)
	}
}
