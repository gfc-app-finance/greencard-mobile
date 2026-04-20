package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/model"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
	"github.com/gfc-app-finance/greencard-mobile/backend/internal/service"
)

type fakeWebhookService struct {
	handleProviderWebhook func(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error)
}

func (f fakeWebhookService) HandleProviderWebhook(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error) {
	if f.handleProviderWebhook != nil {
		return f.handleProviderWebhook(ctx, provider, headers, body)
	}

	return model.WebhookHandleResult{}, nil
}

func TestHandleProviderEventReturnsAccepted(t *testing.T) {
	handler := NewWebhookHandler(testLogger(), fakeWebhookService{
		handleProviderWebhook: func(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error) {
			if provider != "sandboxpay" {
				t.Fatalf("expected sandboxpay provider, got %q", provider)
			}

			return model.WebhookHandleResult{
				Provider: model.WebhookProviderSandboxPay,
				EventID:  "evt_123",
				Status:   "processed",
			}, nil
		},
	})

	request := httptest.NewRequest(http.MethodPost, "/webhooks/providers/sandboxpay", strings.NewReader(`{"event_id":"evt_123"}`))
	request.SetPathValue("provider", "sandboxpay")
	recorder := httptest.NewRecorder()

	handler.HandleProviderEvent(recorder, request)

	if recorder.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", recorder.Code)
	}

	var payload model.WebhookHandleResult
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected JSON webhook response, got %v", err)
	}

	if payload.Status != "processed" {
		t.Fatalf("expected processed status, got %q", payload.Status)
	}
}

func TestHandleProviderEventRejectsInvalidSignature(t *testing.T) {
	handler := NewWebhookHandler(testLogger(), fakeWebhookService{
		handleProviderWebhook: func(ctx context.Context, provider string, headers http.Header, body []byte) (model.WebhookHandleResult, error) {
			return model.WebhookHandleResult{}, service.ErrWebhookVerificationFailed
		},
	})

	request := httptest.NewRequest(http.MethodPost, "/webhooks/providers/sandboxpay", strings.NewReader(`{"event_id":"evt_123"}`))
	request.SetPathValue("provider", "sandboxpay")
	recorder := httptest.NewRecorder()

	handler.HandleProviderEvent(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", recorder.Code)
	}

	var payload response.ErrorEnvelope
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("expected JSON error payload, got %v", err)
	}

	if payload.Error.Code != "webhook_not_verified" {
		t.Fatalf("expected webhook_not_verified, got %q", payload.Error.Code)
	}
}
