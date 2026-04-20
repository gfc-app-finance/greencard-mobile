package service

import (
	"context"
	"errors"
	"log/slog"
	"strings"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/repository"
)

var (
	ErrSupportUnavailable      = errors.New("support unavailable")
	ErrSupportPermissionDenied = errors.New("support permission denied")
	ErrSupportTicketNotFound   = errors.New("support ticket not found")
)

type SupportService interface {
	CreateTicket(ctx context.Context, user model.AuthenticatedUser, input model.CreateSupportTicketInput) (model.SupportTicketResponse, error)
	ListTickets(ctx context.Context, user model.AuthenticatedUser) (model.SupportTicketListResponse, error)
	GetTicket(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketResponse, error)
	CreateMessage(ctx context.Context, user model.AuthenticatedUser, ticketID string, input model.CreateSupportTicketMessageInput) (model.SupportTicketMessageResponse, error)
	ListMessages(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketMessageListResponse, error)
}

type DefaultSupportService struct {
	logger       *slog.Logger
	ticketRepo   repository.SupportTicketRepository
	messageRepo  repository.SupportTicketMessageRepository
	profileRepo  repository.ProfileRepository
	fundingRepo  repository.FundingTransactionRepository
	transferRepo repository.TransferTransactionRepository
	paymentRepo  repository.PaymentTransactionRepository
	permissions  PermissionHelper
	activities   ActivityEventRecorder
}

func NewSupportService(
	logger *slog.Logger,
	ticketRepo repository.SupportTicketRepository,
	messageRepo repository.SupportTicketMessageRepository,
	profileRepo repository.ProfileRepository,
	fundingRepo repository.FundingTransactionRepository,
	transferRepo repository.TransferTransactionRepository,
	paymentRepo repository.PaymentTransactionRepository,
	permissions PermissionHelper,
	activities ActivityEventRecorder,
) SupportService {
	return &DefaultSupportService{
		logger:       logger,
		ticketRepo:   ticketRepo,
		messageRepo:  messageRepo,
		profileRepo:  profileRepo,
		fundingRepo:  fundingRepo,
		transferRepo: transferRepo,
		paymentRepo:  paymentRepo,
		permissions:  permissions,
		activities:   activities,
	}
}

func (s *DefaultSupportService) CreateTicket(ctx context.Context, user model.AuthenticatedUser, input model.CreateSupportTicketInput) (model.SupportTicketResponse, error) {
	status, err := s.currentVerificationStatus(ctx, user.ID)
	if err != nil {
		return model.SupportTicketResponse{}, ErrSupportUnavailable
	}

	if !s.permissions.CanCreateSupportTicket(status) {
		return model.SupportTicketResponse{}, ErrSupportPermissionDenied
	}

	record, validationErrors, err := s.validateCreateTicketInput(ctx, user.ID, input)
	if err != nil {
		return model.SupportTicketResponse{}, err
	}
	if len(validationErrors) > 0 {
		return model.SupportTicketResponse{}, validationErrors
	}

	savedRecord, err := s.ticketRepo.CreateTicket(ctx, record)
	if err != nil {
		s.logger.Error("failed to create support ticket", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.SupportTicketResponse{}, ErrSupportUnavailable
	}

	s.syncTicketCreatedActivity(ctx, user.ID, savedRecord)

	return model.SupportTicketResponse{Ticket: buildSupportTicket(savedRecord)}, nil
}

func (s *DefaultSupportService) ListTickets(ctx context.Context, user model.AuthenticatedUser) (model.SupportTicketListResponse, error) {
	records, err := s.ticketRepo.ListTicketsByUserID(ctx, user.ID)
	if err != nil {
		s.logger.Error("failed to list support tickets", slog.String("user_id", user.ID), slog.String("error", err.Error()))
		return model.SupportTicketListResponse{}, ErrSupportUnavailable
	}

	tickets := make([]model.SupportTicket, 0, len(records))
	for _, record := range records {
		if !s.permissions.CanAccessTicket(user, record) {
			continue
		}

		tickets = append(tickets, buildSupportTicket(record))
	}

	return model.SupportTicketListResponse{Tickets: tickets}, nil
}

func (s *DefaultSupportService) GetTicket(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketResponse, error) {
	record, err := s.getTicketForUser(ctx, user.ID, ticketID)
	if err != nil {
		return model.SupportTicketResponse{}, err
	}

	return model.SupportTicketResponse{Ticket: buildSupportTicket(record)}, nil
}

func (s *DefaultSupportService) CreateMessage(ctx context.Context, user model.AuthenticatedUser, ticketID string, input model.CreateSupportTicketMessageInput) (model.SupportTicketMessageResponse, error) {
	record, err := s.getTicketForUser(ctx, user.ID, ticketID)
	if err != nil {
		return model.SupportTicketMessageResponse{}, err
	}

	message, validationErrors := validateCreateSupportMessageInput(record, input)
	if len(validationErrors) > 0 {
		return model.SupportTicketMessageResponse{}, validationErrors
	}

	savedRecord, err := s.messageRepo.CreateTicketMessage(ctx, message)
	if err != nil {
		s.logger.Error("failed to create support message", slog.String("user_id", user.ID), slog.String("ticket_id", record.ID), slog.String("error", err.Error()))
		return model.SupportTicketMessageResponse{}, ErrSupportUnavailable
	}

	return model.SupportTicketMessageResponse{Message: buildSupportTicketMessage(savedRecord)}, nil
}

func (s *DefaultSupportService) ListMessages(ctx context.Context, user model.AuthenticatedUser, ticketID string) (model.SupportTicketMessageListResponse, error) {
	record, err := s.getTicketForUser(ctx, user.ID, ticketID)
	if err != nil {
		return model.SupportTicketMessageListResponse{}, err
	}

	records, err := s.messageRepo.ListMessagesByTicketID(ctx, record.ID)
	if err != nil {
		s.logger.Error("failed to list support messages", slog.String("user_id", user.ID), slog.String("ticket_id", record.ID), slog.String("error", err.Error()))
		return model.SupportTicketMessageListResponse{}, ErrSupportUnavailable
	}

	messages := make([]model.SupportTicketMessage, 0, len(records))
	for _, message := range records {
		messages = append(messages, buildSupportTicketMessage(message))
	}

	return model.SupportTicketMessageListResponse{Messages: messages}, nil
}

func (s *DefaultSupportService) getTicketForUser(ctx context.Context, userID, ticketID string) (model.SupportTicketRecord, error) {
	ticketID = strings.TrimSpace(ticketID)
	if ticketID == "" {
		return model.SupportTicketRecord{}, ErrSupportTicketNotFound
	}

	record, found, err := s.ticketRepo.GetTicketByIDForUser(ctx, userID, ticketID)
	if err != nil {
		s.logger.Error("failed to fetch support ticket", slog.String("user_id", userID), slog.String("ticket_id", ticketID), slog.String("error", err.Error()))
		return model.SupportTicketRecord{}, ErrSupportUnavailable
	}

	if !found {
		return model.SupportTicketRecord{}, ErrSupportTicketNotFound
	}

	if !s.permissions.CanAccessTicket(model.AuthenticatedUser{ID: userID}, record) {
		return model.SupportTicketRecord{}, ErrSupportTicketNotFound
	}

	return record, nil
}

func (s *DefaultSupportService) currentVerificationStatus(ctx context.Context, userID string) (model.VerificationStatus, error) {
	record, found, err := s.profileRepo.GetByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to resolve verification status for support", slog.String("user_id", userID), slog.String("error", err.Error()))
		return "", err
	}

	if !found {
		record = model.ProfileRecord{
			ID:                 userID,
			VerificationStatus: model.VerificationStatusBasic,
		}
	}

	return ResolveVerificationStatus(record.VerificationStatus, record), nil
}

