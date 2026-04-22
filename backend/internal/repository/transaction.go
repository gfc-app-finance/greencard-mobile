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
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

const (
	fundingTransactionSelectFields  = "id,user_id,account_id,amount,currency,status,status_reason,status_source,last_status_change_at,reference,created_at,updated_at"
	transferTransactionSelectFields = "id,user_id,source_account_id,destination_account_id,source_currency,destination_currency,source_amount,destination_amount,fx_rate,status,status_reason,status_source,last_status_change_at,reference,created_at,updated_at"
	paymentTransactionSelectFields  = "id,user_id,source_account_id,recipient_id,recipient_reference,payment_type,amount,currency,fee,fx_rate,total_amount,status,status_reason,status_source,last_status_change_at,reference,created_at,updated_at"
)

type FundingTransactionRepository interface {
	CreateFunding(ctx context.Context, record model.FundingTransactionRecord) (model.FundingTransactionRecord, error)
	ListFundingByUserID(ctx context.Context, userID string) ([]model.FundingTransactionRecord, error)
	GetFundingByIDForUser(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error)
	GetFundingByReference(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error)
	UpdateFundingStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error)
	CompleteFunding(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error)
}

type TransferTransactionRepository interface {
	CreateTransfer(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error)
	ListTransfersByUserID(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error)
	GetTransferByIDForUser(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error)
	GetTransferByReference(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error)
	UpdateTransferStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.TransferTransactionRecord, error)
	CompleteTransfer(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.TransferTransactionRecord, error)
}

type PaymentTransactionRepository interface {
	CreatePayment(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error)
	ListPaymentsByUserID(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error)
	GetPaymentByIDForUser(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error)
	GetPaymentByReference(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error)
	UpdatePaymentStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.PaymentTransactionRecord, error)
	CompletePayment(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error)
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

func (r *SupabaseTransactionRepository) ListFundingByStatusesChangedBefore(ctx context.Context, statuses []model.FundingStatus, before time.Time, limit int) ([]model.FundingTransactionRecord, error) {
	return listTransactionRecordsByStatusesChangedBefore[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, statusStrings(statuses), before, limit)
}

func (r *SupabaseTransactionRepository) GetFundingByIDForUser(ctx context.Context, userID, transactionID string) (model.FundingTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) GetFundingByReference(ctx context.Context, reference string) (model.FundingTransactionRecord, bool, error) {
	return getTransactionRecordByReference[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, reference)
}

func (r *SupabaseTransactionRepository) UpdateFundingStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.FundingTransactionRecord, error) {
	return updateTransactionStatus[model.FundingTransactionRecord](ctx, r, r.config.FundingTable, fundingTransactionSelectFields, userID, transactionID, payload)
}

func (r *SupabaseTransactionRepository) CompleteFunding(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.FundingTransactionRecord, error) {
	return callTransactionCompletionRPC[model.FundingTransactionRecord](
		ctx,
		r,
		"apply_funding_completion",
		map[string]any{
			"p_user_id":        userID,
			"p_transaction_id": transactionID,
			"p_status_source":  source,
			"p_status_reason":  normalizeRPCString(reason),
		},
	)
}

func (r *SupabaseTransactionRepository) CreateTransfer(ctx context.Context, record model.TransferTransactionRecord) (model.TransferTransactionRecord, error) {
	return createTransactionRecord[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, record)
}

func (r *SupabaseTransactionRepository) ListTransfersByUserID(ctx context.Context, userID string) ([]model.TransferTransactionRecord, error) {
	return listTransactionRecords[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID)
}

func (r *SupabaseTransactionRepository) ListTransfersByStatusesChangedBefore(ctx context.Context, statuses []model.TransferStatus, before time.Time, limit int) ([]model.TransferTransactionRecord, error) {
	return listTransactionRecordsByStatusesChangedBefore[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, statusStrings(statuses), before, limit)
}

func (r *SupabaseTransactionRepository) GetTransferByIDForUser(ctx context.Context, userID, transactionID string) (model.TransferTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) GetTransferByReference(ctx context.Context, reference string) (model.TransferTransactionRecord, bool, error) {
	return getTransactionRecordByReference[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, reference)
}

func (r *SupabaseTransactionRepository) UpdateTransferStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.TransferTransactionRecord, error) {
	return updateTransactionStatus[model.TransferTransactionRecord](ctx, r, r.config.TransferTable, transferTransactionSelectFields, userID, transactionID, payload)
}

