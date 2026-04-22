package service

import (
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestHealthServiceReadinessReportsReadyWhenCriticalChecksPass(t *testing.T) {
	service := NewHealthService("greencard-api", "test", "v1", model.ReadinessCheck{
		Name:     "configuration",
		Status:   "ok",
		Critical: true,
	})

	readiness := service.Readiness()
	if readiness.Status != "ready" {
		t.Fatalf("expected readiness status ready, got %q", readiness.Status)
	}
	if len(readiness.Checks) != 1 {
		t.Fatalf("expected one readiness check, got %d", len(readiness.Checks))
	}
}

func TestHealthServiceReadinessReportsNotReadyWhenCriticalCheckFails(t *testing.T) {
	service := NewHealthService("greencard-api", "test", "v1", model.ReadinessCheck{
		Name:     "configuration",
		Status:   "failed",
		Critical: true,
	})

	readiness := service.Readiness()
	if readiness.Status != "not_ready" {
		t.Fatalf("expected readiness status not_ready, got %q", readiness.Status)
	}
}