func (s *DefaultSupportService) validateCreateTicketInput(ctx context.Context, userID string, input model.CreateSupportTicketInput) (model.SupportTicketRecord, ValidationErrors, error) {
	var validationErrors ValidationErrors

	record := model.SupportTicketRecord{
		UserID:      userID,
		Title:       strings.TrimSpace(input.Title),
		IssueType:   input.IssueType,
		Description: strings.TrimSpace(input.Description),
		Status:      model.SupportTicketStatusOpen,
	}

	if record.Title == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "title", Message: "title is required"})
	} else if len(record.Title) > 140 {
		validationErrors = append(validationErrors, ValidationError{Field: "title", Message: "title must be 140 characters or fewer"})
	}

	if !record.IssueType.IsValid() {
		validationErrors = append(validationErrors, ValidationError{Field: "issue_type", Message: "issue_type must be one of payment_failed, delayed_payment, transfer_issue, funding_issue, account_issue, card_issue, or other"})
	}

	if record.Description == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "description", Message: "description is required"})
	} else if len(record.Description) > 2000 {
		validationErrors = append(validationErrors, ValidationError{Field: "description", Message: "description must be 2000 characters or fewer"})
	}

	if input.Priority != nil {
		priority := model.SupportTicketPriority(strings.TrimSpace(string(*input.Priority)))
		if !priority.IsValid() {
			validationErrors = append(validationErrors, ValidationError{Field: "priority", Message: "priority must be low, normal, or high"})
		} else {
			record.Priority = &priority
		}
	}

	linkType, linkID, linkValidationErrors, err := s.validateLinkedEntity(ctx, userID, input.LinkedEntityType, input.LinkedEntityID)
	if err != nil {
		return model.SupportTicketRecord{}, nil, err
	}
	validationErrors = append(validationErrors, linkValidationErrors...)
	record.LinkedEntityType = linkType
	record.LinkedEntityID = linkID

	return record, validationErrors, nil
}

