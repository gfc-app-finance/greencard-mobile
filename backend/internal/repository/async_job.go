package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

var ErrAsyncJobInvalid = errors.New("invalid async job request")

type AsyncJobRepository interface {
	Claim(ctx context.Context, request model.AsyncJobClaimRequest) (model.AsyncJobRunRecord, bool, error)
	Complete(ctx context.Context, jobKey string, status model.AsyncJobStatus, message *string) (model.AsyncJobRunRecord, error)
}

type SupabaseAsyncJobRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

type asyncJobClaimRPCResult struct {
	model.AsyncJobRunRecord
	Claimed bool `json:"claimed"`
}

func NewSupabaseAsyncJobRepository(logger *slog.Logger, cfg config.SupabaseConfig) AsyncJobRepository {
	return &SupabaseAsyncJobRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseAsyncJobRepository) Claim(ctx context.Context, request model.AsyncJobClaimRequest) (model.AsyncJobRunRecord, bool, error) {
	request = request.Normalize()
	if request.JobKey == "" || request.JobType == "" || request.EntityType == "" || request.EntityID == "" || request.MaxAttempts <= 0 || request.LockTTL <= 0 {
		return model.AsyncJobRunRecord{}, false, ErrAsyncJobInvalid
	}

	result, err := callAsyncJobRPC[asyncJobClaimRPCResult](ctx, r, "claim_async_job", map[string]any{
		"p_job_key":          request.JobKey,
		"p_job_type":         request.JobType,
		"p_entity_type":      request.EntityType,
		"p_entity_id":        request.EntityID,
		"p_max_attempts":     request.MaxAttempts,
		"p_lock_ttl_seconds": int(request.LockTTL.Round(time.Second).Seconds()),
	})
	if err != nil {
		return model.AsyncJobRunRecord{}, false, err
	}

	return result.AsyncJobRunRecord, result.Claimed, nil
}

func (r *SupabaseAsyncJobRepository) Complete(ctx context.Context, jobKey string, status model.AsyncJobStatus, message *string) (model.AsyncJobRunRecord, error) {
	jobKey = model.AsyncJobClaimRequest{JobKey: jobKey}.Normalize().JobKey
	if jobKey == "" || !status.IsValid() {
		return model.AsyncJobRunRecord{}, ErrAsyncJobInvalid
	}

	return callAsyncJobRPC[model.AsyncJobRunRecord](ctx, r, "complete_async_job", map[string]any{
		"p_job_key": jobKey,
		"p_status":  status,
		"p_message": normalizeRPCString(message),
	})
}

func callAsyncJobRPC[T any](ctx context.Context, repository *SupabaseAsyncJobRepository, functionName string, payload map[string]any) (T, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		var zero T
		return zero, err
	}

	requestURL := fmt.Sprintf("%s/rpc/%s", repository.config.RESTURL, functionName)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		var zero T
		return zero, err
	}

	request.Header.Set("apikey", repository.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+repository.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := repository.client.Do(request)
	if err != nil {
		var zero T
		return zero, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		var zero T
		return zero, rpcStatusError("supabase async job", response)
	}

	return decodeSingleRecord[T](response.Body)
}
