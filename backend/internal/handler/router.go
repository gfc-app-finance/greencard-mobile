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
	transactionService service.TransactionService,
	idempotencyService service.IdempotencyService,
	webhookService service.WebhookService,
	activityService service.ActivityService,
	recipientService service.RecipientService,
	supportService service.SupportService,
	enableTransactionSimulation bool,
) http.Handler {
	publicMux := http.NewServeMux()
	protectedMux := http.NewServeMux()
	rootMux := http.NewServeMux()

	healthHandler := NewHealthHandler(logger, healthService)
	authSessionHandler := NewAuthSessionHandler(logger)
	profileHandler := NewProfileHandler(logger, profileService)
	accountHandler := NewAccountHandler(logger, accountService)
	transactionHandler := NewTransactionHandler(logger, transactionService, idempotencyService)
	webhookHandler := NewWebhookHandler(logger, webhookService)
	activityHandler := NewActivityHandler(logger, activityService)
	recipientHandler := NewRecipientHandler(logger, recipientService)
	supportHandler := NewSupportHandler(logger, supportService)

	publicMux.HandleFunc("GET /health", healthHandler.Get)
	publicMux.HandleFunc("POST /webhooks/providers/{provider}", webhookHandler.HandleProviderEvent)
	protectedMux.HandleFunc("GET /auth/session", authSessionHandler.Get)
	protectedMux.HandleFunc("GET /profile", profileHandler.Get)
	protectedMux.HandleFunc("PATCH /profile", profileHandler.Patch)
	protectedMux.HandleFunc("GET /accounts", accountHandler.List)
	protectedMux.HandleFunc("GET /accounts/{id}", accountHandler.Get)
	protectedMux.HandleFunc("GET /activity", activityHandler.List)
	protectedMux.HandleFunc("GET /activity/recent", activityHandler.ListRecent)
	protectedMux.HandleFunc("POST /recipients", recipientHandler.Create)
	protectedMux.HandleFunc("GET /recipients", recipientHandler.List)
	protectedMux.HandleFunc("GET /recipients/{id}", recipientHandler.Get)
	protectedMux.HandleFunc("POST /support/tickets", supportHandler.CreateTicket)
	protectedMux.HandleFunc("GET /support/tickets", supportHandler.ListTickets)
	protectedMux.HandleFunc("POST /support/tickets/{id}/messages", supportHandler.CreateMessage)
	protectedMux.HandleFunc("GET /support/tickets/{id}/messages", supportHandler.ListMessages)
	protectedMux.HandleFunc("GET /support/tickets/{id}", supportHandler.GetTicket)
	protectedMux.HandleFunc("POST /transactions/funding", transactionHandler.CreateFunding)
	protectedMux.HandleFunc("GET /transactions/funding", transactionHandler.ListFunding)
	protectedMux.HandleFunc("GET /transactions/funding/{id}", transactionHandler.GetFunding)
	protectedMux.HandleFunc("POST /transactions/transfers", transactionHandler.CreateTransfer)
	protectedMux.HandleFunc("GET /transactions/transfers", transactionHandler.ListTransfers)
	protectedMux.HandleFunc("GET /transactions/transfers/{id}", transactionHandler.GetTransfer)
	protectedMux.HandleFunc("POST /transactions/payments", transactionHandler.CreatePayment)
	protectedMux.HandleFunc("GET /transactions/payments", transactionHandler.ListPayments)
	protectedMux.HandleFunc("GET /transactions/payments/{id}", transactionHandler.GetPayment)
	if enableTransactionSimulation {
		protectedMux.HandleFunc("POST /transactions/funding/{id}/simulate/advance", transactionHandler.SimulateAdvanceFunding)
		protectedMux.HandleFunc("POST /transactions/transfers/{id}/simulate/advance", transactionHandler.SimulateAdvanceTransfer)
		protectedMux.HandleFunc("POST /transactions/payments/{id}/simulate/advance", transactionHandler.SimulateAdvancePayment)
	}
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
