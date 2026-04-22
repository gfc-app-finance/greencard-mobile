package model

type SubmitIdentityVerificationInput struct {
	Country     string  `json:"country"`
	IDType      string  `json:"id_type"`
	IDNumber    string  `json:"id_number"`
	FirstName   *string `json:"first_name,omitempty"`
	MiddleName  *string `json:"middle_name,omitempty"`
	LastName    *string `json:"last_name,omitempty"`
	DateOfBirth *string `json:"date_of_birth,omitempty"`
	PhoneNumber *string `json:"phone_number,omitempty"`
}

type IdentityVerification struct {
	Provider          string             `json:"provider"`
	ProviderReference string             `json:"provider_reference,omitempty"`
	PartnerJobID      string             `json:"partner_job_id"`
	Decision          string             `json:"decision"`
	ResultCode        string             `json:"result_code,omitempty"`
	ResultText        string             `json:"result_text,omitempty"`
	VerificationState VerificationStatus `json:"verification_state"`
}

type IdentityVerificationResponse struct {
	Verification IdentityVerification `json:"verification"`
	Profile      UserProfile          `json:"profile"`
	Permissions  PermissionSet        `json:"permissions"`
}
