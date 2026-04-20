package model

type AuthenticatedUser struct {
	ID          string `json:"id"`
	Email       string `json:"email,omitempty"`
	Phone       string `json:"phone,omitempty"`
	Role        string `json:"role"`
	SessionID   string `json:"session_id,omitempty"`
	AAL         string `json:"aal,omitempty"`
	IsAnonymous bool   `json:"is_anonymous"`
}
