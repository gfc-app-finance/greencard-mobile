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
	AppName  string
	Env      string
	Version  string
	Port     string
	LogLevel string
	Supabase SupabaseConfig
	HTTP     HTTPConfig
}

type SupabaseConfig struct {
	URL                 string
	ServiceRoleKey      string
	PublishableKey      string
	Issuer              string
	JWKSURL             string
	UserInfoURL         string
	AuthTimeout         time.Duration
	JWKSCacheTTL        time.Duration
	RESTURL             string
	RESTTimeout         time.Duration
	ProfileTable        string
	AccountTable        string
	ActivityTable       string
	FundingTable        string
	TransferTable       string
	PaymentTable        string
	RecipientTable      string
	SupportTicketTable  string
	SupportMessageTable string
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
		Supabase: SupabaseConfig{
			URL:                 strings.TrimSpace(os.Getenv("SUPABASE_URL")),
			ServiceRoleKey:      strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
			PublishableKey:      strings.TrimSpace(os.Getenv("SUPABASE_PUBLISHABLE_KEY")),
			ProfileTable:        getEnv("SUPABASE_PROFILE_TABLE", "profiles"),
			AccountTable:        getEnv("SUPABASE_ACCOUNT_TABLE", "accounts"),
			ActivityTable:       getEnv("SUPABASE_ACTIVITY_TABLE", "activities"),
			FundingTable:        getEnv("SUPABASE_FUNDING_TABLE", "funding_transactions"),
			TransferTable:       getEnv("SUPABASE_TRANSFER_TABLE", "transfer_transactions"),
			PaymentTable:        getEnv("SUPABASE_PAYMENT_TABLE", "payment_transactions"),
			RecipientTable:      getEnv("SUPABASE_RECIPIENT_TABLE", "recipients"),
			SupportTicketTable:  getEnv("SUPABASE_SUPPORT_TICKET_TABLE", "support_tickets"),
			SupportMessageTable: getEnv("SUPABASE_SUPPORT_MESSAGE_TABLE", "support_ticket_messages"),
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

	if !isSafeIdentifier(cfg.Supabase.ProfileTable) {
		return fmt.Errorf("invalid SUPABASE_PROFILE_TABLE %q", cfg.Supabase.ProfileTable)
	}

	if !isSafeIdentifier(cfg.Supabase.AccountTable) {
		return fmt.Errorf("invalid SUPABASE_ACCOUNT_TABLE %q", cfg.Supabase.AccountTable)
	}

	if !isSafeIdentifier(cfg.Supabase.ActivityTable) {
		return fmt.Errorf("invalid SUPABASE_ACTIVITY_TABLE %q", cfg.Supabase.ActivityTable)
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
