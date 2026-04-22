package service

import (
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type HealthService struct {
	appName         string
	env             string
	version         string
	startedAt       time.Time
	readinessChecks []model.ReadinessCheck
}

func NewHealthService(appName, env, version string, readinessChecks ...model.ReadinessCheck) HealthService {
	return HealthService{
		appName:         appName,
		env:             env,
		version:         version,
		startedAt:       time.Now().UTC(),
		readinessChecks: readinessChecks,
	}
}

func (s HealthService) Status() model.HealthStatus {
	now := time.Now().UTC()
	return model.HealthStatus{
		Status:        "ok",
		Service:       s.appName,
		Environment:   s.env,
		Version:       s.version,
		Timestamp:     now,
		UptimeSeconds: int64(now.Sub(s.startedAt).Seconds()),
	}
}

func (s HealthService) Readiness() model.ReadinessStatus {
	now := time.Now().UTC()
	checks := append([]model.ReadinessCheck(nil), s.readinessChecks...)
	if len(checks) == 0 {
		checks = append(checks, model.ReadinessCheck{
			Name:     "configuration",
			Status:   "ok",
			Critical: true,
			Detail:   "configuration loaded",
		})
	}

	status := "ready"
	for _, check := range checks {
		if check.Critical && check.Status != "ok" {
			status = "not_ready"
			break
		}
	}

	return model.ReadinessStatus{
		Status:        status,
		Service:       s.appName,
		Environment:   s.env,
		Version:       s.version,
		Timestamp:     now,
		UptimeSeconds: int64(now.Sub(s.startedAt).Seconds()),
		Checks:        checks,
	}
}
