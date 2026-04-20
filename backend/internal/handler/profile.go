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

type ProfileHandler struct {
	logger         *slog.Logger
	profileService service.ProfileService
}

func NewProfileHandler(logger *slog.Logger, profileService service.ProfileService) *ProfileHandler {
	return &ProfileHandler{
		logger:         logger,
		profileService: profileService,
	}
}

func (h *ProfileHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	payload, err := h.profileService.GetCurrentProfile(r.Context(), user)
	if err != nil {
		h.writeProfileError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write profile response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *ProfileHandler) Patch(w http.ResponseWriter, r *http.Request) {
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

	var input model.UpdateProfileInput
	if err := response.DecodeJSON(r.Body, &input); err != nil {
		response.Error(
			w,
			http.StatusBadRequest,
			"invalid_request_body",
			"request body must be valid JSON with supported profile fields",
			middleware.GetRequestID(r.Context()),
		)
		return
	}

	payload, err := h.profileService.UpdateCurrentProfile(r.Context(), user, input)
	if err != nil {
		h.writeProfileError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write updated profile response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *ProfileHandler) writeProfileError(w http.ResponseWriter, r *http.Request, err error) {
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
			"the profile request failed validation",
			requestID,
			fields,
		)
	case errors.Is(err, service.ErrProfileUnavailable):
		h.logger.Error("profile service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "profile_unavailable", "profile data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected profile error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
