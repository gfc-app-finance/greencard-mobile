package model

import (
	"strings"
	"time"
)

type AsyncJobStatus string

const (
	AsyncJobStatusProcessing AsyncJobStatus = "processing"
	AsyncJobStatusSucceeded  AsyncJobStatus = "succeeded"
	AsyncJobStatusFailed     AsyncJobStatus = "failed"
	AsyncJobStatusAbandoned  AsyncJobStatus = "abandoned"
)

type AsyncJobRunRecord struct {
	ID              string         `json:"id"`
	JobKey          string         `json:"job_key"`
	JobType         string         `json:"job_type"`
	EntityType      string         `json:"entity_type"`
	EntityID        string         `json:"entity_id"`
	Status          AsyncJobStatus `json:"status"`
	AttemptCount    int            `json:"attempt_count"`
	MaxAttempts     int            `json:"max_attempts"`
	LastError       *string        `json:"last_error,omitempty"`
	LastProcessedAt *time.Time     `json:"last_processed_at,omitempty"`
	LockedUntil     *time.Time     `json:"locked_until,omitempty"`
	CreatedAt       *time.Time     `json:"created_at,omitempty"`
	UpdatedAt       *time.Time     `json:"updated_at,omitempty"`
}

type AsyncJobClaimRequest struct {
	JobKey      string
	JobType     string
	EntityType  string
	EntityID    string
	MaxAttempts int
	LockTTL     time.Duration
}

type AsyncJobClaimResult struct {
	Record  AsyncJobRunRecord `json:"record"`
	Claimed bool              `json:"claimed"`
}

func (status AsyncJobStatus) IsValid() bool {
	switch status {
	case AsyncJobStatusProcessing, AsyncJobStatusSucceeded, AsyncJobStatusFailed, AsyncJobStatusAbandoned:
		return true
	default:
		return false
	}
}

func (request AsyncJobClaimRequest) Normalize() AsyncJobClaimRequest {
	request.JobKey = strings.TrimSpace(request.JobKey)
	request.JobType = strings.TrimSpace(request.JobType)
	request.EntityType = strings.TrimSpace(request.EntityType)
	request.EntityID = strings.TrimSpace(request.EntityID)
	return request
}
