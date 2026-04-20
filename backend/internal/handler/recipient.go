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

type RecipientHandler struct {
	logger           *slog.Logger
	recipientService service.RecipientService
}

func NewRecipientHandler(logger *slog.Logger, recipientService service.RecipientService) *RecipientHandler {
	return &RecipientHandler{
		logger:           logger,
		recipientService: recipientService,
	}
}

func (h *RecipientHandler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	var input model.CreateRecipientInput
	if !decodeRequestBody(w, r, &input, "request body must be valid JSON with supported recipient fields") {
		return
	}

	payload, err := h.recipientService.CreateRecipient(r.Context(), user, input)
	if err != nil {
		h.writeRecipientError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusCreated, payload, "failed to write recipient response")
}

func (h *RecipientHandler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.recipientService.ListRecipients(r.Context(), user)
	if err != nil {
		h.writeRecipientError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write recipients response")
}

func (h *RecipientHandler) Get(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.recipientService.GetRecipient(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeRecipientError(w, r, err)
		return
	}

	h.writeJSON(w, r, http.StatusOK, payload, "failed to write recipient detail response")
}

func (h *RecipientHandler) writeJSON(w http.ResponseWriter, r *http.Request, statusCode int, payload any, logMessage string) {
	if err := response.JSON(w, statusCode, payload); err != nil {
		h.logger.Error(logMessage, slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *RecipientHandler) writeRecipientError(w http.ResponseWriter, r *http.Request, err error) {
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

		response.Validation(w, http.StatusBadRequest, "validation_failed", "the recipient request failed validation", requestID, fields)
	case errors.Is(err, service.ErrRecipientPermissionDenied):
		response.Error(w, http.StatusForbidden, "recipient_not_allowed", "the current user is not allowed to create recipients", requestID)
	case errors.Is(err, service.ErrRecipientNotFound):
		response.Error(w, http.StatusNotFound, "recipient_not_found", "the requested recipient was not found", requestID)
	case errors.Is(err, service.ErrRecipientsUnavailable):
		h.logger.Error("recipient service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "recipients_unavailable", "recipient data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected recipient error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
