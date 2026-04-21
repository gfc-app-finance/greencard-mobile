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

type VerificationHandler struct {
	logger  *slog.Logger
	service service.IdentityVerificationService
}

func NewVerificationHandler(logger *slog.Logger, service service.IdentityVerificationService) *VerificationHandler {
	return &VerificationHandler{
		logger:  logger,
		service: service,
	}
}

func (h *VerificationHandler) SubmitIdentity(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.GetAuthenticatedUser(r.Context())
	if !ok {
		response.Error(
			w,
			http.StatusInternalServerError,
			"authenticated_user_missing",
			"authenticated user context was not available",
			middleware.GetRequestID(r.Context()),
		)
		return
	}

	var input model.SubmitIdentityVerificationInput
	if err := response.DecodeJSON(r.Body, &input); err != nil {
		response.Error(
			w,
			http.StatusBadRequest,
			"invalid_request_body",
			"request body must be valid JSON with supported identity verification fields",
			middleware.GetRequestID(r.Context()),
		)
		return
	}

	payload, err := h.service.SubmitIdentityVerification(r.Context(), user, input)
	if err != nil {
		h.writeVerificationError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write identity verification response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *VerificationHandler) writeVerificationError(w http.ResponseWriter, r *http.Request, err error) {
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

		response.Validation(
			w,
			http.StatusBadRequest,
			"validation_failed",
			"the identity verification request failed validation",
			requestID,
			fields,
		)
	case errors.Is(err, service.ErrIdentityVerificationProviderNotConfigured):
		response.Error(w, http.StatusServiceUnavailable, "identity_provider_not_configured", "identity verification is not configured", requestID)
	case errors.Is(err, service.ErrIdentityVerificationDenied):
		response.Error(w, http.StatusForbidden, "identity_verification_denied", "identity verification is not available for this profile state", requestID)
	case errors.Is(err, service.ErrIdentityVerificationUnavailable):
		h.logger.Error("identity verification unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "identity_verification_unavailable", "identity verification is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected identity verification error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
