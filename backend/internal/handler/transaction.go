package handler

import (
	"bytes"
	"context"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type TransactionHandler struct {
	logger             *slog.Logger
	transactionService service.TransactionService
	idempotencyService service.IdempotencyService
}

func NewTransactionHandler(logger *slog.Logger, transactionService service.TransactionService, idempotencyService service.IdempotencyService) *TransactionHandler {
	return &TransactionHandler{
		logger:             logger,
		transactionService: transactionService,
		idempotencyService: idempotencyService,
	}
}

func (h *TransactionHandler) CreateFunding(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateFundingTransactionInput
	body, ok := decodeRequestBodyBytes(w, r, &input, "request body must be valid JSON with supported funding fields")
	if !ok {
		return
	}

	result, err := h.executeTransactionCreate(r.Context(), user.ID, "transactions.funding.create", r.Header.Get("Idempotency-Key"), body, func(ctx context.Context) (int, any) {
		payload, serviceErr := h.transactionService.CreateFunding(ctx, user, input)
		return h.mapTransactionResult(r, payload, serviceErr)
	})
	if err != nil {
		h.writeTransactionCreateInfraError(w, r, err)
		return
	}

	h.writeTransactionCreateResult(w, r, result, "failed to write funding transaction response")
}

func (h *TransactionHandler) ListFunding(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.ListFunding(r.Context(), user)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write funding transactions response")
}

func (h *TransactionHandler) GetFunding(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.GetFunding(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write funding transaction detail response")
}

func (h *TransactionHandler) CreateTransfer(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateTransferTransactionInput
	body, ok := decodeRequestBodyBytes(w, r, &input, "request body must be valid JSON with supported transfer fields")
	if !ok {
		return
	}

	result, err := h.executeTransactionCreate(r.Context(), user.ID, "transactions.transfer.create", r.Header.Get("Idempotency-Key"), body, func(ctx context.Context) (int, any) {
		payload, serviceErr := h.transactionService.CreateTransfer(ctx, user, input)
		return h.mapTransactionResult(r, payload, serviceErr)
	})
	if err != nil {
		h.writeTransactionCreateInfraError(w, r, err)
		return
	}

	h.writeTransactionCreateResult(w, r, result, "failed to write transfer transaction response")
}

func (h *TransactionHandler) ListTransfers(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.ListTransfers(r.Context(), user)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write transfer transactions response")
}

func (h *TransactionHandler) GetTransfer(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.GetTransfer(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write transfer transaction detail response")
}

func (h *TransactionHandler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreatePaymentTransactionInput
	body, ok := decodeRequestBodyBytes(w, r, &input, "request body must be valid JSON with supported payment fields")
	if !ok {
		return
	}

	result, err := h.executeTransactionCreate(r.Context(), user.ID, "transactions.payment.create", r.Header.Get("Idempotency-Key"), body, func(ctx context.Context) (int, any) {
		payload, serviceErr := h.transactionService.CreatePayment(ctx, user, input)
		return h.mapTransactionResult(r, payload, serviceErr)
	})
	if err != nil {
		h.writeTransactionCreateInfraError(w, r, err)
		return
	}

	h.writeTransactionCreateResult(w, r, result, "failed to write payment transaction response")
}

func (h *TransactionHandler) ListPayments(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.ListPayments(r.Context(), user)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write payment transactions response")
}

func (h *TransactionHandler) GetPayment(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.GetPayment(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write payment transaction detail response")
}

func (h *TransactionHandler) SimulateAdvanceFunding(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.SimulateAdvanceFunding(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write simulated funding transaction response")
}

func (h *TransactionHandler) SimulateAdvanceTransfer(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.SimulateAdvanceTransfer(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write simulated transfer transaction response")
}

func (h *TransactionHandler) SimulateAdvancePayment(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.transactionService.SimulateAdvancePayment(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write simulated payment transaction response")
}

func (h *TransactionHandler) writeJSON(w http.ResponseWriter, r *http.Request, statusCode int, payload any, logMessage string) {
	if err := response.JSON(w, statusCode, payload); err != nil {
		h.logger.Error(logMessage, slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *TransactionHandler) writeTransactionError(w http.ResponseWriter, r *http.Request, err error) {
	requestID := middleware.GetRequestID(r.Context())

	var validationErrors service.ValidationErrors
	switch {
	case errors.As(err, &validationErrors):
		fields := make([]response.ValidationFieldError, 0, len(validationErrors))
		for _, item := range validationErrors {
			fields = append(fields, response.ValidationFieldError{
				Field:   item.Field,
				Message: item.Message,
			})
		}

		response.Validation(w, http.StatusBadRequest, "validation_failed", "the transaction request failed validation", requestID, fields)
	case errors.Is(err, service.ErrTransactionPermissionDenied):
		response.Error(w, http.StatusForbidden, "transaction_not_allowed", "the current user is not allowed to create this transaction", requestID)
	case errors.Is(err, service.ErrInsufficientFunds):
		response.Error(w, http.StatusConflict, "insufficient_funds", "the source account does not have enough available balance for this transaction", requestID)
	case errors.Is(err, service.ErrInvalidTransactionTransition):
		response.Error(w, http.StatusBadRequest, "invalid_transaction_transition", "the requested transaction status transition is not allowed", requestID)
	case errors.Is(err, service.ErrFundingTransactionNotFound),
		errors.Is(err, service.ErrTransferTransactionNotFound),
		errors.Is(err, service.ErrPaymentTransactionNotFound):
		response.Error(w, http.StatusNotFound, "transaction_not_found", "the requested transaction was not found", requestID)
	case errors.Is(err, service.ErrFundingTransactionsUnavailable):
		h.logger.Error("funding transaction service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "funding_transactions_unavailable", "funding transaction data is temporarily unavailable", requestID)
	case errors.Is(err, service.ErrTransferTransactionsUnavailable):
		h.logger.Error("transfer transaction service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "transfer_transactions_unavailable", "transfer transaction data is temporarily unavailable", requestID)
	case errors.Is(err, service.ErrPaymentTransactionsUnavailable):
		h.logger.Error("payment transaction service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "payment_transactions_unavailable", "payment transaction data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected transaction error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}

func (h *TransactionHandler) writeTransactionCreateInfraError(w http.ResponseWriter, r *http.Request, err error) {
	requestID := middleware.GetRequestID(r.Context())

	switch {
	case errors.Is(err, service.ErrIdempotencyKeyConflict):
		response.Error(w, http.StatusConflict, "idempotency_key_conflict", "the idempotency key has already been used for a different request", requestID)
	case errors.Is(err, service.ErrIdempotencyInProgress):
		response.Error(w, http.StatusConflict, "request_in_progress", "a matching request is still being processed", requestID)
	case errors.Is(err, service.ErrIdempotencyUnavailable):
		h.logger.Error("idempotency service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "idempotency_unavailable", "request deduplication is temporarily unavailable", requestID)
	default:
		h.writeTransactionError(w, r, err)
	}
}

func (h *TransactionHandler) executeTransactionCreate(
	ctx context.Context,
	userID, operation, idempotencyKey string,
	requestBody []byte,
	execute service.IdempotencyExecution,
) (service.IdempotencyResult, error) {
	if h.idempotencyService == nil {
		statusCode, payload := execute(ctx)
		return service.IdempotencyResult{
			StatusCode: statusCode,
			Payload:    payload,
		}, nil
	}

	return h.idempotencyService.Execute(ctx, userID, operation, strings.TrimSpace(idempotencyKey), requestBody, execute)
}

func (h *TransactionHandler) mapTransactionResult(r *http.Request, payload any, err error) (int, any) {
	if err == nil {
		return http.StatusCreated, payload
	}

	requestID := middleware.GetRequestID(r.Context())
	errorEnvelope, statusCode := h.transactionErrorEnvelope(err, requestID)
	return statusCode, errorEnvelope
}

func (h *TransactionHandler) transactionErrorEnvelope(err error, requestID string) (response.ErrorEnvelope, int) {
	var validationErrors service.ValidationErrors
	switch {
	case errors.As(err, &validationErrors):
		fields := make([]response.ValidationFieldError, 0, len(validationErrors))
		for _, item := range validationErrors {
			fields = append(fields, response.ValidationFieldError{
				Field:   item.Field,
				Message: item.Message,
			})
		}
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "validation_failed",
				Message:   "the transaction request failed validation",
				RequestID: requestID,
				Fields:    fields,
			},
		}, http.StatusBadRequest
	case errors.Is(err, service.ErrTransactionPermissionDenied):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "transaction_not_allowed",
				Message:   "the current user is not allowed to create this transaction",
				RequestID: requestID,
			},
		}, http.StatusForbidden
	case errors.Is(err, service.ErrInsufficientFunds):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "insufficient_funds",
				Message:   "the source account does not have enough available balance for this transaction",
				RequestID: requestID,
			},
		}, http.StatusConflict
	case errors.Is(err, service.ErrInvalidTransactionTransition):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "invalid_transaction_transition",
				Message:   "the requested transaction status transition is not allowed",
				RequestID: requestID,
			},
		}, http.StatusBadRequest
	case errors.Is(err, service.ErrFundingTransactionNotFound),
		errors.Is(err, service.ErrTransferTransactionNotFound),
		errors.Is(err, service.ErrPaymentTransactionNotFound):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "transaction_not_found",
				Message:   "the requested transaction was not found",
				RequestID: requestID,
			},
		}, http.StatusNotFound
	case errors.Is(err, service.ErrFundingTransactionsUnavailable):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "funding_transactions_unavailable",
				Message:   "funding transaction data is temporarily unavailable",
				RequestID: requestID,
			},
		}, http.StatusServiceUnavailable
	case errors.Is(err, service.ErrTransferTransactionsUnavailable):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "transfer_transactions_unavailable",
				Message:   "transfer transaction data is temporarily unavailable",
				RequestID: requestID,
			},
		}, http.StatusServiceUnavailable
	case errors.Is(err, service.ErrPaymentTransactionsUnavailable):
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "payment_transactions_unavailable",
				Message:   "payment transaction data is temporarily unavailable",
				RequestID: requestID,
			},
		}, http.StatusServiceUnavailable
	default:
		return response.ErrorEnvelope{
			Error: response.ErrorDetail{
				Code:      "internal_server_error",
				Message:   "an unexpected error occurred",
				RequestID: requestID,
			},
		}, http.StatusInternalServerError
	}
}

