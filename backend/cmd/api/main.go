package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/handler"
	applogger "github.com/gfc-app-finance/greencard-mobile/backend/internal/logger"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/middleware"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/provider"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/worker"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("backend config error: %v", err)
		os.Exit(1)
	}

	logger := applogger.New(cfg.AppName, cfg.Env, cfg.LogLevel)

	if err := run(logger, cfg); err != nil {
		logger.Error("api server exited with error", slog.String("error", err.Error()))
		os.Exit(1)
	}
}

func run(logger *slog.Logger, cfg config.Config) error {
	healthService := service.NewHealthService(cfg.AppName, cfg.Env, cfg.Version)
	authService := service.NewSupabaseAuthService(logger, cfg.Supabase)
	rateLimiter := middleware.NewRateLimiter(logger, cfg.RateLimit)
	profileRepository := repository.NewSupabaseProfileRepository(logger, cfg.Supabase)
	accountRepository := repository.NewSupabaseAccountRepository(logger, cfg.Supabase)
	activityRepository := repository.NewSupabaseActivityRepository(logger, cfg.Supabase)
	transactionRepository := repository.NewSupabaseTransactionRepository(logger, cfg.Supabase)
	idempotencyRepository := repository.NewSupabaseIdempotencyRepository(logger, cfg.Supabase)
	webhookEventRepository := repository.NewSupabaseWebhookEventRepository(logger, cfg.Supabase)
	balanceMovementRepository := repository.NewSupabaseBalanceMovementRepository(logger, cfg.Supabase)
	auditLogRepository := repository.NewSupabaseAuditLogRepository(logger, cfg.Supabase)
	asyncJobRepository := repository.NewSupabaseAsyncJobRepository(logger, cfg.Supabase)
	recipientRepository := repository.NewSupabaseRecipientRepository(logger, cfg.Supabase)
	supportRepository := repository.NewSupabaseSupportRepository(logger, cfg.Supabase)
	permissionHelper := service.NewPermissionHelper()
	verificationResolver := service.NewVerificationResolver(logger, profileRepository)
	idempotencyService := service.NewIdempotencyService(logger, idempotencyRepository)
	auditService := service.NewAuditService(logger, auditLogRepository)
	profileService := service.NewProfileService(logger, profileRepository, permissionHelper, verificationResolver, auditService)
	identityProvider, err := newIdentityProvider(logger, cfg)
	if err != nil {
		return err
	}
	identityVerificationService := service.NewIdentityVerificationService(
		logger,
		profileRepository,
		permissionHelper,
		verificationResolver,
		identityProvider,
		auditService,
	)
	accountService := service.NewAccountService(logger, accountRepository, permissionHelper, cfg.Features.EnableSeededAccountFallback)
	activityService := service.NewActivityService(logger, activityRepository, accountRepository, cfg.Features.EnableSeededAccountFallback)
	transactionService := service.NewTransactionService(
		logger,
		transactionRepository,
		transactionRepository,
		transactionRepository,
		accountRepository,
		recipientRepository,
		permissionHelper,
		activityService,
		verificationResolver,
		auditService,
	)
	transactionLifecycleService, ok := transactionService.(service.TransactionLifecycleUpdateService)
	if !ok {
		return errors.New("transaction lifecycle update service is not available")
	}
	webhookService := service.NewWebhookServiceWithAudit(
		logger,
		webhookEventRepository,
		transactionLifecycleService,
		auditService,
		service.NewWebhookProviders(cfg.Webhooks)...,
	)
	reconciliationService := service.NewReconciliationService(
		logger,
		transactionRepository,
		balanceMovementRepository,
		webhookEventRepository,
	)
	recipientService := service.NewRecipientService(logger, recipientRepository, permissionHelper, verificationResolver, auditService)
	supportService := service.NewSupportService(
		logger,
		supportRepository,
		supportRepository,
		transactionRepository,
		transactionRepository,
		transactionRepository,
		permissionHelper,
		activityService,
		verificationResolver,
		auditService,
	)
	router := handler.NewRouter(
		logger,
		healthService,
		authService,
		profileService,
		identityVerificationService,
		accountService,
		transactionService,
		idempotencyService,
		webhookService,
		activityService,
		recipientService,
		supportService,
		cfg.Features.EnableTransactionSimulation,
		rateLimiter,
	)
	transactionJobs := worker.NewTransactionJobs(
		logger,
		cfg.Worker,
		transactionRepository,
		transactionRepository,
		transactionRepository,
		transactionLifecycleService,
		asyncJobRepository,
		reconciliationService,
	)
	workerEngine := worker.NewEngine(logger, cfg.Worker.PollInterval, transactionJobs.Jobs()...)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: cfg.HTTP.ReadTimeout,
		ReadTimeout:       cfg.HTTP.ReadTimeout,
		WriteTimeout:      cfg.HTTP.WriteTimeout,
		IdleTimeout:       cfg.HTTP.IdleTimeout,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer func() {
		stop()
		if cfg.Worker.Enabled {
			workerEngine.Wait()
		}
	}()

	serverErrCh := make(chan error, 1)

	if cfg.Worker.Enabled {
		workerEngine.Start(ctx)
	}

	go func() {
		logger.Info(
			"starting api server",
			slog.String("address", server.Addr),
			slog.String("environment", cfg.Env),
			slog.String("version", cfg.Version),
		)

		err := server.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrCh <- err
			return
		}

		serverErrCh <- nil
	}()

	select {
	case err := <-serverErrCh:
		return err
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.HTTP.ShutdownTimeout)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		return err
	}

	logger.Info("api server stopped gracefully")

	return nil
}

func newIdentityProvider(logger *slog.Logger, cfg config.Config) (provider.IdentityVerifier, error) {
	switch cfg.Providers.KYCProvider {
	case "smileid":
		return provider.NewSmileIDClient(logger, cfg.Providers.SmileID)
	default:
		return nil, nil
	}
}
