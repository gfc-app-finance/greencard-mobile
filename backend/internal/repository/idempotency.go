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

const idempotencySelectFields = "id,user_id,operation,idempotency_key,request_hash,response_status,response_body,created_at,updated_at"

var ErrIdempotencyConflict = errors.New("idempotency conflict")

type IdempotencyRepository interface {
	Create(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error)
	GetByKey(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error)
	UpdateResponse(ctx context.Context, userID, operation, key string, statusCode int, responseBody json.RawMessage) (model.IdempotencyRecord, error)
	Delete(ctx context.Context, userID, operation, key string) error
}

type SupabaseIdempotencyRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseIdempotencyRepository(logger *slog.Logger, cfg config.SupabaseConfig) *SupabaseIdempotencyRepository {
	return &SupabaseIdempotencyRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseIdempotencyRepository) Create(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.IdempotencyRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.IdempotencyTable,
		url.QueryEscape(idempotencySelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.IdempotencyRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.IdempotencyRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusConflict {
		return model.IdempotencyRecord{}, ErrIdempotencyConflict
	}
	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.IdempotencyRecord{}, restStatusError("supabase create idempotency record", response.StatusCode)
	}

	return decodeSingleRecord[model.IdempotencyRecord](response.Body)
}

func (r *SupabaseIdempotencyRepository) GetByKey(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&operation=eq.%s&idempotency_key=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.IdempotencyTable,
		url.QueryEscape(userID),
		url.QueryEscape(operation),
		url.QueryEscape(key),
		url.QueryEscape(idempotencySelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return model.IdempotencyRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.IdempotencyRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.IdempotencyRecord{}, false, restStatusError("supabase get idempotency record", response.StatusCode)
	}

	var records []model.IdempotencyRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.IdempotencyRecord{}, false, err
	}
	if len(records) == 0 {
		return model.IdempotencyRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseIdempotencyRepository) UpdateResponse(ctx context.Context, userID, operation, key string, statusCode int, responseBody json.RawMessage) (model.IdempotencyRecord, error) {
	body, err := json.Marshal(map[string]any{
		"response_status": statusCode,
		"response_body":   responseBody,
	})
	if err != nil {
		return model.IdempotencyRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&operation=eq.%s&idempotency_key=eq.%s&select=%s",
		r.config.RESTURL,
		r.config.IdempotencyTable,
		url.QueryEscape(userID),
		url.QueryEscape(operation),
		url.QueryEscape(key),
		url.QueryEscape(idempotencySelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPatch, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.IdempotencyRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.IdempotencyRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.IdempotencyRecord{}, restStatusError("supabase update idempotency record", response.StatusCode)
	}

	return decodeSingleRecord[model.IdempotencyRecord](response.Body)
}

func (r *SupabaseIdempotencyRepository) Delete(ctx context.Context, userID, operation, key string) error {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&operation=eq.%s&idempotency_key=eq.%s",
		r.config.RESTURL,
		r.config.IdempotencyTable,
		url.QueryEscape(userID),
		url.QueryEscape(operation),
		url.QueryEscape(key),
	)

	request, err := r.newRequest(ctx, http.MethodDelete, requestURL, nil)
	if err != nil {
		return err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusNoContent {
		return restStatusError("supabase delete idempotency record", response.StatusCode)
	}

	return nil
}

func (r *SupabaseIdempotencyRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
