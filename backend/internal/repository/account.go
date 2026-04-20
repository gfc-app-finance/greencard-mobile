package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const accountSelectFields = "id,user_id,currency,account_type,display_name,balance,available_balance,masked_identifier,provider,status,created_at,updated_at"

type AccountRepository interface {
	ListByUserID(ctx context.Context, userID string) ([]model.AccountRecord, error)
	GetByIDForUser(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error)
}

type SupabaseAccountRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseAccountRepository(logger *slog.Logger, cfg config.SupabaseConfig) AccountRepository {
	return &SupabaseAccountRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseAccountRepository) ListByUserID(ctx context.Context, userID string) ([]model.AccountRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&select=%s&order=created_at.asc",
		r.config.RESTURL,
		r.config.AccountTable,
		url.QueryEscape(userID),
		url.QueryEscape(accountSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL)
	if err != nil {
		return nil, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, restStatusError("supabase account list", response.StatusCode)
	}

	var records []model.AccountRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseAccountRepository) GetByIDForUser(ctx context.Context, userID, accountID string) (model.AccountRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&user_id=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.AccountTable,
		url.QueryEscape(accountID),
		url.QueryEscape(userID),
		url.QueryEscape(accountSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL)
	if err != nil {
		return model.AccountRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.AccountRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.AccountRecord{}, false, restStatusError("supabase account fetch", response.StatusCode)
	}

	var records []model.AccountRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.AccountRecord{}, false, err
	}

	if len(records) == 0 {
		return model.AccountRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseAccountRepository) newRequest(ctx context.Context, method, requestURL string) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
