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
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const webhookEventSelectFields = "id,provider,event_id,event_type,linked_entity_type,linked_entity_id,linked_reference,processing_status,status_message,received_at,processed_at,updated_at"

type WebhookEventRepository interface {
	Create(ctx context.Context, record model.WebhookEventRecord) (model.WebhookEventRecord, error)
	GetByProviderEventID(ctx context.Context, provider model.WebhookProvider, eventID string) (model.WebhookEventRecord, bool, error)
	ListByProcessingStatusesBefore(ctx context.Context, statuses []model.WebhookProcessingStatus, before time.Time, limit int) ([]model.WebhookEventRecord, error)
	UpdateProcessing(ctx context.Context, recordID string, payload map[string]any) (model.WebhookEventRecord, error)
}

type SupabaseWebhookEventRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseWebhookEventRepository(logger *slog.Logger, cfg config.SupabaseConfig) *SupabaseWebhookEventRepository {
	return &SupabaseWebhookEventRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseWebhookEventRepository) Create(ctx context.Context, record model.WebhookEventRecord) (model.WebhookEventRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.WebhookEventRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.WebhookEventTable,
		url.QueryEscape(webhookEventSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.WebhookEventRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.WebhookEventRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode == http.StatusConflict {
		return model.WebhookEventRecord{}, ErrWebhookEventConflict
	}
	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.WebhookEventRecord{}, restStatusError("supabase create webhook event", response.StatusCode)
	}

	return decodeSingleRecord[model.WebhookEventRecord](response.Body)
}

func (r *SupabaseWebhookEventRepository) GetByProviderEventID(ctx context.Context, provider model.WebhookProvider, eventID string) (model.WebhookEventRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?provider=eq.%s&event_id=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.WebhookEventTable,
		url.QueryEscape(string(provider)),
		url.QueryEscape(eventID),
		url.QueryEscape(webhookEventSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return model.WebhookEventRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.WebhookEventRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.WebhookEventRecord{}, false, restStatusError("supabase get webhook event", response.StatusCode)
	}

	var records []model.WebhookEventRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.WebhookEventRecord{}, false, err
	}
	if len(records) == 0 {
		return model.WebhookEventRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseWebhookEventRepository) ListByProcessingStatusesBefore(ctx context.Context, statuses []model.WebhookProcessingStatus, before time.Time, limit int) ([]model.WebhookEventRecord, error) {
	if limit <= 0 {
		limit = 100
	}

	requestURL := fmt.Sprintf(
		"%s/%s?processing_status=in.(%s)&received_at=lte.%s&select=%s&order=received_at.asc&limit=%d",
		r.config.RESTURL,
		r.config.WebhookEventTable,
		url.QueryEscape(strings.Join(statusStrings(statuses), ",")),
		url.QueryEscape(before.UTC().Format(time.RFC3339)),
		url.QueryEscape(webhookEventSelectFields),
		limit,
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
		return nil, restStatusError("supabase list webhook events", response.StatusCode)
	}

	var records []model.WebhookEventRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseWebhookEventRepository) UpdateProcessing(ctx context.Context, recordID string, payload map[string]any) (model.WebhookEventRecord, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return model.WebhookEventRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&select=%s",
		r.config.RESTURL,
		r.config.WebhookEventTable,
		url.QueryEscape(recordID),
		url.QueryEscape(webhookEventSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPatch, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.WebhookEventRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.WebhookEventRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.WebhookEventRecord{}, restStatusError("supabase update webhook event", response.StatusCode)
	}

	return decodeSingleRecord[model.WebhookEventRecord](response.Body)
}

func (r *SupabaseWebhookEventRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
