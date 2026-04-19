package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrAccountsUnavailable = errors.New("accounts unavailable")
	ErrAccountNotFound     = errors.New("account not found")
)

type AccountService interface {
	ListAccounts(ctx context.Context, user model.AuthenticatedUser) (model.AccountListResponse, error)
	GetAccount(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error)
}

type AccountSeedProvider interface {
	ListByUserID(userID string) []model.AccountRecord
	GetByIDForUser(userID, accountID string) (model.AccountRecord, bool)
}

type DefaultAccountService struct {
	logger       *slog.Logger
	repository   repository.AccountRepository
	seedProvider AccountSeedProvider
}

func NewAccountService(logger *slog.Logger, repository repository.AccountRepository) AccountService {
	return &DefaultAccountService{
		logger:       logger,
		repository:   repository,
		seedProvider: NewSeededAccountProvider(),
	}
}

func (s *DefaultAccountService) ListAccounts(ctx context.Context, user model.AuthenticatedUser) (model.AccountListResponse, error) {
	records, err := s.repository.ListByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Warn("failed to list accounts from supabase, falling back to seeded accounts", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		records = s.seedProvider.ListByUserID(user.ID)
	}

	if len(records) == 0 {
		records = s.seedProvider.ListByUserID(user.ID)
	}

	accounts := make([]model.Account, 0, len(records))
	for _, record := range records {
		account, ok := toAccountResponse(record)
		if !ok {
			continue
		}

		accounts = append(accounts, account)
	}

	return model.AccountListResponse{Accounts: accounts}, nil
}

func (s *DefaultAccountService) GetAccount(ctx context.Context, user model.AuthenticatedUser, accountID string) (model.AccountDetailResponse, error) {
	accountID = strings.TrimSpace(accountID)
	if accountID == "" {
		return model.AccountDetailResponse{}, ErrAccountNotFound
	}

	record, found, err := s.repository.GetByIDForUser(ctx, user.ID, accountID)
	if err != nil {
		s.logger.Warn("failed to fetch account detail from supabase, falling back to seeded accounts", slog.String("user_id", user.ID), slog.String("account_id", accountID), slog.String("error", err.Error()))
		record, found = s.seedProvider.GetByIDForUser(user.ID, accountID)
		if !found {
			return model.AccountDetailResponse{}, ErrAccountNotFound
		}
	}

	if !found {
		record, found = s.seedProvider.GetByIDForUser(user.ID, accountID)
		if !found {
			return model.AccountDetailResponse{}, ErrAccountNotFound
		}
	}

	account, ok := toAccountResponse(record)
	if !ok {
		return model.AccountDetailResponse{}, ErrAccountNotFound
	}

	return model.AccountDetailResponse{Account: account}, nil
}

func toAccountResponse(record model.AccountRecord) (model.Account, bool) {
	if record.ID == "" || !record.Currency.IsValid() || !record.Status.IsValid() {
		return model.Account{}, false
	}

	displayName := strings.TrimSpace(record.DisplayName)
	if displayName == "" {
		displayName = "Personal " + string(record.Currency)
	}

	accountType := strings.TrimSpace(record.AccountType)
	if accountType == "" {
		accountType = "personal"
	}

	provider := strings.TrimSpace(record.Provider)
	if provider == "" {
		provider = "Greencard"
	}

	return model.Account{
		ID:               record.ID,
		Currency:         record.Currency,
		AccountType:      accountType,
		DisplayName:      displayName,
		MaskedIdentifier: strings.TrimSpace(record.MaskedIdentifier),
		Provider:         provider,
		Status:           record.Status,
		Balance: model.AccountBalance{
			Current:   record.Balance,
			Available: record.AvailableBalance,
			Currency:  record.Currency,
		},
		CreatedAt: record.CreatedAt,
		UpdatedAt: record.UpdatedAt,
	}, true
}

type SeededAccountProvider struct{}

func NewSeededAccountProvider() AccountSeedProvider {
	return SeededAccountProvider{}
}

func (SeededAccountProvider) ListByUserID(userID string) []model.AccountRecord {
	records := seededAccountsForUser(userID)
	result := make([]model.AccountRecord, 0, len(records))
	for _, record := range records {
		result = append(result, record)
	}

	return result
}

func (SeededAccountProvider) GetByIDForUser(userID, accountID string) (model.AccountRecord, bool) {
	for _, record := range seededAccountsForUser(userID) {
		if record.ID == accountID {
			return record, true
		}
	}

	return model.AccountRecord{}, false
}

func seededAccountsForUser(userID string) []model.AccountRecord {
	seedTime := time.Date(2026, time.April, 19, 9, 0, 0, 0, time.UTC)
	seedKey := seedAccountKey(userID)

	return []model.AccountRecord{
		{
			ID:               "acct_ngn_" + seedKey,
			UserID:           userID,
			Currency:         model.AccountCurrencyNGN,
			AccountType:      "personal",
			DisplayName:      "Personal NGN",
			Balance:          12480.00,
			AvailableBalance: 12480.00,
			MaskedIdentifier: "NGN-" + strings.ToUpper(seedKey[:4]),
			Provider:         "Greencard",
			Status:           model.AccountStatusActive,
			CreatedAt:        &seedTime,
			UpdatedAt:        &seedTime,
		},
		{
			ID:               "acct_usd_" + seedKey,
			UserID:           userID,
			Currency:         model.AccountCurrencyUSD,
			AccountType:      "personal",
			DisplayName:      "Personal USD",
			Balance:          3240.12,
			AvailableBalance: 3180.12,
			MaskedIdentifier: "USD-" + strings.ToUpper(seedKey[:4]),
			Provider:         "Greencard",
			Status:           model.AccountStatusActive,
			CreatedAt:        &seedTime,
			UpdatedAt:        &seedTime,
		},
		{
			ID:               "acct_gbp_" + seedKey,
			UserID:           userID,
			Currency:         model.AccountCurrencyGBP,
			AccountType:      "personal",
			DisplayName:      "Personal GBP",
			Balance:          510.00,
			AvailableBalance: 510.00,
			MaskedIdentifier: "GBP-" + strings.ToUpper(seedKey[:4]),
			Provider:         "Greencard",
			Status:           model.AccountStatusActive,
			CreatedAt:        &seedTime,
			UpdatedAt:        &seedTime,
		},
		{
			ID:               "acct_eur_" + seedKey,
			UserID:           userID,
			Currency:         model.AccountCurrencyEUR,
			AccountType:      "personal",
			DisplayName:      "Personal EUR",
			Balance:          640.90,
			AvailableBalance: 640.90,
			MaskedIdentifier: "EUR-" + strings.ToUpper(seedKey[:4]),
			Provider:         "Greencard",
			Status:           model.AccountStatusActive,
			CreatedAt:        &seedTime,
			UpdatedAt:        &seedTime,
		},
	}
}

func seedAccountKey(userID string) string {
	normalized := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(userID), "-", ""))
	if normalized == "" {
		return "guest0001"
	}

	if len(normalized) >= 8 {
		return normalized[:8]
	}

	return normalized + strings.Repeat("0", 8-len(normalized))
}