func (h *TransactionHandler) writeTransactionCreateResult(w http.ResponseWriter, r *http.Request, result service.IdempotencyResult, logMessage string) {
	if len(result.Body) > 0 {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(result.StatusCode)
		if _, err := w.Write(result.Body); err != nil {
			h.logger.Error(logMessage, slog.String("error", err.Error()))
			response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
		}
		return
	}

	h.writeJSON(w, r, result.StatusCode, result.Payload, logMessage)
}

func authenticatedUserFromRequest(w http.ResponseWriter, r *http.Request) (model.AuthenticatedUser, bool) {
	user, ok := middleware.GetAuthenticatedUser(r.Context())
	if !ok {
		response.Error(
			w,
			http.StatusInternalServerError,
			"authenticated_user_missing",
			"authenticated user context was not available",
			middleware.GetRequestID(r.Context()),
		)
		return model.AuthenticatedUser{}, false
	}

	return user, true
}

func decodeRequestBody(w http.ResponseWriter, r *http.Request, destination any, message string) bool {
	if err := response.DecodeJSON(r.Body, destination); err != nil {
		response.Error(
			w,
			http.StatusBadRequest,
			"invalid_request_body",
			message,
			middleware.GetRequestID(r.Context()),
		)
		return false
	}

	return true
}

func decodeRequestBodyBytes(w http.ResponseWriter, r *http.Request, destination any, message string) ([]byte, bool) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		response.Error(
			w,
			http.StatusBadRequest,
			"invalid_request_body",
			message,
			middleware.GetRequestID(r.Context()),
		)
		return nil, false
	}

	if err := response.DecodeJSON(bytes.NewReader(body), destination); err != nil {
		response.Error(
			w,
			http.StatusBadRequest,
			"invalid_request_body",
			message,
			middleware.GetRequestID(r.Context()),
		)
		return nil, false
	}

	return body, true
}
