package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"unicode"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrRecipientsUnavailable     = errors.New("recipients unavailable")
	ErrRecipientNotFound         = errors.New("recipient not found")
	ErrRecipientPermissionDenied = errors.New("recipient permission denied")
)

type RecipientService interface {
	CreateRecipient(ctx context.Context, user model.AuthenticatedUser, input model.CreateRecipientInput) (model.RecipientResponse, error)
	ListRecipients(ctx context.Context, user model.AuthenticatedUser) (model.RecipientListResponse, error)
	GetRecipient(ctx context.Context, user model.AuthenticatedUser, recipientID string) (model.RecipientResponse, error)
}

type DefaultRecipientService struct {
	logger       *slog.Logger
	repository   repository.RecipientRepository
	permissions  PermissionHelper
	verification VerificationResolver
}

func NewRecipientService(
	logger *slog.Logger,
	repository repository.RecipientRepository,
	permissions PermissionHelper,
	verification VerificationResolver,
) RecipientService {
	return &DefaultRecipientService{
		logger:       logger,
		repository:   repository,
		permissions:  permissions,
		verification: verification,
	}
}

func (s *DefaultRecipientService) CreateRecipient(ctx context.Context, user model.AuthenticatedUser, input model.CreateRecipientInput) (model.RecipientResponse, error) {
	status, err := s.verification.ResolveForUser(ctx, user.ID)
	if err != nil {
		return model.RecipientResponse{}, ErrRecipientsUnavailable
	}

	if !s.permissions.CanCreateRecipient(status) {
		return model.RecipientResponse{}, ErrRecipientPermissionDenied
	}

	record, validationErrors := validateCreateRecipientInput(user.ID, input)
	if len(validationErrors) > 0 {
		return model.RecipientResponse{}, validationErrors
	}

	savedRecord, err := s.repository.Create(ctx, record)
	if err != nil {
		s.logger.Error("failed to create recipient", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.RecipientResponse{}, ErrRecipientsUnavailable
	}

	return model.RecipientResponse{Recipient: buildRecipient(savedRecord)}, nil
}

func (s *DefaultRecipientService) ListRecipients(ctx context.Context, user model.AuthenticatedUser) (model.RecipientListResponse, error) {
	records, err := s.repository.ListByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list recipients", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.RecipientListResponse{}, ErrRecipientsUnavailable
	}

	recipients := make([]model.Recipient, 0, len(records))
	for _, record := range records {
		if !s.permissions.CanAccessRecipient(user, record) {
			continue
		}

		recipients = append(recipients, buildRecipient(record))
	}

	return model.RecipientListResponse{Recipients: recipients}, nil
}

func (s *DefaultRecipientService) GetRecipient(ctx context.Context, user model.AuthenticatedUser, recipientID string) (model.RecipientResponse, error) {
	recipientID = strings.TrimSpace(recipientID)
	if recipientID == "" {
		return model.RecipientResponse{}, ErrRecipientNotFound
	}

	record, found, err := s.repository.GetByIDForUser(ctx, user.ID, recipientID)
	if err != nil {
		s.logger.Error("failed to fetch recipient", slog.String("user_id", user.ID), slog.String("recipient_id", recipientID), slog.String("error", err.Error()))
		return model.RecipientResponse{}, ErrRecipientsUnavailable
	}

	if !found {
		return model.RecipientResponse{}, ErrRecipientNotFound
	}

	if !s.permissions.CanAccessRecipient(user, record) {
		return model.RecipientResponse{}, ErrRecipientNotFound
	}

	return model.RecipientResponse{Recipient: buildRecipient(record)}, nil
}

