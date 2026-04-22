package service

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

const (
	auditRedactedValue = "[redacted]"
	auditMaxStringLen  = 180
	auditMaxListLen    = 10
)

type AuditRecorder interface {
	Record(ctx context.Context, event model.AuditEvent) error
}

type DefaultAuditService struct {
	logger     *slog.Logger
	repository repository.AuditLogRepository
}

func NewAuditService(logger *slog.Logger, repository repository.AuditLogRepository) AuditRecorder {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	return &DefaultAuditService{
		logger:     logger,
		repository: repository,
	}
}

func (s *DefaultAuditService) Record(ctx context.Context, event model.AuditEvent) error {
	if s == nil || s.repository == nil {
		return nil
	}

	action := event.Action
	entityType := event.EntityType
	source := event.Source
	if source == "" {
		source = model.AuditSourceSystem
	}

	record := model.AuditLogRecord{
		ActorUserID:     optionalAuditString(event.ActorUserID),
		Action:          action,
		EntityType:      entityType,
		EntityID:        optionalAuditString(event.EntityID),
		Source:          source,
		MetadataSummary: SanitizeAuditMetadata(event.Metadata),
		RequestID:       optionalAuditString(event.RequestID),
		IPSummary:       optionalAuditString(event.IPSummary),
		Provider:        optionalAuditString(event.Provider),
		CorrelationID:   optionalAuditString(event.CorrelationID),
	}

	_, err := s.repository.Create(ctx, record)
	return err
}

func SanitizeAuditMetadata(metadata map[string]any) map[string]any {
	if len(metadata) == 0 {
		return map[string]any{}
	}

	summary := make(map[string]any, len(metadata))
	for key, value := range metadata {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}

		summary[key] = sanitizeAuditValue(key, value, 0)
	}

	return summary
}

func sanitizeAuditValue(key string, value any, depth int) any {
	if isSensitiveAuditKey(key) {
		return auditRedactedValue
	}
	if depth > 3 {
		return "[truncated]"
	}

	switch typed := value.(type) {
	case nil:
		return nil
	case string:
		return truncateAuditString(strings.TrimSpace(typed))
	case *string:
		if typed == nil {
			return nil
		}
		return sanitizeAuditValue(key, *typed, depth)
	case bool:
		return typed
	case int:
		return typed
	case int64:
		return typed
	case float64:
		return typed
	case fmt.Stringer:
		return truncateAuditString(typed.String())
	case map[string]any:
		return sanitizeAuditMap(typed, depth+1)
	case map[string]string:
		converted := make(map[string]any, len(typed))
		for childKey, childValue := range typed {
			converted[childKey] = childValue
		}
		return sanitizeAuditMap(converted, depth+1)
	case []any:
		return sanitizeAuditList(typed, depth+1)
	case []string:
		converted := make([]any, 0, len(typed))
		for _, item := range typed {
			converted = append(converted, item)
		}
		return sanitizeAuditList(converted, depth+1)
	default:
		return truncateAuditString(fmt.Sprint(value))
	}
}

func sanitizeAuditMap(metadata map[string]any, depth int) map[string]any {
	summary := make(map[string]any, len(metadata))
	for key, value := range metadata {
		key = strings.TrimSpace(key)
		if key == "" {
			continue
		}
		summary[key] = sanitizeAuditValue(key, value, depth)
	}

	return summary
}

func sanitizeAuditList(values []any, depth int) []any {
	limit := len(values)
	if limit > auditMaxListLen {
		limit = auditMaxListLen
	}

	summary := make([]any, 0, limit)
	for i := 0; i < limit; i++ {
		summary = append(summary, sanitizeAuditValue("", values[i], depth))
	}
	if len(values) > auditMaxListLen {
		summary = append(summary, "[truncated]")
	}

	return summary
}

func isSensitiveAuditKey(key string) bool {
	key = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(key), "-", "_"))
	sensitiveParts := []string{
		"token",
		"secret",
		"password",
		"authorization",
		"api_key",
		"apikey",
		"id_number",
		"idnumber",
		"account_number",
		"accountnumber",
		"iban",
		"routing_number",
		"sort_code",
		"swift_code",
		"bvn",
		"nin",
		"card_number",
		"cvv",
		"pin",
		"otp",
		"refresh",
	}

	for _, sensitivePart := range sensitiveParts {
		if strings.Contains(key, sensitivePart) {
			return true
		}
	}

	return false
}

func truncateAuditString(value string) string {
	if len(value) <= auditMaxStringLen {
		return value
	}

	return value[:auditMaxStringLen] + "...[truncated]"
}

func optionalAuditString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return &value
}
