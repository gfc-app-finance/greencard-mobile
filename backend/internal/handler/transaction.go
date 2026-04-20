package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type TransactionHandler struct {
	logger             *slog.Logger
	transactionService service.TransactionService
}

func NewTransactionHandler(logger *slog.Logger, transactionService service.TransactionService) *TransactionHandler {
	return &TransactionHandler{
		logger:             logger,
		transactionService: transactionService,
	}
}

func (h *TransactionHandler) CreateFunding(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateFundingTransactionInput
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with supported funding fields") {
		return
	}

	payload, err := h.transactionService.CreateFunding(r.Context(), user, input)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write funding transaction response")
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
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with supported transfer fields") {
		return
	}

	payload, err := h.transactionService.CreateTransfer(r.Context(), user, input)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write transfer transaction response")
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
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with supported payment fields") {
		return
	}

	payload, err := h.transactionService.CreatePayment(r.Context(), user, input)
	if err != nil {
		h.writeTransactionError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write payment transaction response")
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
