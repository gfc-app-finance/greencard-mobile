package model

type PermissionSet struct {
	CanAddMoney         bool `json:"can_add_money"`
	CanMoveMoney        bool `json:"can_move_money"`
	CanSendPayments     bool `json:"can_send_payments"`
	CanReceivePayments  bool `json:"can_receive_payments"`
	CanCreateCard       bool `json:"can_create_card"`
	CanManageCard       bool `json:"can_manage_card"`
	CanCreateAccount    bool `json:"can_create_account"`
	CanCreateRecipients bool `json:"can_create_recipients"`
}
