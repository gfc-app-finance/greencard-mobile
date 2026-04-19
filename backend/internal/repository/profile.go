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
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const profileSelectFields = "id,full_name,date_of_birth,residential_address,nationality,verification_status,created_at,updated_at"

type ProfileRepository interface {
	GetByUserID(ctx context.Context, userID string) (model.ProfileRecord, bool, error)
	Upsert(ctx context.Context, profile model.ProfileRecord) (model.ProfileRecord, error)
}

type SupabaseProfileRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseProfileRepository(logger *slog.Logger, cfg config.SupabaseConfig) ProfileRepository {
	return &SupabaseProfileRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseProfileRepository) GetByUserID(ctx context.Context, userID string) (model.ProfileRecord, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&select=%s&limit=1",
		r.config.RESTURL,
		r.config.ProfileTable,
		url.QueryEscape(userID),
		url.QueryEscape(profileSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return model.ProfileRecord{}, false, err
	}

	response, err := r.client.Do(request)
	if err != nil {
		return model.ProfileRecord{}, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(response.Body)
		return model.ProfileRecord{}, false, fmt.Errorf("supabase profile fetch failed with status %d: %s", response.StatusCode, strings.TrimSpace(string(body)))
	}

	var records []model.ProfileRecord
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return model.ProfileRecord{}, false, err
	}

	if len(records) == 0 {
		return model.ProfileRecord{}, false, nil
	}

	return records[0], true, nil
}

func (r *SupabaseProfileRepository) Upsert(ctx context.Context, profile model.ProfileRecord) (model.ProfileRecord, error) {
	body, err := json.Marshal(profile)
	if err != nil {
		return model.ProfileRecord{}, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?on_conflict=id&select=%s",
		r.config.RESTURL,
		r.config.ProfileTable,
		url.QueryEscape(profileSelectFields),
	)

	request, err := r.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return model.ProfileRecord{}, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "resolution=merge-duplicates,return=representation")

	response, err := r.client.Do(request)
	if err != nil {
		return model.ProfileRecord{}, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK && response.StatusCode != http.StatusCreated {
		rawBody, _ := io.ReadAll(response.Body)
		return model.ProfileRecord{}, fmt.Errorf("supabase profile upsert failed with status %d: %s", response.StatusCode, strings.TrimSpace(string(rawBody)))
	}

	return decodeSingleProfileRecord(response.Body)
}

func (r *SupabaseProfileRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}

func decodeSingleProfileRecord(reader io.Reader) (model.ProfileRecord, error) {
	rawBody, err := io.ReadAll(reader)
	if err != nil {
		return model.ProfileRecord{}, err
	}

	rawBody = bytes.TrimSpace(rawBody)
	if len(rawBody) == 0 {
		return model.ProfileRecord{}, errors.New("empty profile response body")
	}

	if rawBody[0] == '[' {
		var records []model.ProfileRecord
		if err := json.Unmarshal(rawBody, &records); err != nil {
			return model.ProfileRecord{}, err
		}

		if len(records) == 0 {
			return model.ProfileRecord{}, errors.New("profile response did not include a record")
		}

		return records[0], nil
	}

	var record model.ProfileRecord
	if err := json.Unmarshal(rawBody, &record); err != nil {
		return model.ProfileRecord{}, err
	}

	return record, nil
}
