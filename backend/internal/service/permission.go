package service

import "github.com/gfc-app-finance/greencard-mobile/backend/internal/model"

type PermissionHelper interface {
	PermissionsForStatus(status model.VerificationStatus) model.PermissionSet
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
		}
	default:
		return model.PermissionSet{}
	}
}
