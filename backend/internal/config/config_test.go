package config

import (
	"strings"
	"testing"
)

func TestLoadRejectsProductionWithDevVersion(t *testing.T) {
	setBaseConfigEnv(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("APP_VERSION", "dev")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "APP_VERSION") {
		t.Fatalf("expected production APP_VERSION validation error, got %v", err)
	}
}

func TestLoadRejectsProductionWithRateLimitDisabled(t *testing.T) {
	setBaseConfigEnv(t)
	t.Setenv("APP_ENV", "production")
	t.Setenv("APP_VERSION", "2026.04.22")
	t.Setenv("RATE_LIMIT_ENABLED", "false")

	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "RATE_LIMIT_ENABLED") {
		t.Fatalf("expected production rate limit validation error, got %v", err)
	}
}

func TestLoadAcceptsStagingConfigForSmokeChecks(t *testing.T) {
	setBaseConfigEnv(t)
	t.Setenv("APP_ENV", "staging")
	t.Setenv("APP_VERSION", "ci")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected staging config to load, got %v", err)
	}
	if cfg.RateLimit.GlobalRequests <= 0 {
		t.Fatalf("expected rate limit defaults to be populated")
	}
}

func setBaseConfigEnv(t *testing.T) {
	t.Helper()

	t.Setenv("SUPABASE_URL", "https://example.supabase.co")
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")
	t.Setenv("APP_ENV", "test")
	t.Setenv("APP_VERSION", "test")
	t.Setenv("LOG_LEVEL", "info")
	t.Setenv("KYC_PROVIDER", "disabled")
	t.Setenv("RATE_LIMIT_ENABLED", "true")
	t.Setenv("ENABLE_TRANSACTION_SIMULATION", "false")
	t.Setenv("WORKER_ENABLE_SIMULATION_PROGRESSION", "false")
}
