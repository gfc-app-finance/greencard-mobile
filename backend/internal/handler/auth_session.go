package handler

import (
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
)

type AuthSessionHandler struct {
	logger *slog.Logger
}

func NewAuthSessionHandler(logger *slog.Logger) *AuthSessionHandler {
	return &AuthSessionHandler{logger: logger}
}

func (h *AuthSessionHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	if err := response.JSON(w, http.StatusOK, map[string]any{
		"user": user,
	}); err != nil {
		h.logger.Error("failed to write auth session response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}
