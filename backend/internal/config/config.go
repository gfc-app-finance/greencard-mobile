package config

import (
	"bufio"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	AppName   string
	Env       string
	Version   string
	Port      string
	LogLevel  string
	Features  FeatureFlags
	Supabase  SupabaseConfig
	Webhooks  WebhookConfig
	Providers ProviderConfig
	Worker    WorkerConfig
	RateLimit RateLimitConfig
	HTTP      HTTPConfig
}

type FeatureFlags struct {
	EnableSeededAccountFallback bool
	EnableTransactionSimulation bool
}

type SupabaseConfig struct {
	URL                  string
	ServiceRoleKey       string
	PublishableKey       string
	Issuer               string
	JWKSURL              string
	UserInfoURL          string
	AuthTimeout          time.Duration
	JWKSCacheTTL         time.Duration
	RESTURL              string
	RESTTimeout          time.Duration
	ProfileTable         string
	AccountTable         string
	ActivityTable        string
	BalanceMovementTable string
	AuditLogTable        string
	WebhookEventTable    string
	FundingTable         string
	TransferTable        string
	PaymentTable         string
	IdempotencyTable     string
	RecipientTable       string
	SupportTicketTable   string
	SupportMessageTable  string
}

type WebhookConfig struct {
	SandboxPaySecret   string
	SignatureTolerance time.Duration
}

type ProviderConfig struct {
	KYCProvider string
	SmileID     SmileIDConfig
}

type SmileIDConfig struct {
	Environment      string
	PartnerID        string
	APIKey           string
	BaseURL          string
	SourceSDKVersion string
	Timeout          time.Duration
}

type WorkerConfig struct {
	Enabled                     bool
	EnableSimulationProgression bool
	PollInterval                time.Duration
	BatchSize                   int
	JobLockTTL                  time.Duration
	MaxAttempts                 int
	ReconciliationAge           time.Duration
	RetryEvaluationAge          time.Duration
	FundingPendingTimeout       time.Duration
	TransferConvertingTimeout   time.Duration
	PaymentSubmittedTimeout     time.Duration
	PaymentUnderReviewTimeout   time.Duration
	PaymentProcessingTimeout    time.Duration
}

type RateLimitConfig struct {
	Enabled               bool
	TrustProxyHeaders     bool
	GlobalRequests        int
	GlobalWindow          time.Duration
	AuthenticatedRequests int
	AuthenticatedWindow   time.Duration
	SensitiveRequests     int
	SensitiveWindow       time.Duration
	WebhookRequests       int
	WebhookWindow         time.Duration
}

type HTTPConfig struct {
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	IdleTimeout     time.Duration
	ShutdownTimeout time.Duration
}

