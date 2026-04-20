package service

import (
	"context"
	"errors"
	"log/slog"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestAccountServiceListDisablesSeedFallbackWhenConfiguredOff(t *testing.T) {
	service := NewAccountService(slog.New(slog.NewTextHandler(nilWriter{}, nil)), fakeAccountRepository{
		listByUserID: func(ctx context.Context, userID string) ([]model.AccountRecord, error) {
			return nil, errors.New("boom")
		},
	}, fakePermissionHelper{
		canAccessAccount: true,
	}, false)

	_, err := service.ListAccounts(context.Background(), model.AuthenticatedUser{ID: "user_123"})
	if !errors.Is(err, ErrAccountsUnavailable) {
		t.Fatalf("expected accounts unavailable, got %v", err)
	}
}
