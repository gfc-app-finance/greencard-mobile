package service

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

func TestIdempotencyExecuteBypassesRepositoryWithoutKey(t *testing.T) {
	service := NewIdempotencyService(nil, fakeIdempotencyRepository{})

	result, err := service.Execute(context.Background(), "user_123", "transactions.funding.create", "", []byte(`{"amount":100}`), func(ctx context.Context) (int, any) {
		return 201, map[string]any{"ok": true}
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if result.StatusCode != 201 || result.Replayed {
		t.Fatalf("unexpected idempotency result: %#v", result)
	}
}

func TestIdempotencyExecuteReplaysStoredSuccess(t *testing.T) {
	statusCode := 201
	service := NewIdempotencyService(nil, fakeIdempotencyRepository{
		create: func(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error) {
			return model.IdempotencyRecord{}, repository.ErrIdempotencyConflict
		},
		getByKey: func(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error) {
			return model.IdempotencyRecord{
				UserID:         userID,
				Operation:      operation,
				IdempotencyKey: key,
				RequestHash:    hashRequestBody([]byte(`{"amount":100}`)),
				ResponseStatus: &statusCode,
				ResponseBody:   json.RawMessage(`{"transaction":{"id":"funding_123"}}`),
			}, true, nil
		},
	})

	result, err := service.Execute(context.Background(), "user_123", "transactions.funding.create", "key-123", []byte(`{"amount":100}`), func(ctx context.Context) (int, any) {
		t.Fatal("expected replay to avoid executing callback")
		return 0, nil
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if !result.Replayed || result.StatusCode != 201 || string(result.Body) != `{"transaction":{"id":"funding_123"}}` {
		t.Fatalf("unexpected replay result: %#v", result)
	}
}

func TestIdempotencyExecuteRejectsMismatchedRequestHash(t *testing.T) {
	service := NewIdempotencyService(nil, fakeIdempotencyRepository{
		create: func(ctx context.Context, record model.IdempotencyRecord) (model.IdempotencyRecord, error) {
			return model.IdempotencyRecord{}, repository.ErrIdempotencyConflict
		},
		getByKey: func(ctx context.Context, userID, operation, key string) (model.IdempotencyRecord, bool, error) {
			return model.IdempotencyRecord{
				UserID:         userID,
				Operation:      operation,
				IdempotencyKey: key,
				RequestHash:    hashRequestBody([]byte(`{"amount":999}`)),
			}, true, nil
		},
	})

	_, err := service.Execute(context.Background(), "user_123", "transactions.funding.create", "key-123", []byte(`{"amount":100}`), func(ctx context.Context) (int, any) {
		return 201, map[string]any{"ok": true}
	})
	if !errors.Is(err, ErrIdempotencyKeyConflict) {
		t.Fatalf("expected idempotency key conflict, got %v", err)
	}
}
