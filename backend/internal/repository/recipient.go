package repository

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const recipientSelectFields = "id,user_id,type,full_name,bank_name,account_number,iban,routing_number,sort_code,swift_code,country,currency,nickname,created_at,updated_at"

type RecipientRepository interface {
	Create(ctx context.Context, record model.RecipientRecord) (model.RecipientRecord, error)
	ListByUserID(ctx context.Context, userID string) ([]model.RecipientRecord, error)
	GetByIDForUser(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error)
}

type SupabaseRecipientRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseRecipientRepository(logger *slog.Logger, cfg config.SupabaseConfig) RecipientRepository {
	return &SupabaseRecipientRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseRecipientRepository) Create(ctx context.Context, record model.RecipientRecord) (model.RecipientRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.RecipientRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.RecipientTable,
		url.QueryEscape(recipientSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.RecipientRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.RecipientRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.RecipientRecord{}, restStatusError("supabase create recipient", response.StatusCode)
	}

	return decodeSingleRecord[model.RecipientRecord](response.Body)
}

func (r *SupabaseRecipientRepository) ListByUserID(ctx context.Context, userID string) ([]model.RecipientRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&select=%s&order=created_at.desc",
		r.config.RESTURL,
		r.config.RecipientTable,
		url.QueryEscape(userID),
		url.QueryEscape(recipientSelectFields),
	)

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
		return nil, restStatusError("supabase recipient list", response.StatusCode)
	}

	var records []model.RecipientRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseRecipientRepository) GetByIDForUser(ctx context.Context, userID, recipientID string) (model.RecipientRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&user_id=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.RecipientTable,
		url.QueryEscape(recipientID),
		url.QueryEscape(userID),
		url.QueryEscape(recipientSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return model.RecipientRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.RecipientRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.RecipientRecord{}, false, restStatusError("supabase recipient fetch", response.StatusCode)
	}

	var records []model.RecipientRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.RecipientRecord{}, false, err
	}

	if len(records) == 0 {
		return model.RecipientRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseRecipientRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
