package handler

import (
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type WebhookHandler struct {
	logger         *slog.Logger
	webhookService service.WebhookService
}

func NewWebhookHandler(logger *slog.Logger, webhookService service.WebhookService) *WebhookHandler {
	return &WebhookHandler{
		logger:         logger,
		webhookService: webhookService,
	}
}

func (h *WebhookHandler) HandleProviderEvent(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid_webhook_body", "the webhook request body could not be read", middleware.GetRequestID(r.Context()))
		return
	}

	payload, handleErr := h.webhookService.HandleProviderWebhook(r.Context(), r.PathValue("provider"), r.Header, body)
	if handleErr != nil {
		h.writeWebhookError(w, r, handleErr)
		return
	}

	if err := response.JSON(w, http.StatusAccepted, payload); err != nil {
		h.logger.Error("failed to write webhook response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *WebhookHandler) writeWebhookError(w http.ResponseWriter, r *http.Request, err error) {
	requestID := middleware.GetRequestID(r.Context())

	switch {
	case errors.Is(err, service.ErrWebhookProviderUnsupported):
		response.Error(w, http.StatusNotFound, "webhook_provider_not_supported", "the requested webhook provider is not configured", requestID)
	case errors.Is(err, service.ErrWebhookVerificationFailed):
		response.Error(w, http.StatusUnauthorized, "webhook_not_verified", "the webhook request could not be verified", requestID)
	case errors.Is(err, service.ErrWebhookInvalidPayload):
		response.Error(w, http.StatusBadRequest, "invalid_webhook_payload", "the webhook payload is invalid", requestID)
	case errors.Is(err, service.ErrFundingTransactionNotFound),
		errors.Is(err, service.ErrTransferTransactionNotFound),
		errors.Is(err, service.ErrPaymentTransactionNotFound):
		response.Error(w, http.StatusNotFound, "linked_transaction_not_found", "the linked transaction could not be found", requestID)
	case errors.Is(err, service.ErrInvalidTransactionTransition):
		response.Error(w, http.StatusConflict, "webhook_transition_rejected", "the webhook event could not be applied to the transaction lifecycle", requestID)
	case errors.Is(err, service.ErrInsufficientFunds):
		response.Error(w, http.StatusConflict, "insufficient_funds", "the webhook event could not be settled because the account does not have enough available balance", requestID)
	case errors.Is(err, service.ErrFundingTransactionsUnavailable),
		errors.Is(err, service.ErrTransferTransactionsUnavailable),
		errors.Is(err, service.ErrPaymentTransactionsUnavailable),
		errors.Is(err, service.ErrWebhookUnavailable):
		h.logger.Error("webhook processing unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "webhook_processing_unavailable", "webhook processing is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected webhook error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
