package service

import "github.com/gfc-app-finance/greencard-mobile/backend/internal/model"

type PermissionHelper interface {
	PermissionsForStatus(status model.VerificationStatus) model.PermissionSet
	CanAddMoney(status model.VerificationStatus) bool
	CanMoveMoney(status model.VerificationStatus) bool
	CanCreateFunding(status model.VerificationStatus) bool
	CanCreateTransfer(status model.VerificationStatus) bool
	CanCreatePayment(status model.VerificationStatus) bool
	CanCreateCard(status model.VerificationStatus) bool
	CanCreateRecipient(status model.VerificationStatus) bool
	CanCreateSupportTicket(status model.VerificationStatus) bool
	CanAccessAccount(user model.AuthenticatedUser, account model.AccountRecord) bool
	CanAccessFundingTransaction(user model.AuthenticatedUser, record model.FundingTransactionRecord) bool
	CanAccessTransferTransaction(user model.AuthenticatedUser, record model.TransferTransactionRecord) bool
	CanAccessPaymentTransaction(user model.AuthenticatedUser, record model.PaymentTransactionRecord) bool
	CanAccessRecipient(user model.AuthenticatedUser, record model.RecipientRecord) bool
	CanAccessTicket(user model.AuthenticatedUser, record model.SupportTicketRecord) bool
	CanUseAccount(accountStatus model.AccountStatus) bool
}

type DefaultPermissionHelper struct{}

func NewPermissionHelper() PermissionHelper {
	return DefaultPermissionHelper{}
}

func (DefaultPermissionHelper) PermissionsForStatus(status model.VerificationStatus) model.PermissionSet {
	switch status {
	case model.VerificationStatusVerified:
		return model.PermissionSet{
			CanAddMoney:         true,
			CanMoveMoney:        true,
			CanSendPayments:     true,
			CanReceivePayments:  true,
			CanCreateCard:       true,
			CanManageCard:       true,
			CanCreateAccount:    true,
			CanCreateRecipients: true,
			CanCreateSupportTickets: true,
		}
	case model.VerificationStatusBasic,
		model.VerificationStatusProfileCompleted,
		model.VerificationStatusUnderReview,
		model.VerificationStatusRestricted:
		return model.PermissionSet{
			CanCreateSupportTickets: true,
		}
	default:
		return model.PermissionSet{}
	}
}

func (helper DefaultPermissionHelper) CanAddMoney(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanAddMoney
}

func (helper DefaultPermissionHelper) CanMoveMoney(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanMoveMoney
}

func (helper DefaultPermissionHelper) CanCreateFunding(status model.VerificationStatus) bool {
	return helper.CanAddMoney(status)
}

func (helper DefaultPermissionHelper) CanCreateTransfer(status model.VerificationStatus) bool {
	return helper.CanMoveMoney(status)
}

func (helper DefaultPermissionHelper) CanCreatePayment(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanSendPayments
}

func (helper DefaultPermissionHelper) CanCreateCard(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanCreateCard
}

func (helper DefaultPermissionHelper) CanCreateRecipient(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanCreateRecipients
}

func (helper DefaultPermissionHelper) CanCreateSupportTicket(status model.VerificationStatus) bool {
	return helper.PermissionsForStatus(status).CanCreateSupportTickets
}

func (DefaultPermissionHelper) CanAccessAccount(user model.AuthenticatedUser, account model.AccountRecord) bool {
	return hasOwnership(user.ID, account.UserID)
}

func (DefaultPermissionHelper) CanAccessFundingTransaction(user model.AuthenticatedUser, record model.FundingTransactionRecord) bool {
	return hasOwnership(user.ID, record.UserID)
}

func (DefaultPermissionHelper) CanAccessTransferTransaction(user model.AuthenticatedUser, record model.TransferTransactionRecord) bool {
	return hasOwnership(user.ID, record.UserID)
}

func (DefaultPermissionHelper) CanAccessPaymentTransaction(user model.AuthenticatedUser, record model.PaymentTransactionRecord) bool {
	return hasOwnership(user.ID, record.UserID)
}

func (DefaultPermissionHelper) CanAccessRecipient(user model.AuthenticatedUser, record model.RecipientRecord) bool {
	return hasOwnership(user.ID, record.UserID)
}

func (DefaultPermissionHelper) CanAccessTicket(user model.AuthenticatedUser, record model.SupportTicketRecord) bool {
	return hasOwnership(user.ID, record.UserID)
}

func (DefaultPermissionHelper) CanUseAccount(accountStatus model.AccountStatus) bool {
	return accountStatus == model.AccountStatusActive
}

func hasOwnership(userID, ownerID string) bool {
	return userID != "" && ownerID != "" && userID == ownerID
}
