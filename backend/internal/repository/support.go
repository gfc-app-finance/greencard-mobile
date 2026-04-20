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

const (
	supportTicketSelectFields        = "id,user_id,title,issue_type,description,status,linked_entity_type,linked_entity_id,priority,created_at,updated_at"
	supportTicketMessageSelectFields = "id,ticket_id,sender_type,message,created_at"
)

type SupportTicketRepository interface {
	CreateTicket(ctx context.Context, record model.SupportTicketRecord) (model.SupportTicketRecord, error)
	ListTicketsByUserID(ctx context.Context, userID string) ([]model.SupportTicketRecord, error)
	GetTicketByIDForUser(ctx context.Context, userID, ticketID string) (model.SupportTicketRecord, bool, error)
}

type SupportTicketMessageRepository interface {
	CreateTicketMessage(ctx context.Context, record model.SupportTicketMessageRecord) (model.SupportTicketMessageRecord, error)
	ListMessagesByTicketID(ctx context.Context, ticketID string) ([]model.SupportTicketMessageRecord, error)
}

type SupabaseSupportRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseSupportRepository(logger *slog.Logger, cfg config.SupabaseConfig) *SupabaseSupportRepository {
	return &SupabaseSupportRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseSupportRepository) CreateTicket(ctx context.Context, record model.SupportTicketRecord) (model.SupportTicketRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.SupportTicketRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.SupportTicketTable,
		url.QueryEscape(supportTicketSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.SupportTicketRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.SupportTicketRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.SupportTicketRecord{}, restStatusError("supabase create support ticket", response.StatusCode)
	}

	return decodeSingleRecord[model.SupportTicketRecord](response.Body)
}

func (r *SupabaseSupportRepository) ListTicketsByUserID(ctx context.Context, userID string) ([]model.SupportTicketRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&select=%s&order=created_at.desc",
		r.config.RESTURL,
		r.config.SupportTicketTable,
		url.QueryEscape(userID),
		url.QueryEscape(supportTicketSelectFields),
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
		return nil, restStatusError("supabase support ticket list", response.StatusCode)
	}

	var records []model.SupportTicketRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseSupportRepository) GetTicketByIDForUser(ctx context.Context, userID, ticketID string) (model.SupportTicketRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&user_id=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.SupportTicketTable,
		url.QueryEscape(ticketID),
		url.QueryEscape(userID),
		url.QueryEscape(supportTicketSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return model.SupportTicketRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.SupportTicketRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return model.SupportTicketRecord{}, false, restStatusError("supabase support ticket fetch", response.StatusCode)
	}

	var records []model.SupportTicketRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.SupportTicketRecord{}, false, err
	}

	if len(records) == 0 {
		return model.SupportTicketRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseSupportRepository) CreateTicketMessage(ctx context.Context, record model.SupportTicketMessageRecord) (model.SupportTicketMessageRecord, error) {
	body, err := json.Marshal(record)
	if err != nil {
		return model.SupportTicketMessageRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		r.config.RESTURL,
		r.config.SupportMessageTable,
		url.QueryEscape(supportTicketMessageSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.SupportTicketMessageRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.SupportTicketMessageRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		return model.SupportTicketMessageRecord{}, restStatusError("supabase support message create", response.StatusCode)
	}

	return decodeSingleRecord[model.SupportTicketMessageRecord](response.Body)
}

func (r *SupabaseSupportRepository) ListMessagesByTicketID(ctx context.Context, ticketID string) ([]model.SupportTicketMessageRecord, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?ticket_id=eq.%s&select=%s&order=created_at.asc",
		r.config.RESTURL,
		r.config.SupportMessageTable,
		url.QueryEscape(ticketID),
		url.QueryEscape(supportTicketMessageSelectFields),
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
		return nil, restStatusError("supabase support message list", response.StatusCode)
	}

	var records []model.SupportTicketMessageRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func (r *SupabaseSupportRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}