func Load() (Config, error) {
	_ = loadDotEnv(".env")

	cfg := Config{
		AppName:  getEnv("APP_NAME", "greencard-api"),
		Env:      getEnv("APP_ENV", "development"),
		Version:  getEnv("APP_VERSION", "dev"),
		Port:     getEnv("PORT", "8080"),
		LogLevel: getEnv("LOG_LEVEL", "info"),
		Features: FeatureFlags{
			EnableSeededAccountFallback: getBoolEnv("ENABLE_SEEDED_ACCOUNT_FALLBACK", false),
			EnableTransactionSimulation: getBoolEnv("ENABLE_TRANSACTION_SIMULATION", cfgDefaultTransactionSimulation(getEnv("APP_ENV", "development"))),
		},
		Supabase: SupabaseConfig{
			URL:                  strings.TrimSpace(os.Getenv("SUPABASE_URL")),
			ServiceRoleKey:       strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
			PublishableKey:       strings.TrimSpace(os.Getenv("SUPABASE_PUBLISHABLE_KEY")),
			ProfileTable:         getEnv("SUPABASE_PROFILE_TABLE", "profiles"),
			AccountTable:         getEnv("SUPABASE_ACCOUNT_TABLE", "accounts"),
			ActivityTable:        getEnv("SUPABASE_ACTIVITY_TABLE", "activities"),
			BalanceMovementTable: getEnv("SUPABASE_BALANCE_MOVEMENT_TABLE", "account_balance_movements"),
			AuditLogTable:        getEnv("SUPABASE_AUDIT_LOG_TABLE", "audit_logs"),
			WebhookEventTable:    getEnv("SUPABASE_WEBHOOK_EVENT_TABLE", "provider_webhook_events"),
			FundingTable:         getEnv("SUPABASE_FUNDING_TABLE", "funding_transactions"),
			TransferTable:        getEnv("SUPABASE_TRANSFER_TABLE", "transfer_transactions"),
			PaymentTable:         getEnv("SUPABASE_PAYMENT_TABLE", "payment_transactions"),
			IdempotencyTable:     getEnv("SUPABASE_IDEMPOTENCY_TABLE", "idempotency_keys"),
			RecipientTable:       getEnv("SUPABASE_RECIPIENT_TABLE", "recipients"),
			SupportTicketTable:   getEnv("SUPABASE_SUPPORT_TICKET_TABLE", "support_tickets"),
			SupportMessageTable:  getEnv("SUPABASE_SUPPORT_MESSAGE_TABLE", "support_ticket_messages"),
		},
		Webhooks: WebhookConfig{
			SandboxPaySecret: strings.TrimSpace(os.Getenv("WEBHOOK_SANDBOXPAY_SECRET")),
		},
		Providers: ProviderConfig{
			KYCProvider: strings.ToLower(getEnv("KYC_PROVIDER", "disabled")),
			SmileID: SmileIDConfig{
				Environment:      strings.ToLower(getEnv("SMILE_ID_ENVIRONMENT", "sandbox")),
				PartnerID:        strings.TrimSpace(os.Getenv("SMILE_ID_PARTNER_ID")),
				APIKey:           strings.TrimSpace(os.Getenv("SMILE_ID_API_KEY")),
				BaseURL:          strings.TrimRight(strings.TrimSpace(os.Getenv("SMILE_ID_BASE_URL")), "/"),
				SourceSDKVersion: getEnv("SMILE_ID_SOURCE_SDK_VERSION", "greencard-go-1.0"),
			},
		},
	}

	readTimeout, err := parseDurationEnv("HTTP_READ_TIMEOUT", 10*time.Second)
	if err != nil {
		return Config{}, err
	}

	writeTimeout, err := parseDurationEnv("HTTP_WRITE_TIMEOUT", 15*time.Second)
	if err != nil {
		return Config{}, err
	}

	idleTimeout, err := parseDurationEnv("HTTP_IDLE_TIMEOUT", 60*time.Second)
	if err != nil {
		return Config{}, err
	}

	shutdownTimeout, err := parseDurationEnv("HTTP_SHUTDOWN_TIMEOUT", 10*time.Second)
	if err != nil {
		return Config{}, err
	}

	authTimeout, err := parseDurationEnv("SUPABASE_AUTH_TIMEOUT", 5*time.Second)
	if err != nil {
		return Config{}, err
	}

	jwksCacheTTL, err := parseDurationEnv("SUPABASE_JWKS_CACHE_TTL", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}

	restTimeout, err := parseDurationEnv("SUPABASE_REST_TIMEOUT", 5*time.Second)
	if err != nil {
		return Config{}, err
	}

	webhookSignatureTolerance, err := parseDurationEnv("WEBHOOK_SIGNATURE_TOLERANCE", 5*time.Minute)
	if err != nil {
		return Config{}, err
	}

	smileIDTimeout, err := parseDurationEnv("SMILE_ID_TIMEOUT", 10*time.Second)
	if err != nil {
		return Config{}, err
	}

	workerPollInterval, err := parseDurationEnv("WORKER_POLL_INTERVAL", 15*time.Second)
	if err != nil {
		return Config{}, err
	}

	workerBatchSize, err := parsePositiveIntEnv("WORKER_BATCH_SIZE", 100)
	if err != nil {
		return Config{}, err
	}

	workerJobLockTTL, err := parseDurationEnv("WORKER_JOB_LOCK_TTL", 2*time.Minute)
	if err != nil {
		return Config{}, err
	}

	workerMaxAttempts, err := parsePositiveIntEnv("WORKER_MAX_ATTEMPTS", 5)
	if err != nil {
		return Config{}, err
	}

	workerReconciliationAge, err := parseDurationEnv("WORKER_RECONCILIATION_AGE", 2*time.Minute)
	if err != nil {
		return Config{}, err
	}

	workerRetryEvaluationAge, err := parseDurationEnv("WORKER_RETRY_EVALUATION_AGE", 2*time.Minute)
	if err != nil {
		return Config{}, err
	}

	fundingPendingTimeout, err := parseDurationEnv("WORKER_FUNDING_PENDING_TIMEOUT", 15*time.Minute)
	if err != nil {
		return Config{}, err
	}

	transferConvertingTimeout, err := parseDurationEnv("WORKER_TRANSFER_CONVERTING_TIMEOUT", 20*time.Minute)
	if err != nil {
		return Config{}, err
	}

	paymentSubmittedTimeout, err := parseDurationEnv("WORKER_PAYMENT_SUBMITTED_TIMEOUT", 10*time.Minute)
	if err != nil {
		return Config{}, err
	}

	paymentUnderReviewTimeout, err := parseDurationEnv("WORKER_PAYMENT_UNDER_REVIEW_TIMEOUT", 20*time.Minute)
	if err != nil {
		return Config{}, err
	}

	paymentProcessingTimeout, err := parseDurationEnv("WORKER_PAYMENT_PROCESSING_TIMEOUT", 30*time.Minute)
	if err != nil {
		return Config{}, err
	}

	rateLimitGlobalRequests, err := parsePositiveIntEnv("RATE_LIMIT_GLOBAL_REQUESTS", 300)
	if err != nil {
		return Config{}, err
	}

	rateLimitAuthenticatedRequests, err := parsePositiveIntEnv("RATE_LIMIT_AUTHENTICATED_REQUESTS", 900)
	if err != nil {
		return Config{}, err
	}

	rateLimitSensitiveRequests, err := parsePositiveIntEnv("RATE_LIMIT_SENSITIVE_REQUESTS", 20)
	if err != nil {
		return Config{}, err
	}

	rateLimitWebhookRequests, err := parsePositiveIntEnv("RATE_LIMIT_WEBHOOK_REQUESTS", 120)
	if err != nil {
		return Config{}, err
	}

	rateLimitGlobalWindow, err := parseDurationEnv("RATE_LIMIT_GLOBAL_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}

	rateLimitAuthenticatedWindow, err := parseDurationEnv("RATE_LIMIT_AUTHENTICATED_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}

	rateLimitSensitiveWindow, err := parseDurationEnv("RATE_LIMIT_SENSITIVE_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}

	rateLimitWebhookWindow, err := parseDurationEnv("RATE_LIMIT_WEBHOOK_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}

	cfg.HTTP = HTTPConfig{
		ReadTimeout:     readTimeout,
		WriteTimeout:    writeTimeout,
		IdleTimeout:     idleTimeout,
		ShutdownTimeout: shutdownTimeout,
	}

	supabaseURL := strings.TrimRight(cfg.Supabase.URL, "/")
	cfg.Supabase.URL = supabaseURL
	cfg.Supabase.Issuer = supabaseURL + "/auth/v1"
	cfg.Supabase.JWKSURL = cfg.Supabase.Issuer + "/.well-known/jwks.json"
	cfg.Supabase.UserInfoURL = cfg.Supabase.Issuer + "/user"
	cfg.Supabase.RESTURL = supabaseURL + "/rest/v1"
	cfg.Supabase.AuthTimeout = authTimeout
	cfg.Supabase.JWKSCacheTTL = jwksCacheTTL
	cfg.Supabase.RESTTimeout = restTimeout
	cfg.Webhooks.SignatureTolerance = webhookSignatureTolerance
	cfg.Providers.SmileID.Timeout = smileIDTimeout
	if cfg.Providers.SmileID.BaseURL == "" {
		cfg.Providers.SmileID.BaseURL = smileIDBaseURL(cfg.Providers.SmileID.Environment)
	}
	cfg.Worker = WorkerConfig{
		Enabled:                     getBoolEnv("WORKER_ENABLED", cfgDefaultWorkerEnabled(cfg.Env)),
		EnableSimulationProgression: getBoolEnv("WORKER_ENABLE_SIMULATION_PROGRESSION", cfg.Features.EnableTransactionSimulation),
		PollInterval:                workerPollInterval,
		BatchSize:                   workerBatchSize,
		JobLockTTL:                  workerJobLockTTL,
		MaxAttempts:                 workerMaxAttempts,
		ReconciliationAge:           workerReconciliationAge,
		RetryEvaluationAge:          workerRetryEvaluationAge,
		FundingPendingTimeout:       fundingPendingTimeout,
		TransferConvertingTimeout:   transferConvertingTimeout,
		PaymentSubmittedTimeout:     paymentSubmittedTimeout,
		PaymentUnderReviewTimeout:   paymentUnderReviewTimeout,
		PaymentProcessingTimeout:    paymentProcessingTimeout,
	}
	cfg.RateLimit = RateLimitConfig{
		Enabled:               getBoolEnv("RATE_LIMIT_ENABLED", true),
		TrustProxyHeaders:     getBoolEnv("RATE_LIMIT_TRUST_PROXY_HEADERS", false),
		GlobalRequests:        rateLimitGlobalRequests,
		GlobalWindow:          rateLimitGlobalWindow,
		AuthenticatedRequests: rateLimitAuthenticatedRequests,
		AuthenticatedWindow:   rateLimitAuthenticatedWindow,
		SensitiveRequests:     rateLimitSensitiveRequests,
		SensitiveWindow:       rateLimitSensitiveWindow,
		WebhookRequests:       rateLimitWebhookRequests,
		WebhookWindow:         rateLimitWebhookWindow,
	}

	if err := validate(cfg); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func validate(cfg Config) error {
	var missing []string

	if cfg.Supabase.URL == "" {
		missing = append(missing, "SUPABASE_URL")
	}

	if cfg.Supabase.ServiceRoleKey == "" {
		missing = append(missing, "SUPABASE_SERVICE_ROLE_KEY")
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	if _, err := url.ParseRequestURI(cfg.Supabase.URL); err != nil {
		return fmt.Errorf("invalid SUPABASE_URL: %w", err)
	}

	if _, err := url.ParseRequestURI(cfg.Supabase.Issuer); err != nil {
		return fmt.Errorf("invalid Supabase issuer: %w", err)
	}

	if _, err := url.ParseRequestURI(cfg.Supabase.JWKSURL); err != nil {
		return fmt.Errorf("invalid Supabase JWKS URL: %w", err)
	}

	if _, err := url.ParseRequestURI(cfg.Supabase.UserInfoURL); err != nil {
		return fmt.Errorf("invalid Supabase user info URL: %w", err)
	}

	if _, err := url.ParseRequestURI(cfg.Supabase.RESTURL); err != nil {
		return fmt.Errorf("invalid Supabase REST URL: %w", err)
	}

	if !isAllowedValue(cfg.Env, "local", "development", "staging", "production", "test") {
		return fmt.Errorf("invalid APP_ENV %q", cfg.Env)
	}

	if cfg.Env == "production" && cfg.Features.EnableTransactionSimulation {
		return errors.New("ENABLE_TRANSACTION_SIMULATION cannot be enabled in production")
	}

	if cfg.Env == "production" && cfg.Worker.EnableSimulationProgression {
		return errors.New("WORKER_ENABLE_SIMULATION_PROGRESSION cannot be enabled in production")
	}

	if !isAllowedValue(strings.ToLower(cfg.LogLevel), "debug", "info", "warn", "error") {
		return fmt.Errorf("invalid LOG_LEVEL %q", cfg.LogLevel)
	}

	port, err := strconv.Atoi(cfg.Port)
	if err != nil || port < 1 || port > 65535 {
		return fmt.Errorf("invalid PORT %q", cfg.Port)
	}

	if cfg.HTTP.ReadTimeout <= 0 || cfg.HTTP.WriteTimeout <= 0 || cfg.HTTP.IdleTimeout <= 0 || cfg.HTTP.ShutdownTimeout <= 0 {
		return errors.New("http timeout values must be greater than zero")
	}

	if cfg.Supabase.AuthTimeout <= 0 || cfg.Supabase.JWKSCacheTTL <= 0 || cfg.Supabase.RESTTimeout <= 0 {
		return errors.New("supabase auth timeout values must be greater than zero")
	}

	if cfg.Webhooks.SignatureTolerance <= 0 {
		return errors.New("webhook signature tolerance must be greater than zero")
	}

	if !isAllowedValue(cfg.Providers.KYCProvider, "disabled", "smileid") {
		return fmt.Errorf("invalid KYC_PROVIDER %q", cfg.Providers.KYCProvider)
	}

	if !isAllowedValue(cfg.Providers.SmileID.Environment, "sandbox", "production") {
		return fmt.Errorf("invalid SMILE_ID_ENVIRONMENT %q", cfg.Providers.SmileID.Environment)
	}

	if cfg.Providers.SmileID.Timeout <= 0 {
		return errors.New("SMILE_ID_TIMEOUT must be greater than zero")
	}

	if cfg.Providers.KYCProvider == "smileid" {
		if cfg.Providers.SmileID.PartnerID == "" {
			missing = append(missing, "SMILE_ID_PARTNER_ID")
		}

		if cfg.Providers.SmileID.APIKey == "" {
			missing = append(missing, "SMILE_ID_API_KEY")
		}

		if cfg.Providers.SmileID.BaseURL == "" {
			missing = append(missing, "SMILE_ID_BASE_URL")
		}

		if len(missing) > 0 {
			return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
		}

		if _, err := url.ParseRequestURI(cfg.Providers.SmileID.BaseURL); err != nil {
			return fmt.Errorf("invalid SMILE_ID_BASE_URL: %w", err)
		}
	}

	if cfg.Worker.PollInterval <= 0 ||
		cfg.Worker.BatchSize <= 0 ||
		cfg.Worker.JobLockTTL <= 0 ||
		cfg.Worker.MaxAttempts <= 0 ||
		cfg.Worker.ReconciliationAge <= 0 ||
		cfg.Worker.RetryEvaluationAge <= 0 ||
		cfg.Worker.FundingPendingTimeout <= 0 ||
		cfg.Worker.TransferConvertingTimeout <= 0 ||
		cfg.Worker.PaymentSubmittedTimeout <= 0 ||
		cfg.Worker.PaymentUnderReviewTimeout <= 0 ||
		cfg.Worker.PaymentProcessingTimeout <= 0 {
		return errors.New("worker configuration values must be greater than zero")
	}

	if cfg.RateLimit.Enabled &&
		(cfg.RateLimit.GlobalRequests <= 0 ||
			cfg.RateLimit.AuthenticatedRequests <= 0 ||
			cfg.RateLimit.SensitiveRequests <= 0 ||
			cfg.RateLimit.WebhookRequests <= 0 ||
			cfg.RateLimit.GlobalWindow <= 0 ||
			cfg.RateLimit.AuthenticatedWindow <= 0 ||
			cfg.RateLimit.SensitiveWindow <= 0 ||
			cfg.RateLimit.WebhookWindow <= 0) {
		return errors.New("rate limit configuration values must be greater than zero when rate limiting is enabled")
	}

	if !isSafeIdentifier(cfg.Supabase.ProfileTable) {
		return fmt.Errorf("invalid SUPABASE_PROFILE_TABLE %q", cfg.Supabase.ProfileTable)
	}

	if !isSafeIdentifier(cfg.Supabase.AccountTable) {
		return fmt.Errorf("invalid SUPABASE_ACCOUNT_TABLE %q", cfg.Supabase.AccountTable)
	}

	if !isSafeIdentifier(cfg.Supabase.ActivityTable) {
		return fmt.Errorf("invalid SUPABASE_ACTIVITY_TABLE %q", cfg.Supabase.ActivityTable)
	}

	if !isSafeIdentifier(cfg.Supabase.BalanceMovementTable) {
		return fmt.Errorf("invalid SUPABASE_BALANCE_MOVEMENT_TABLE %q", cfg.Supabase.BalanceMovementTable)
	}

	if !isSafeIdentifier(cfg.Supabase.AuditLogTable) {
		return fmt.Errorf("invalid SUPABASE_AUDIT_LOG_TABLE %q", cfg.Supabase.AuditLogTable)
	}

	if !isSafeIdentifier(cfg.Supabase.WebhookEventTable) {
		return fmt.Errorf("invalid SUPABASE_WEBHOOK_EVENT_TABLE %q", cfg.Supabase.WebhookEventTable)
	}

	if !isSafeIdentifier(cfg.Supabase.FundingTable) {
		return fmt.Errorf("invalid SUPABASE_FUNDING_TABLE %q", cfg.Supabase.FundingTable)
	}

	if !isSafeIdentifier(cfg.Supabase.TransferTable) {
		return fmt.Errorf("invalid SUPABASE_TRANSFER_TABLE %q", cfg.Supabase.TransferTable)
	}

	if !isSafeIdentifier(cfg.Supabase.PaymentTable) {
		return fmt.Errorf("invalid SUPABASE_PAYMENT_TABLE %q", cfg.Supabase.PaymentTable)
	}

	if !isSafeIdentifier(cfg.Supabase.IdempotencyTable) {
		return fmt.Errorf("invalid SUPABASE_IDEMPOTENCY_TABLE %q", cfg.Supabase.IdempotencyTable)
	}

	if !isSafeIdentifier(cfg.Supabase.RecipientTable) {
		return fmt.Errorf("invalid SUPABASE_RECIPIENT_TABLE %q", cfg.Supabase.RecipientTable)
	}

	if !isSafeIdentifier(cfg.Supabase.SupportTicketTable) {
		return fmt.Errorf("invalid SUPABASE_SUPPORT_TICKET_TABLE %q", cfg.Supabase.SupportTicketTable)
	}

	if !isSafeIdentifier(cfg.Supabase.SupportMessageTable) {
		return fmt.Errorf("invalid SUPABASE_SUPPORT_MESSAGE_TABLE %q", cfg.Supabase.SupportMessageTable)
	}

	return nil
}

func parseDurationEnv(key string, defaultValue time.Duration) (time.Duration, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return defaultValue, nil
	}

	value, err := time.ParseDuration(raw)
	if err != nil {
		return 0, fmt.Errorf("invalid %s duration %q: %w", key, raw, err)
	}

	return value, nil
}

func getEnv(key, defaultValue string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return defaultValue
	}

	return value
}

func getBoolEnv(key string, defaultValue bool) bool {
	value := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if value == "" {
		return defaultValue
	}

	switch value {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return defaultValue
	}
}

func parsePositiveIntEnv(key string, defaultValue int) (int, error) {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return defaultValue, nil
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value <= 0 {
		return 0, fmt.Errorf("invalid %s integer %q", key, raw)
	}

	return value, nil
}

func cfgDefaultTransactionSimulation(env string) bool {
	switch strings.TrimSpace(strings.ToLower(env)) {
	case "production":
		return false
	default:
		return true
	}
}

func cfgDefaultWorkerEnabled(env string) bool {
	switch strings.TrimSpace(strings.ToLower(env)) {
	case "staging", "production":
		return true
	default:
		return false
	}
}

func smileIDBaseURL(environment string) string {
	switch strings.TrimSpace(strings.ToLower(environment)) {
	case "production":
		return "https://api.smileidentity.com"
	default:
		return "https://testapi.smileidentity.com"
	}
}

func isAllowedValue(value string, allowed ...string) bool {
	for _, item := range allowed {
		if value == item {
			return true
		}
	}

	return false
}

func isSafeIdentifier(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, character := range value {
		switch {
		case character >= 'a' && character <= 'z':
		case character >= 'A' && character <= 'Z':
		case character >= '0' && character <= '9':
		case character == '_':
		default:
			return false
		}
	}

	return true
}

func loadDotEnv(filePath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}

		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.Trim(strings.TrimSpace(parts[1]), `"'`)

		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, value)
		}
	}

	return scanner.Err()
}
