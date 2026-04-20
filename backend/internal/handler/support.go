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

type SupportHandler struct {
	logger         *slog.Logger
	supportService service.SupportService
}

func NewSupportHandler(logger *slog.Logger, supportService service.SupportService) *SupportHandler {
	return &SupportHandler{
		logger:         logger,
		supportService: supportService,
	}
}

func (h *SupportHandler) CreateTicket(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateSupportTicketInput
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with supported support ticket fields") {
		return
	}

	payload, err := h.supportService.CreateTicket(r.Context(), user, input)
	if err != nil {
		h.writeSupportError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write support ticket response")
}

func (h *SupportHandler) ListTickets(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.supportService.ListTickets(r.Context(), user)
	if err != nil {
		h.writeSupportError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write support tickets response")
}

func (h *SupportHandler) GetTicket(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.supportService.GetTicket(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeSupportError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write support ticket detail response")
}

func (h *SupportHandler) CreateMessage(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateSupportTicketMessageInput
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with a supported support ticket message") {
		return
	}

	payload, err := h.supportService.CreateMessage(r.Context(), user, r.PathValue("id"), input)
	if err != nil {
		h.writeSupportError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write support ticket message response")
}

func (h *SupportHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.supportService.ListMessages(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeSupportError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write support ticket messages response")
}

func (h *SupportHandler) writeJSON(w http.ResponseWriter, r *http.Request, statusCode int, payload any, logMessage string) {
	if err := response.JSON(w, statusCode, payload); err != nil {
		h.logger.Error(logMessage, slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *SupportHandler) writeSupportError(w http.ResponseWriter, r *http.Request, err error) {
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

		response.Validation(w, http.StatusBadRequest, "validation_failed", "the support request failed validation", requestID, fields)
	case errors.Is(err, service.ErrSupportTicketNotFound):
		response.Error(w, http.StatusNotFound, "support_ticket_not_found", "the requested support ticket was not found", requestID)
	case errors.Is(err, service.ErrSupportPermissionDenied):
		response.Error(w, http.StatusForbidden, "support_ticket_not_allowed", "the current user is not allowed to create support tickets", requestID)
	case errors.Is(err, service.ErrSupportUnavailable):
		h.logger.Error("support service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "support_unavailable", "support data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected support error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
