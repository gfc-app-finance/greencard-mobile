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

const auditLogSelectFields = "id,actor_user_id,action,entity_type,entity_id,source,metadata_summary,request_id,ip_summary,provider,correlation_id,created_at"

type AuditLogRepository interface {
	Create(ctx context.Context, record model.AuditLogRecord) (model.AuditLogRecord, error)
	ListByActor(ctx context.Context, actorUserID string, limit int) ([]model.AuditLogRecord, error)
	ListByEntity(ctx context.Context, entityType model.AuditEntityType, entityID string, limit int) ([]model.AuditLogRecord, error)
}

type SupabaseAuditLogRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseAuditLogRepository(logger *slog.Logger, cfg config.SupabaseConfig) AuditLogRepository {
	return &SupabaseAuditLogRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseAuditLogRepository) Create(ctx context.Context, record model.AuditLogRecord) (model.AuditLogRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.AuditLogRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.AuditLogTable,
		url.QueryEscape(auditLogSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.AuditLogRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.AuditLogRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.AuditLogRecord{}, restStatusError("supabase create audit log", response.StatusCode)
	}

	return decodeSingleAuditLogRecord(response.Body)
}

func (r *SupabaseAuditLogRepository) ListByActor(ctx context.Context, actorUserID string, limit int) ([]model.AuditLogRecord, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	requestURL := fmt.Sprintf(
		"%s/%s?actor_user_id=eq.%s&select=%s&order=created_at.desc&limit=%d",
		r.config.RESTURL,
		r.config.AuditLogTable,
		url.QueryEscape(actorUserID),
		url.QueryEscape(auditLogSelectFields),
		limit,
	)

	return r.list(ctx, requestURL)
}

func (r *SupabaseAuditLogRepository) ListByEntity(ctx context.Context, entityType model.AuditEntityType, entityID string, limit int) ([]model.AuditLogRecord, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	requestURL := fmt.Sprintf(
		"%s/%s?entity_type=eq.%s&entity_id=eq.%s&select=%s&order=created_at.desc&limit=%d",
		r.config.RESTURL,
		r.config.AuditLogTable,
		url.QueryEscape(string(entityType)),
		url.QueryEscape(entityID),
		url.QueryEscape(auditLogSelectFields),
		limit,
	)

	return r.list(ctx, requestURL)
}

func (r *SupabaseAuditLogRepository) list(ctx context.Context, requestURL string) ([]model.AuditLogRecord, error) {
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
		return nil, restStatusError("supabase list audit logs", response.StatusCode)
	}

	var records []model.AuditLogRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseAuditLogRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}

func decodeSingleAuditLogRecord(reader io.Reader) (model.AuditLogRecord, error) {
	rawBody, err := io.ReadAll(reader)
	if err != nil {
		return model.AuditLogRecord{}, err
	}

	rawBody = bytes.TrimSpace(rawBody)
	if len(rawBody) == 0 {
		return model.AuditLogRecord{}, fmt.Errorf("empty audit log response body")
	}

	if rawBody[0] == '[' {
		var records []model.AuditLogRecord
		if err := json.Unmarshal(rawBody, &records); err != nil {
			return model.AuditLogRecord{}, err
		}

		if len(records) == 0 {
			return model.AuditLogRecord{}, fmt.Errorf("audit log response did not include a record")
		}

		return records[0], nil
	}

	var record model.AuditLogRecord
	if err := json.Unmarshal(rawBody, &record); err != nil {
		return model.AuditLogRecord{}, err
	}

	return record, nil
}
