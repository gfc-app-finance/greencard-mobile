package model

type ReconciliationIssueType string

const (
	ReconciliationIssueCompletedTransactionMissingMovement ReconciliationIssueType = "completed_transaction_missing_balance_movement"
	ReconciliationIssueWebhookEventUnlinked                ReconciliationIssueType = "webhook_event_unlinked"
	ReconciliationIssueWebhookEventFailed                  ReconciliationIssueType = "webhook_event_failed"
	ReconciliationIssueWebhookStateMismatch                ReconciliationIssueType = "webhook_state_mismatch"
)

type ReconciliationSeverity string

const (
	ReconciliationSeverityWarning ReconciliationSeverity = "warning"
	ReconciliationSeverityError   ReconciliationSeverity = "error"
)

type ReconciliationIssue struct {
	Type       ReconciliationIssueType `json:"type"`
	Severity   ReconciliationSeverity  `json:"severity"`
	EntityType string                  `json:"entity_type"`
	EntityID   string                  `json:"entity_id,omitempty"`
	Reference  string                  `json:"reference,omitempty"`
	Expected   string                  `json:"expected,omitempty"`
	Actual     string                  `json:"actual,omitempty"`
	Message    string                  `json:"message"`
}

type ReconciliationReport struct {
	Checked int                   `json:"checked"`
	Issues  []ReconciliationIssue `json:"issues"`
}

func (report ReconciliationReport) IssueCount() int {
	return len(report.Issues)
}
