package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrIdempotencyUnavailable = errors.New("idempotency unavailable")
	ErrIdempotencyInProgress  = errors.New("idempotency in progress")
	ErrIdempotencyKeyConflict = errors.New("idempotency key conflict")
)

type IdempotencyExecution func(ctx context.Context) (statusCode int, payload any)

type IdempotencyResult struct {
	StatusCode int
	Payload    any
	Body       []byte
	Replayed   bool
}

type IdempotencyService interface {
	Execute(ctx context.Context, userID, operation, key string, requestBody []byte, execute IdempotencyExecution) (IdempotencyResult, error)
}

type DefaultIdempotencyService struct {
	logger     *slog.Logger
	repository repository.IdempotencyRepository
}

func NewIdempotencyService(logger *slog.Logger, repository repository.IdempotencyRepository) IdempotencyService {
	return &DefaultIdempotencyService{
		logger:     logger,
		repository: repository,
	}
}

func (s *DefaultIdempotencyService) Execute(ctx context.Context, userID, operation, key string, requestBody []byte, execute IdempotencyExecution) (IdempotencyResult, error) {
	key = strings.TrimSpace(key)
	if key == "" {
		statusCode, payload := execute(ctx)
		return IdempotencyResult{StatusCode: statusCode, Payload: payload}, nil
	}

	requestHash := hashRequestBody(requestBody)
	reserved, replay, err := s.reserve(ctx, userID, operation, key, requestHash)
	if err != nil {
		return IdempotencyResult{}, err
	}
	if replay != nil {
		return *replay, nil
	}

	statusCode, payload := execute(ctx)
	if !reserved {
		return IdempotencyResult{StatusCode: statusCode, Payload: payload}, nil
	}

	if statusCode < 200 || statusCode >= 300 {
		if err := s.repository.Delete(ctx, userID, operation, key); err != nil {
			s.logger.Warn("failed to clear idempotency reservation after non-success response", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", err.Error()))
		}
		return IdempotencyResult{StatusCode: statusCode, Payload: payload}, nil
	}

	encodedPayload, err := json.Marshal(payload)
	if err != nil {
		if deleteErr := s.repository.Delete(ctx, userID, operation, key); deleteErr != nil {
			s.logger.Warn("failed to clear idempotency reservation after encode failure", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", deleteErr.Error()))
		}
		return IdempotencyResult{}, ErrIdempotencyUnavailable
	}

	if _, err := s.repository.UpdateResponse(ctx, userID, operation, key, statusCode, encodedPayload); err != nil {
		s.logger.Warn("failed to persist idempotency response", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", err.Error()))
		if deleteErr := s.repository.Delete(ctx, userID, operation, key); deleteErr != nil {
			s.logger.Warn("failed to clear idempotency reservation after persistence failure", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", deleteErr.Error()))
		}
	}

	return IdempotencyResult{
		StatusCode: statusCode,
		Payload:    payload,
		Body:       encodedPayload,
	}, nil
}

func (s *DefaultIdempotencyService) reserve(ctx context.Context, userID, operation, key, requestHash string) (bool, *IdempotencyResult, error) {
	_, err := s.repository.Create(ctx, model.IdempotencyRecord{
		UserID:         userID,
		Operation:      operation,
		IdempotencyKey: key,
		RequestHash:    requestHash,
	})
	if err == nil {
		return true, nil, nil
	}

	if !errors.Is(err, repository.ErrIdempotencyConflict) {
		s.logger.Error("failed to reserve idempotency key", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", err.Error()))
		return false, nil, ErrIdempotencyUnavailable
	}

	record, found, err := s.repository.GetByKey(ctx, userID, operation, key)
	if err != nil {
		s.logger.Error("failed to fetch conflicting idempotency key", slog.String("user_id", userID), slog.String("operation", operation), slog.String("error", err.Error()))
		return false, nil, ErrIdempotencyUnavailable
	}
	if !found {
		return false, nil, ErrIdempotencyUnavailable
	}
	if record.RequestHash != requestHash {
		return false, nil, ErrIdempotencyKeyConflict
	}
	if record.ResponseStatus == nil || len(record.ResponseBody) == 0 {
		return false, nil, ErrIdempotencyInProgress
	}

	return false, &IdempotencyResult{
		StatusCode: *record.ResponseStatus,
		Body:       append([]byte(nil), record.ResponseBody...),
		Replayed:   true,
	}, nil
}

func hashRequestBody(requestBody []byte) string {
	sum := sha256.Sum256(requestBody)
	return hex.EncodeToString(sum[:])
}
