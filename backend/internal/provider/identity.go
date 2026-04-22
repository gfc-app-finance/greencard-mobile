package provider

import (
	"context"
	"errors"
)

var (
	ErrProviderMisconfigured = errors.New("provider misconfigured")
	ErrProviderInvalidInput  = errors.New("provider invalid input")
	ErrProviderUnauthorized  = errors.New("provider unauthorized")
	ErrProviderUnavailable   = errors.New("provider unavailable")
)

type IdentityDecision string

const (
	IdentityDecisionApproved IdentityDecision = "approved"
	IdentityDecisionPending  IdentityDecision = "pending"
	IdentityDecisionRejected IdentityDecision = "rejected"
	IdentityDecisionError    IdentityDecision = "error"
)

type IdentityVerificationRequest struct {
	UserID      string
	JobID       string
	Country     string
	IDType      string
	IDNumber    string
	FirstName   string
	MiddleName  string
	LastName    string
	DateOfBirth string
	PhoneNumber string
}

type IdentityVerificationResult struct {
	Provider          string
	ProviderReference string
	PartnerJobID      string
	Decision          IdentityDecision
	ResultCode        string
	ResultText        string
	FullName          string
	DateOfBirth       string
}

type IdentityVerifier interface {
	VerifyIdentity(ctx context.Context, request IdentityVerificationRequest) (IdentityVerificationResult, error)
}

type ProviderError struct {
	Provider  string
	Code      string
	Message   string
	Temporary bool
	Cause     error
}

func (err ProviderError) Error() string {
	if err.Code != "" {
		return err.Provider + " provider error: " + err.Code
	}

	return err.Provider + " provider error"
}

func (err ProviderError) Unwrap() error {
	return err.Cause
}
