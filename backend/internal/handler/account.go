package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type AccountHandler struct {
	logger         *slog.Logger
	accountService service.AccountService
}

func NewAccountHandler(logger *slog.Logger, accountService service.AccountService) *AccountHandler {
	return &AccountHandler{
		logger:         logger,
		accountService: accountService,
	}
}

func (h *AccountHandler) List(w http.ResponseWriter, r *http.Request) {
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

	payload, err := h.accountService.ListAccounts(r.Context(), user)
	if err != nil {
		h.writeAccountError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write accounts response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *AccountHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	payload, err := h.accountService.GetAccount(r.Context(), user, r.PathValue("id"))
	if err != nil {
		h.writeAccountError(w, r, err)
		return
	}

	if err := response.JSON(w, http.StatusOK, payload); err != nil {
		h.logger.Error("failed to write account detail response", slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "response_write_failed", "failed to write response", middleware.GetRequestID(r.Context()))
	}
}

func (h *AccountHandler) writeAccountError(w http.ResponseWriter, r *http.Request, err error) {
	requestID := middleware.GetRequestID(r.Context())

	switch {
	case errors.Is(err, service.ErrAccountNotFound):
		response.Error(w, http.StatusNotFound, "account_not_found", "the requested account was not found", requestID)
	case errors.Is(err, service.ErrAccountsUnavailable):
		h.logger.Error("account service unavailable", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusServiceUnavailable, "accounts_unavailable", "account data is temporarily unavailable", requestID)
	default:
		h.logger.Error("unexpected account error", slog.String("request_id", requestID), slog.String("path", r.URL.Path), slog.String("error", err.Error()))
		response.Error(w, http.StatusInternalServerError, "internal_server_error", "an unexpected error occurred", requestID)
	}
}