func validateCreateRecipientInput(userID string, input model.CreateRecipientInput) (model.RecipientRecord, ValidationErrors) {
	var validationErrors ValidationErrors

	record := model.RecipientRecord{
		UserID:   userID,
		Type:     input.Type,
		FullName: strings.TrimSpace(input.FullName),
		BankName: strings.TrimSpace(input.BankName),
		Country:  strings.TrimSpace(input.Country),
		Currency: input.Currency,
	}

	accountNumber := cleanCompactValue(input.AccountNumber, false)
	iban := cleanCompactValue(input.IBAN, true)
	routingNumber := cleanCompactValue(input.RoutingNumber, true)
	sortCode := cleanCompactValue(input.SortCode, false)
	swiftCode := cleanCompactValue(input.SwiftCode, true)
	nickname := strings.TrimSpace(input.Nickname)

	if !record.Type.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "type", Message: "type must be bank or international_bank"})
	}

	if record.FullName == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "full_name", Message: "full_name is required"})
	} else if len(record.FullName) > 120 {
		validationErrors = append(validationErrors, ValidationError{Field: "full_name", Message: "full_name must be 120 characters or fewer"})
	}

	if record.BankName == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "bank_name", Message: "bank_name is required"})
	} else if len(record.BankName) > 120 {
		validationErrors = append(validationErrors, ValidationError{Field: "bank_name", Message: "bank_name must be 120 characters or fewer"})
	}

	if record.Country == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "country", Message: "country is required"})
	} else if len(record.Country) > 80 {
		validationErrors = append(validationErrors, ValidationError{Field: "country", Message: "country must be 80 characters or fewer"})
	}

	if !record.Currency.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "currency", Message: "currency must be one of NGN, USD, GBP, or EUR"})
	}

	if accountNumber != "" && !isAlphaNumeric(accountNumber) {
		validationErrors = append(validationErrors, ValidationError{Field: "account_number", Message: "account_number must contain only letters and digits"})
	} else if accountNumber != "" && (len(accountNumber) < 4 || len(accountNumber) > 34) {
		validationErrors = append(validationErrors, ValidationError{Field: "account_number", Message: "account_number must be between 4 and 34 characters"})
	}

	if iban != "" && !isAlphaNumeric(iban) {
		validationErrors = append(validationErrors, ValidationError{Field: "iban", Message: "iban must contain only letters and digits"})
	} else if iban != "" && (len(iban) < 8 || len(iban) > 34) {
		validationErrors = append(validationErrors, ValidationError{Field: "iban", Message: "iban must be between 8 and 34 characters"})
	}

	if routingNumber != "" && !isAlphaNumeric(routingNumber) {
		validationErrors = append(validationErrors, ValidationError{Field: "routing_number", Message: "routing_number must contain only letters and digits"})
	} else if routingNumber != "" && (len(routingNumber) < 3 || len(routingNumber) > 12) {
		validationErrors = append(validationErrors, ValidationError{Field: "routing_number", Message: "routing_number must be between 3 and 12 characters"})
	}

	if sortCode != "" && !isSortCode(sortCode) {
		validationErrors = append(validationErrors, ValidationError{Field: "sort_code", Message: "sort_code must contain digits or hyphens only"})
	}

	if swiftCode != "" && !isAlphaNumeric(swiftCode) {
		validationErrors = append(validationErrors, ValidationError{Field: "swift_code", Message: "swift_code must contain only letters and digits"})
	} else if swiftCode != "" && len(swiftCode) != 8 && len(swiftCode) != 11 {
		validationErrors = append(validationErrors, ValidationError{Field: "swift_code", Message: "swift_code must be 8 or 11 characters"})
	}

	if nickname != "" && len(nickname) > 80 {
		validationErrors = append(validationErrors, ValidationError{Field: "nickname", Message: "nickname must be 80 characters or fewer"})
	}

	switch record.Type {
	case model.RecipientTypeBank:
		if accountNumber == "" {
			validationErrors = append(validationErrors, ValidationError{Field: "account_number", Message: "account_number is required for bank recipients"})
		}
	case model.RecipientTypeInternationalBank:
		if accountNumber == "" && iban == "" {
			validationErrors = append(validationErrors, ValidationError{Field: "iban", Message: "either iban or account_number is required for international_bank recipients"})
		}
	}

	record.AccountNumber = optionalStringPointer(accountNumber)
	record.IBAN = optionalStringPointer(iban)
	record.RoutingNumber = optionalStringPointer(routingNumber)
	record.SortCode = optionalStringPointer(sortCode)
	record.SwiftCode = optionalStringPointer(swiftCode)
	record.Nickname = optionalStringPointer(nickname)

	return record, validationErrors
}

func buildRecipient(record model.RecipientRecord) model.Recipient {
	return model.Recipient{
		ID:            record.ID,
		Type:          record.Type,
		FullName:      record.FullName,
		BankName:      record.BankName,
		AccountNumber: maskSensitivePointer(record.AccountNumber),
		IBAN:          maskSensitivePointer(record.IBAN),
		RoutingNumber: copyOptionalString(record.RoutingNumber),
		SortCode:      copyOptionalString(record.SortCode),
		SwiftCode:     copyOptionalString(record.SwiftCode),
		Country:       record.Country,
		Currency:      record.Currency,
		Nickname:      copyOptionalString(record.Nickname),
		CreatedAt:     record.CreatedAt,
		UpdatedAt:     record.UpdatedAt,
	}
}

func cleanCompactValue(value string, uppercase bool) string {
	value = strings.ReplaceAll(strings.TrimSpace(value), " ", "")
	if uppercase {
		value = strings.ToUpper(value)
	}

	return value
}

func optionalStringPointer(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}

	return &value
}

func copyOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	copy := *value
	return &copy
}

func maskSensitivePointer(value *string) *string {
	if value == nil {
		return nil
	}

	masked := maskSensitiveValue(*value)
	return &masked
}

func maskSensitiveValue(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}

	if len(value) <= 4 {
		return value
	}

	return strings.Repeat("*", len(value)-4) + value[len(value)-4:]
}

func isAlphaNumeric(value string) bool {
	for _, character := range value {
		if !unicode.IsDigit(character) && !unicode.IsLetter(character) {
			return false
		}
	}

	return true
}

func isSortCode(value string) bool {
	for _, character := range value {
		if !unicode.IsDigit(character) && character != '-' {
			return false
		}
	}

	return value != ""
}
