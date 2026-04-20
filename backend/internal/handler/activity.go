package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type ActivityHandler struct {
	logger          *slog.Logger
	activityService service.ActivityService
}

func NewActivityHandler(logger *slog.Logger, activityService service.ActivityService) *ActivityHandler {
	return &ActivityHandler{
		logger:          logger,
		activityService: activityService,
	}
}

func (h *ActivityHandler) List(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.activityService.ListActivity(r.Context(), user)
	if err != nil {
		h.writeActivityError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write activity response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *ActivityHandler) ListRecent(w http.ResponseWriter, r *http.Request) {
	user, ok := authenticatedUserFromRequest(w, r)
	if !ok {
		return
	}

	payload, err := h.activityService.ListRecentActivity(r.Context(), user)
	if err != nil {
		h.writeActivityError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write recent activity response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *ActivityHandler) writeActivityError(w http.ResponseWriter, r *http.Request, err error) {
	requestID := middleware.GetRequestID(r.Context())

	switch {
	case errors.Is(err, service.ErrActivityUnavailable):
		h.logger.Error("activity service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "activity_unavailable", "activity data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected activity error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