func (s *DefaultSupportService) validateLinkedEntity(
	ctx context.Context,
	userID string,
	linkedEntityType *model.LinkedEntityType,
	linkedEntityID *string,
) (*model.LinkedEntityType, *string, ValidationErrors, error) {
	var validationErrors ValidationErrors

	if linkedEntityType == nil && linkedEntityID == nil {
		return nil, nil, nil, nil
	}

	if linkedEntityType == nil || linkedEntityID == nil {
		validationErrors = append(validationErrors, ValidationError{Field: "linked_entity_id", Message: "linked_entity_type and linked_entity_id must be provided together"})
		return nil, nil, validationErrors, nil
	}

	entityType := model.LinkedEntityType(strings.TrimSpace(string(*linkedEntityType)))
	entityID := strings.TrimSpace(*linkedEntityID)

	if entityID == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "linked_entity_id", Message: "linked_entity_id is required when linked_entity_type is provided"})
		return nil, nil, validationErrors, nil
	}

	switch entityType {
	case model.LinkedEntityTypeFundingTransaction:
		record, found, err := s.fundingRepo.GetFundingByIDForUser(ctx, userID, entityID)
		if err != nil {
			s.logger.Error("failed to validate linked funding transaction", slog.String("user_id", userID), slog.String("linked_entity_id", entityID), slog.String("error", err.Error()))
			return nil, nil, nil, ErrSupportUnavailable
		}
		if !found || !s.permissions.CanAccessFundingTransaction(model.AuthenticatedUser{ID: userID}, record) {
			return nil, nil, ValidationErrors{{Field: "linked_entity_id", Message: "linked_entity_id must reference one of the authenticated user's transactions"}}, nil
		}
	case model.LinkedEntityTypeTransferTransaction:
		record, found, err := s.transferRepo.GetTransferByIDForUser(ctx, userID, entityID)
		if err != nil {
			s.logger.Error("failed to validate linked transfer transaction", slog.String("user_id", userID), slog.String("linked_entity_id", entityID), slog.String("error", err.Error()))
			return nil, nil, nil, ErrSupportUnavailable
		}
		if !found || !s.permissions.CanAccessTransferTransaction(model.AuthenticatedUser{ID: userID}, record) {
			return nil, nil, ValidationErrors{{Field: "linked_entity_id", Message: "linked_entity_id must reference one of the authenticated user's transactions"}}, nil
		}
	case model.LinkedEntityTypePaymentTransaction:
		record, found, err := s.paymentRepo.GetPaymentByIDForUser(ctx, userID, entityID)
		if err != nil {
			s.logger.Error("failed to validate linked payment transaction", slog.String("user_id", userID), slog.String("linked_entity_id", entityID), slog.String("error", err.Error()))
			return nil, nil, nil, ErrSupportUnavailable
		}
		if !found || !s.permissions.CanAccessPaymentTransaction(model.AuthenticatedUser{ID: userID}, record) {
			return nil, nil, ValidationErrors{{Field: "linked_entity_id", Message: "linked_entity_id must reference one of the authenticated user's transactions"}}, nil
		}
	default:
		return nil, nil, ValidationErrors{{Field: "linked_entity_type", Message: "linked_entity_type must be funding_transaction, transfer_transaction, or payment_transaction"}}, nil
	}

	return &entityType, &entityID, nil, nil
}

func validateCreateSupportMessageInput(ticket model.SupportTicketRecord, input model.CreateSupportTicketMessageInput) (model.SupportTicketMessageRecord, ValidationErrors) {
	var validationErrors ValidationErrors

	message := strings.TrimSpace(input.Message)
	if message == "" {
		validationErrors = append(validationErrors, ValidationError{Field: "message", Message: "message is required"})
	} else if len(message) > 4000 {
		validationErrors = append(validationErrors, ValidationError{Field: "message", Message: "message must be 4000 characters or fewer"})
	}

	if ticket.Status == model.SupportTicketStatusClosed {
		validationErrors = append(validationErrors, ValidationError{Field: "ticket_id", Message: "messages cannot be added to a closed ticket"})
	}

	return model.SupportTicketMessageRecord{
		TicketID:   ticket.ID,
		SenderType: model.SupportMessageSenderTypeUser,
		Message:    message,
	}, validationErrors
}

func buildSupportTicket(record model.SupportTicketRecord) model.SupportTicket {
	return model.SupportTicket{
		ID:               record.ID,
		Title:            record.Title,
		IssueType:        record.IssueType,
		Description:      record.Description,
		Status:           record.Status,
		LinkedEntityType: record.LinkedEntityType,
		LinkedEntityID:   record.LinkedEntityID,
		Priority:         record.Priority,
		CreatedAt:        record.CreatedAt,
		UpdatedAt:        record.UpdatedAt,
	}
}

func buildSupportTicketMessage(record model.SupportTicketMessageRecord) model.SupportTicketMessage {
	return model.SupportTicketMessage{
		ID:         record.ID,
		TicketID:   record.TicketID,
		SenderType: record.SenderType,
		Message:    record.Message,
		CreatedAt:  record.CreatedAt,
	}
}

func (s *DefaultSupportService) syncTicketCreatedActivity(ctx context.Context, userID string, record model.SupportTicketRecord) {
	if s.activities == nil {
		return
	}

	if err := s.activities.RecordSupportTicketCreated(ctx, userID, record); err != nil {
		s.logger.Warn("failed to sync support ticket activity", slog.String("user_id", userID), slog.String("ticket_id", record.ID), slog.String("error", err.Error()))
	}
}
