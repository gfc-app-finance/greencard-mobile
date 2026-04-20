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

const (
	fundingTransactionSelectFields  = "id,user_id,account_id,amount,currency,status,reference,created_at,updated_at"
	transferTransactionSelectFields = "id,user_id,source_account_id,destination_account_id,source_currency,destination_currency,source_amount,destination_amount,fx_rate,status,reference,created_at,updated_at"
	paymentTransactionSelectFields  = "id,user_id,source_account_id,recipient_id,recipient_reference,payment_type,amount,currency,fee,fx_rate,total_amount,status,reference,created_at,updated_at"
)

type FundingTransactionRepository interface {
	CreateFunding(ctx context.Context, record model.FundingTransactionRecord) (model.FundingTransactionRecord, error)
	ListFundingByUserID(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error)
	GetFundingByIDForUser(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error)
	UpdateFundingStatus(ctx context.Context, userID, transactionID string, status model.FundingStatus) (model.FundingTransactionRecord, error)
}

type TransferTransactionRepository interface {
	CreateTransfer(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error)
	ListTransfersByUserID(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error)
	GetTransferByIDForUser(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error)
	UpdateTransferStatus(ctx context.Context, userID, transactionID string, status model.TransferStatus) (model.TransferTransactionRecord, error)
}

type PaymentTransactionRepository interface {
	CreatePayment(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error)
	ListPaymentsByUserID(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error)
	GetPaymentByIDForUser(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error)
	UpdatePaymentStatus(ctx context.Context, userID, transactionID string, status model.PaymentStatus) (model.PaymentTransactionRecord, error)
}

type SupabaseTransactionRepository struct {
	logger *slog.Logger
	client *http.Client
	config config.SupabaseConfig
}

func NewSupabaseTransactionRepository(logger *slog.Logger, cfg config.SupabaseConfig) *SupabaseTransactionRepository {
	return &SupabaseTransactionRepository{
		logger: logger,
		client: &http.Client{Timeout: cfg.RESTTimeout},
		config: cfg,
	}
}

func (r *SupabaseTransactionRepository) CreateFunding(ctx context.Context, record model.FundingTransactionRecord) (model.FundingTransactionRecord, error) {
	return createTransactionRecord[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, record)
}

func (r *SupabaseTransactionRepository) ListFundingByUserID(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error) {
	return listTransactionRecords[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, userID)
}

func (r *SupabaseTransactionRepository) GetFundingByIDForUser(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) UpdateFundingStatus(ctx context.Context, userID, transactionID string, status model.FundingStatus) (model.FundingTransactionRecord, error) {
	return updateTransactionStatus[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, userID, transactionID, map[string]any{
		"status": status,
	})
}

func (r *SupabaseTransactionRepository) CreateTransfer(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error) {
	return createTransactionRecord[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, record)
}

func (r *SupabaseTransactionRepository) ListTransfersByUserID(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error) {
	return listTransactionRecords[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID)
}

func (r *SupabaseTransactionRepository) GetTransferByIDForUser(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) UpdateTransferStatus(ctx context.Context, userID, transactionID string, status model.TransferStatus) (model.TransferTransactionRecord, error) {
	return updateTransactionStatus[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID, transactionID, map[string]any{
		"status": status,
	})
}

func (r *SupabaseTransactionRepository) CreatePayment(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error) {
	return createTransactionRecord[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, record)
}

func (r *SupabaseTransactionRepository) ListPaymentsByUserID(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error) {
	return listTransactionRecords[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID)
}

func (r *SupabaseTransactionRepository) GetPaymentByIDForUser(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) UpdatePaymentStatus(ctx context.Context, userID, transactionID string, status model.PaymentStatus) (model.PaymentTransactionRecord, error) {
	return updateTransactionStatus[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID, transactionID, map[string]any{
		"status": status,
	})
}

func createTransactionRecord[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields string, record T) (T, error) {
	body, err := json.Marshal(record)
	if err != nil {
		var zero T
		return zero, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?select=%s",
		repository.config.RESTURL,
		table,
		url.QueryEscape(selectFields),
	)

	request, err := repository.newRequest(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		var zero T
		return zero, err
	}

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
		return zero, restStatusError("supabase create transaction", response.StatusCode)
	}

	return decodeSingleRecord[T](response.Body)
}

func listTransactionRecords[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields, userID string) ([]T, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?user_id=eq.%s&select=%s&order=created_at.desc",
		repository.config.RESTURL,
		table,
		url.QueryEscape(userID),
		url.QueryEscape(selectFields),
	)

	request, err := repository.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}

	response, err := repository.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, restStatusError("supabase list transaction", response.StatusCode)
	}

	var records []T
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		return nil, err
	}

	return records, nil
}

func getTransactionRecordByID[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields, userID, transactionID string) (T, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&user_id=eq.%s&select=%s&limit=1",
		repository.config.RESTURL,
		table,
		url.QueryEscape(transactionID),
		url.QueryEscape(userID),
		url.QueryEscape(selectFields),
	)

	request, err := repository.newRequest(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		var zero T
		return zero, false, err
	}

	response, err := repository.client.Do(request)
	if err != nil {
		var zero T
		return zero, false, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		var zero T
		return zero, false, restStatusError("supabase get transaction", response.StatusCode)
	}

	var records []T
	if err := json.NewDecoder(response.Body).Decode(&records); err != nil {
		var zero T
		return zero, false, err
	}

	if len(records) == 0 {
		var zero T
		return zero, false, nil
	}

	return records[0], true, nil
}

func updateTransactionStatus[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields, userID, transactionID string, payload map[string]any) (T, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		var zero T
		return zero, err
	}

	requestURL := fmt.Sprintf(
		"%s/%s?id=eq.%s&user_id=eq.%s&select=%s",
		repository.config.RESTURL,
		table,
		url.QueryEscape(transactionID),
		url.QueryEscape(userID),
		url.QueryEscape(selectFields),
	)

	request, err := repository.newRequest(ctx, http.MethodPatch, requestURL, bytes.NewReader(body))
	if err != nil {
		var zero T
		return zero, err
	}

	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Prefer", "return=representation")

	response, err := repository.client.Do(request)
	if err != nil {
		var zero T
		return zero, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		var zero T
		return zero, restStatusError("supabase update transaction", response.StatusCode)
	}

	return decodeSingleRecord[T](response.Body)
}

func (r *SupabaseTransactionRepository) newRequest(ctx context.Context, method, requestURL string, body io.Reader) (*http.Request, error) {
	request, err := http.NewRequestWithContext(ctx, method, requestURL, body)
	if err != nil {
		return nil, err
	}

	request.Header.Set("apikey", r.config.ServiceRoleKey)
	request.Header.Set("Authorization", "Bearer "+r.config.ServiceRoleKey)
	request.Header.Set("Accept", "application/json")

	return request, nil
}

func decodeSingleRecord[T any](reader io.Reader) (T, error) {
	rawBody, err := io.ReadAll(reader)
	if err != nil {
		var zero T
		return zero, err
	}

	rawBody = bytes.TrimSpace(rawBody)
	if len(rawBody) == 0 {
		var zero T
		return zero, errors.New("empty transaction response body")
	}

	if rawBody[0] == '[' {
		var records []T
		if err := json.Unmarshal(rawBody, &records); err != nil {
			var zero T
			return zero, err
		}

		if len(records) == 0 {
			var zero T
			return zero, errors.New("transaction response did not include a record")
		}

		return records[0], nil
	}

	var record T
	if err := json.Unmarshal(rawBody, &record); err != nil {
		var zero T
		return zero, err
	}

	return record, nil
}
