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

const balanceMovementSelectFields = "id,user_id,account_id,linked_entity_type,linked_entity_id,movement_type,direction,amount,currency,created_at"

type BalanceMovementRepository interface {
	ListByLinkedEntity(ctx context.Context, userID string, entityType model.LinkedEntityType, entityID string) ([]model.BalanceMovementRecord, error)
	ListByAccountID(ctx context.Context, userID, accountID string) ([]model.BalanceMovementRecord, error)
}

type SupabaseBalanceMovementRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseBalanceMovementRepository(logger *slog.Logger, cfg config.SupabaseConfig) BalanceMovementRepository {
	return &SupabaseBalanceMovementRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseBalanceMovementRepository) ListByLinkedEntity(ctx context.Context, userID string, entityType model.LinkedEntityType, entityID string) ([]model.BalanceMovementRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&linked_entity_type=eq.%s&linked_entity_id=eq.%s&select=%s&order=created_at.desc",
		r.config.RESTURL,
		r.config.BalanceMovementTable,
		url.QueryEscape(userID),
		url.QueryEscape(string(entityType)),
		url.QueryEscape(entityID),
		url.QueryEscape(balanceMovementSelectFields),
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
		return nil, restStatusError("supabase list balance movements by entity", response.StatusCode)
	}

	var records []model.BalanceMovementRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseBalanceMovementRepository) ListByAccountID(ctx context.Context, userID, accountID string) ([]model.BalanceMovementRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&account_id=eq.%s&select=%s&order=created_at.desc",
		r.config.RESTURL,
		r.config.BalanceMovementTable,
		url.QueryEscape(userID),
		url.QueryEscape(accountID),
		url.QueryEscape(balanceMovementSelectFields),
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
		return nil, restStatusError("supabase list balance movements by account", response.StatusCode)
	}

	var records []model.BalanceMovementRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseBalanceMovementRepository) newRequest(ctx context.Context, method, requestURL string) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
