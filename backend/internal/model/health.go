package model

import "time"

type HealthStatus struct {
	Status        string    `json:"status"`
	Service       string    `json:"service"`
	Environment   string    `json:"environment"`
	Version       string    `json:"version"`
	Timestamp     time.Time `json:"timestamp"`
	UptimeSeconds int64     `json:"uptime_seconds"`
}

type ReadinessStatus struct {
	Status        string           `json:"status"`
	Service       string           `json:"service"`
	Environment   string           `json:"environment"`
	Version       string           `json:"version"`
	Timestamp     time.Time        `json:"timestamp"`
	UptimeSeconds int64            `json:"uptime_seconds"`
	Checks        []ReadinessCheck `json:"checks"`
}

type ReadinessCheck struct {
	Name     string `json:"name"`
	Status   string `json:"status"`
	Critical bool   `json:"critical"`
	Detail   string `json:"detail,omitempty"`
}
