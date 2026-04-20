package repository

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/config"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
)

func TestCreatePaymentPersistsRecipientID(t *testing.T) {
	recipientID := "11111111-1111-1111-1111-111111111111"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST, got %s", r.Method)
		}

		if r.URL.Path != "/payment_transactions" {
			t.Fatalf("expected /payment_transactions path, got %s", r.URL.Path)
		}

		var payload map[string]any
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatalf("expected JSON payload, got %v", err)
		}

		if payload["recipient_id"] != recipientID {
			t.Fatalf("expected recipient_id %q, got %#v", recipientID, payload["recipient_id"])
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]map[string]any{{
			"id":                  "payment_123",
			"user_id":             "user_123",
			"source_account_id":   "acct_usd_user",
			"recipient_id":        recipientID,
			"recipient_reference": "Jane Doe",
			"payment_type":        "international",
			"amount":              250.0,
			"currency":            "USD",
			"fee":                 2.5,
			"fx_rate":             nil,
			"total_amount":        252.5,
			"status":              "submitted",
			"reference":           "GCF-PMT-TEST",
			"created_at":          time.Now().UTC(),
			"updated_at":          time.Now().UTC(),
		}})
	}))
	defer server.Close()

	repository := NewSupabaseTransactionRepository(testLogger(), config.SupabaseConfig{
		RESTURL:        server.URL,
		RESTTimeout:    time.Second,
		ServiceRoleKey: "service-key",
		PaymentTable:   "payment_transactions",
	})

	record, err := repository.CreatePayment(context.Background(), model.PaymentTransactionRecord{
		UserID:             "user_123",
		SourceAccountID:    "acct_usd_user",
		RecipientID:        &recipientID,
		RecipientReference: "Jane Doe",
		PaymentType:        model.PaymentTypeInternational,
		Amount:             250,
		Currency:           model.AccountCurrencyUSD,
		Fee:                2.5,
		TotalAmount:        252.5,
		Status:             model.PaymentStatusSubmitted,
		Reference:          "GCF-PMT-TEST",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if record.RecipientID == nil || *record.RecipientID != recipientID {
		t.Fatalf("expected recipient_id %q in response, got %#v", recipientID, record.RecipientID)
	}
}

func TestGetPaymentByIDForUserSupportsNullableRecipientID(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			t.Fatalf("expected GET, got %s", r.Method)
		}

		query := r.URL.RawQuery
		if !strings.Contains(query, "user_id=eq.user_123") {
			t.Fatalf("expected user scope in query, got %s", query)
		}
		if !strings.Contains(query, "id=eq.payment_123") {
			t.Fatalf("expected transaction id in query, got %s", query)
		}
		if !strings.Contains(query, "recipient_id") {
			t.Fatalf("expected recipient_id in select list, got %s", query)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]map[string]any{{
			"id":                  "payment_123",
			"user_id":             "user_123",
			"source_account_id":   "acct_usd_user",
			"recipient_id":        nil,
			"recipient_reference": "Legacy Recipient",
			"payment_type":        "bank",
			"amount":              50.0,
			"currency":            "USD",
			"fee":                 0.0,
			"fx_rate":             nil,
			"total_amount":        50.0,
			"status":              "submitted",
			"reference":           "GCF-PMT-LEGACY",
			"created_at":          time.Now().UTC(),
			"updated_at":          time.Now().UTC(),
		}})
	}))
	defer server.Close()

	repository := NewSupabaseTransactionRepository(testLogger(), config.SupabaseConfig{
		RESTURL:        server.URL,
		RESTTimeout:    time.Second,
		ServiceRoleKey: "service-key",
		PaymentTable:   "payment_transactions",
	})

	record, found, err := repository.GetPaymentByIDForUser(context.Background(), "user_123", "payment_123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !found {
		t.Fatal("expected payment record to be found")
	}
	if record.RecipientID != nil {
		t.Fatalf("expected nil recipient_id for legacy row, got %#v", record.RecipientID)
	}
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, nil))
}
