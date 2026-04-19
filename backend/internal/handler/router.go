package handler

import (
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

func NewRouter(
	logger *slog.Logger,
	healthService service.HealthService,
	authService service.AuthService,
	profileService service.ProfileService,
	accountService service.AccountService,
) http.Handler {
	publicMux := http.NewServeMux()
	protectedMux := http.NewServeMux()
	rootMux := http.NewServeMux()

	healthHandler := NewHealthHandler(logger, healthService)
	authSessionHandler := NewAuthSessionHandler(logger)
	profileHandler := NewProfileHandler(logger, profileService)
	accountHandler := NewAccountHandler(logger, accountService)

	publicMux.HandleFunc("GET /health", healthHandler.Get)
	protectedMux.HandleFunc("GET /auth/session", authSessionHandler.Get)
	protectedMux.HandleFunc("GET /profile", profileHandler.Get)
	protectedMux.HandleFunc("PATCH /profile", profileHandler.Patch)
	protectedMux.HandleFunc("GET /accounts", accountHandler.List)
	protectedMux.HandleFunc("GET /accounts/{id}", accountHandler.Get)
	rootMux.Handle("/", withJSONNotFound(publicMux))
	rootMux.Handle(
		"/v1/",
		http.StripPrefix(
			"/v1",
			middleware.RequireAuth(logger, authService)(
				withJSONNotFound(protectedMux),
			),
		),
	)

	return middleware.Chain(
		withJSONNotFound(rootMux),
		middleware.RequestID,
		middleware.SecurityHeaders,
		middleware.RequestLogger(logger),
		middleware.Recover(logger),
	)
}

func withJSONNotFound(mux *http.ServeMux) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handler, pattern := mux.Handler(r)
		if pattern == "" {
			response.Error(
				w,
				http.StatusNotFound,
				"route_not_found",
				"the requested route does not exist",
				middleware.GetRequestID(r.Context()),
			)
			return
		}

		handler.ServeHTTP(w, r)
	})
}
