package handler

import (
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type HealthHandler struct {
	logger  *slog.Logger
	service service.HealthService
}

func NewHealthHandler(logger *slog.Logger, service service.HealthService) *HealthHandler {
	return &HealthHandler{
		logger:  logger,
		service: service,
	}
}

func (h *HealthHandler) Get(w http.ResponseWriter, r *http.Request) {
	status := h.service.Status()

	if err := response.JSON(w, http.StatusOK, status); err != nil {
		h.logger.Error("failed to write health response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", "")
	}
}
