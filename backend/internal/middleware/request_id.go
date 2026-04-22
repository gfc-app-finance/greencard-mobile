package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"
)

const requestIDHeader = "X-Request-ID"
const correlationIDHeader = "X-Correlation-ID"

type contextKey string

const requestIDContextKey contextKey = "request_id"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get(requestIDHeader)
		if requestID == "" {
			requestID = r.Header.Get(correlationIDHeader)
		}
		if requestID == "" {
			requestID = newRequestID()
		}

		w.Header().Set(requestIDHeader, requestID)
		w.Header().Set(correlationIDHeader, requestID)

		ctx := context.WithValue(r.Context(), requestIDContextKey, requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetRequestID(ctx context.Context) string {
	if value, ok := ctx.Value(requestIDContextKey).(string); ok {
		return value
	}

	return ""
}

func newRequestID() string {
	buffer := make([]byte, 12)
	if _, err := rand.Read(buffer); err == nil {
		return hex.EncodeToString(buffer)
	}

	return fmt.Sprintf("req_%d", time.Now().UnixNano())
}