func (r *SupabaseTransactionRepository) CompleteTransfer(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.TransferTransactionRecord, error) {
	return callTransactionCompletionRPC[model.TransferTransactionRecord](
		ctx,
		r,
		"apply_transfer_completion",
		map[string]any{
			"p_user_id":        userID,
			"p_transaction_id": transactionID,
			"p_status_source":  source,
			"p_status_reason":  normalizeRPCString(reason),
		},
	)
}

func (r *SupabaseTransactionRepository) CreatePayment(ctx context.Context, record model.PaymentTransactionRecord) (model.PaymentTransactionRecord, error) {
	return createTransactionRecord[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, record)
}

func (r *SupabaseTransactionRepository) ListPaymentsByUserID(ctx context.Context, userID string) ([]model.PaymentTransactionRecord, error) {
	return listTransactionRecords[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID)
}

func (r *SupabaseTransactionRepository) ListPaymentsByStatusesChangedBefore(ctx context.Context, statuses []model.PaymentStatus, before time.Time, limit int) ([]model.PaymentTransactionRecord, error) {
	return listTransactionRecordsByStatusesChangedBefore[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, statusStrings(statuses), before, limit)
}

func (r *SupabaseTransactionRepository) GetPaymentByIDForUser(ctx context.Context, userID, transactionID string) (model.PaymentTransactionRecord, bool, error) {
	return getTransactionRecordByID[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID, transactionID)
}

func (r *SupabaseTransactionRepository) GetPaymentByReference(ctx context.Context, reference string) (model.PaymentTransactionRecord, bool, error) {
	return getTransactionRecordByReference[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, reference)
}

func (r *SupabaseTransactionRepository) UpdatePaymentStatus(ctx context.Context, userID, transactionID string, payload map[string]any) (model.PaymentTransactionRecord, error) {
	return updateTransactionStatus[model.PaymentTransactionRecord](ctx, r, r.config.PaymentTable, paymentTransactionSelectFields, userID, transactionID, payload)
}

func (r *SupabaseTransactionRepository) CompletePayment(ctx context.Context, userID, transactionID string, source model.TransactionStatusSource, reason *string) (model.PaymentTransactionRecord, error) {
	return callTransactionCompletionRPC[model.PaymentTransactionRecord](
		ctx,
		r,
		"apply_payment_completion",
		map[string]any{
			"p_user_id":        userID,
			"p_transaction_id": transactionID,
			"p_status_source":  source,
			"p_status_reason":  normalizeRPCString(reason),
		},
	)
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

func listTransactionRecordsByStatusesChangedBefore[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields string, statuses []string, before time.Time, limit int) ([]T, error) {
	if len(statuses) == 0 || limit <= 0 {
		return []T{}, nil
	}

	timestamp := before.UTC().Format(time.RFC3339Nano)
	orFilter := fmt.Sprintf("(last_status_change_at.lte.%s,and(last_status_change_at.is.null,created_at.lte.%s))", timestamp, timestamp)
	requestURL := fmt.Sprintf(
		"%s/%s?select=%s&status=in.(%s)&or=%s&order=%s&limit=%d",
		repository.config.RESTURL,
		table,
		url.QueryEscape(selectFields),
		url.QueryEscape(strings.Join(statuses, ",")),
		url.QueryEscape(orFilter),
		url.QueryEscape("last_status_change_at.asc,created_at.asc"),
		limit,
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
		return nil, restStatusError("supabase list transactions by status", response.StatusCode)
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

func getTransactionRecordByReference[T any](ctx context.Context, repository *SupabaseTransactionRepository, table, selectFields, reference string) (T, bool, error) {
	requestURL := fmt.Sprintf(
		"%s/%s?reference=eq.%s&select=%s&limit=1",
		repository.config.RESTURL,
		table,
		url.QueryEscape(reference),
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
		return zero, false, restStatusError("supabase get transaction by reference", response.StatusCode)
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

func callTransactionCompletionRPC[T any](ctx context.Context, repository *SupabaseTransactionRepository, functionName string, payload map[string]any) (T, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		var zero T
		return zero, err
	}

	requestURL := fmt.Sprintf("%s/rpc/%s", repository.config.RESTURL, functionName)
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
		return zero, rpcStatusError("supabase transaction completion", response)
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

func normalizeRPCString(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func statusStrings[T ~string](statuses []T) []string {
	values := make([]string, 0, len(statuses))
	for _, status := range statuses {
		trimmed := strings.TrimSpace(string(status))
		if trimmed == "" {
			continue
		}

		values = append(values, trimmed)
	}

	return values
}
