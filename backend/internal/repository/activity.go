package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const activitySelectFields = "id,user_id,type,title,subtitle,amount,currency,status,linked_entity_type,linked_entity_id,created_at,updated_at"

type ActivityRepository interface {
	Upsert(ctx context.Context, activity model.ActivityRecord) (model.ActivityRecord, error)
	ListByUserID(ctx context.Context, userID string) ([]model.ActivityRecord, error)
	ListRecentByUserID(ctx context.Context, userID string, limit int) ([]model.ActivityRecord, error)
}

type SupabaseActivityRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseActivityRepository(logger *slog.Logger, cfg config.SupabaseConfig) ActivityRepository {
	return &SupabaseActivityRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseActivityRepository) Upsert(ctx context.Context, activity model.ActivityRecord) (model.ActivityRecord, error) {
	body, err := json.Marshal(activity)
	if err != nil {
		return model.ActivityRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?on_conflict=user_id,linked_entity_type,linked_entity_id&select=%s",
		r.config.RESTURL,
		r.config.ActivityTable,
		url.QueryEscape(activitySelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.ActivityRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "resolution=merge-duplicates,return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.ActivityRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.ActivityRecord{}, restStatusError("supabase activity upsert", response.StatusCode)
	}

	return decodeSingleActivityRecord(response.Body)
}

func (r *SupabaseActivityRepository) ListByUserID(ctx context.Context, userID string) ([]model.ActivityRecord, error) {
	return r.listByUserIDWithLimit(ctx, userID, 0)
}

func (r *SupabaseActivityRepository) ListRecentByUserID(ctx context.Context, userID string, limit int) ([]model.ActivityRecord, error) {
	return r.listByUserIDWithLimit(ctx, userID, limit)
}

func (r *SupabaseActivityRepository) listByUserIDWithLimit(ctx context.Context, userID string, limit int) ([]model.ActivityRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&select=%s&order=updated_at.desc,created_at.desc",
		r.config.RESTURL,
		r.config.ActivityTable,
		url.QueryEscape(userID),
		url.QueryEscape(activitySelectFields),
	)

	if limit > 0 {
		requestURL = fmt.Sprintf("%s&limit=%d", requestURL, limit)
	}

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, restStatusError("supabase activity list", response.StatusCode)
	}

	var records []model.ActivityRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseActivityRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}

func decodeSingleActivityRecord(reader io.Reader) (model.ActivityRecord, error) {
	rawBody, err := io.ReadAll(reader)
	if err != nil {
		return model.ActivityRecord{}, err
	}

	rawBody = bytes.TrimSpace(rawBody)
	if len(rawBody) == 0 {
		return model.ActivityRecord{}, errors.New("empty activity response body")
	}

	if rawBody[0] == '[' {
		var records []model.ActivityRecord
		if err := json.Unmarshal(rawBody, &records); err != nil {
			return model.ActivityRecord{}, err
		}

		if len(records) == 0 {
			return model.ActivityRecord{}, errors.New("activity response did not include a record")
		}

		return records[0], nil
	}

	var record model.ActivityRecord
	if err := json.Unmarshal(rawBody, &record); err != nil {
		return model.ActivityRecord{}, err
	}

	return record, nil
}
