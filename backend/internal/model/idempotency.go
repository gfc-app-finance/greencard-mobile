package model

import (
	"encoding/json"
	"time"
)

type IdempotencyRecord struct {
	ID             string          `json:"id,omitempty"`
	UserID         string          `json:"user_id"`
	Operation      string          `json:"operation"`
	IdempotencyKey string          `json:"idempotency_key"`
	RequestHash    string          `json:"request_hash"`
	ResponseStatus *int            `json:"response_status,omitempty"`
	ResponseBody   json.RawMessage `json:"response_body,omitempty"`
	CreatedAt      *time.Time      `json:"created_at,omitempty"`
	UpdatedAt      *time.Time      `json:"updated_at,omitempty"`
}
