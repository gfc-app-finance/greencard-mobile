package service

import (
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

type HealthService struct {
	appName string
	env     string
	version string
}

func NewHealthService(appName, env, version string) HealthService {
	return HealthService{
		appName: appName,
		env:     env,
		version: version,
	}
}

func (s HealthService) Status() model.HealthStatus {
	return model.HealthStatus{
		Status:      "ok",
		Service:     s.appName,
		Environment: s.env,
		Version:     s.version,
		Timestamp:   time.Now().UTC(),
	}
}
