package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestIDUsesCorrelationIDFallback(t *testing.T) {
	handler := RequestID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := GetRequestID(r.Context()); got != "corr_123" {
			t.Fatalf("expected correlation ID in request context, got %q", got)
		}
		w.WriteHeader(http.StatusNoContent)
	}))

	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	request.Header.Set(correlationIDHeader, "corr_123")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Header().Get(requestIDHeader) != "corr_123" {
		t.Fatalf("expected X-Request-ID response header to mirror correlation ID, got %q", recorder.Header().Get(requestIDHeader))
	}
	if recorder.Header().Get(correlationIDHeader) != "corr_123" {
		t.Fatalf("expected X-Correlation-ID response header, got %q", recorder.Header().Get(correlationIDHeader))
	}
}
