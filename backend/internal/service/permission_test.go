package service

import (
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestPermissionsForStatus(t *testing.T) {
	helper := NewPermissionHelper()

	verified := helper.PermissionsForStatus(model.VerificationStatusVerified)
	if !verified.CanAddMoney || !verified.CanMoveMoney || !verified.CanSendPayments || !verified.CanCreateRecipients || !verified.CanCreateSupportTickets {
		t.Fatalf("verified users should receive full operational permissions: %#v", verified)
	}

	basic := helper.PermissionsForStatus(model.VerificationStatusBasic)
	if basic.CanAddMoney || basic.CanMoveMoney || basic.CanSendPayments || !basic.CanCreateSupportTickets {
		t.Fatalf("basic users should only retain support ticket access: %#v", basic)
	}

	restricted := helper.PermissionsForStatus(model.VerificationStatusRestricted)
	if restricted.CanAddMoney || restricted.CanCreateRecipients || !restricted.CanCreateSupportTickets {
		t.Fatalf("restricted users should not retain money movement permissions: %#v", restricted)
	}
}

func TestOwnershipChecksAndAccountUsage(t *testing.T) {
	helper := NewPermissionHelper()
	user := model.AuthenticatedUser{ID: "user_123"}

	if !helper.CanAccessAccount(user, model.AccountRecord{UserID: "user_123"}) {
		t.Fatal("expected owned account access to be allowed")
	}

	if helper.CanAccessRecipient(user, model.RecipientRecord{UserID: "other_user"}) {
		t.Fatal("expected cross-user recipient access to be denied")
	}

	if helper.CanUseAccount(model.AccountStatusRestricted) {
		t.Fatal("restricted accounts should not be usable")
	}
}
