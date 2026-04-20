package middleware

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gfc-app-finance/greencard-mobile/backend/internal/response"
)

func Recover(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if recovered := recover(); recovered != nil {
					logger.Error(
						"panic recovered",
						slog.String("error", fmt.Sprint(recovered)),
						slog.String("request_id", GetRequestID(r.Context())),
						slog.String("method", r.Method),
						slog.String("path", r.URL.Path),
					)

					response.Error(
						w,
						http.StatusInternalServerError,
						"internal_server_error",
						"an unexpected error occurred",
						GetRequestID(r.Context()),
					)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
