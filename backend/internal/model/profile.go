package model

import "time"

type VerificationStatus string

const (
	VerificationStatusBasic            VerificationStatus = "basic"
	VerificationStatusProfileCompleted VerificationStatus = "profile_completed"
	VerificationStatusVerified         VerificationStatus = "verified"
	VerificationStatusUnderReview      VerificationStatus = "under_review"
	VerificationStatusRestricted       VerificationStatus = "restricted"
)

type ProfileRecord struct {
	ID                 string             `json:"id"`
	FullName           string             `json:"full_name,omitempty"`
	DateOfBirth        string             `json:"date_of_birth,omitempty"`
	ResidentialAddress string             `json:"residential_address,omitempty"`
	Nationality        string             `json:"nationality,omitempty"`
	VerificationStatus VerificationStatus `json:"verification_status"`
	CreatedAt          *time.Time         `json:"created_at,omitempty"`
	UpdatedAt          *time.Time         `json:"updated_at,omitempty"`
}

type UserProfile struct {
	ID                 string             `json:"id"`
	Email              string             `json:"email,omitempty"`
	Phone              string             `json:"phone,omitempty"`
	FullName           string             `json:"full_name,omitempty"`
	DateOfBirth        string             `json:"date_of_birth,omitempty"`
	ResidentialAddress string             `json:"residential_address,omitempty"`
	Nationality        string             `json:"nationality,omitempty"`
	VerificationStatus VerificationStatus `json:"verification_status"`
	CreatedAt          *time.Time         `json:"created_at,omitempty"`
	UpdatedAt          *time.Time         `json:"updated_at,omitempty"`
}

type UpdateProfileInput struct {
	FullName           *string `json:"full_name"`
	DateOfBirth        *string `json:"date_of_birth"`
	ResidentialAddress *string `json:"residential_address"`
	Nationality        *string `json:"nationality"`
}

type CurrentUserProfileResponse struct {
	Profile     UserProfile   `json:"profile"`
	Permissions PermissionSet `json:"permissions"`
}

func (status VerificationStatus) IsValid() bool {
	switch status {
	case VerificationStatusBasic,
		VerificationStatusProfileCompleted,
		VerificationStatusVerified,
		VerificationStatusUnderReview,
		VerificationStatusRestricted:
		return true
	default:
		return false
	}
}
