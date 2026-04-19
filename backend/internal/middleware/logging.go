package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"
)

func RequestLogger(logger *slog.Logger) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			recorder := &responseRecorder{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
			}

			next.ServeHTTP(recorder, r)

			attrs := []slog.Attr{
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status_code", recorder.statusCode),
				slog.Int("bytes_written", recorder.bytesWritten),
				slog.String("duration", time.Since(start).String()),
				slog.String("request_id", GetRequestID(r.Context())),
			}

			switch {
			case recorder.statusCode >= http.StatusInternalServerError:
				logger.LogAttrs(context.Background(), slog.LevelError, "request completed", attrs...)
			case recorder.statusCode >= http.StatusBadRequest:
				logger.LogAttrs(context.Background(), slog.LevelWarn, "request completed", attrs...)
			default:
				logger.LogAttrs(context.Background(), slog.LevelInfo, "request completed", attrs...)
			}
		})
	}
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode   int
	bytesWritten int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Write(data []byte) (int, error) {
	bytesWritten, err := r.ResponseWriter.Write(data)
	r.bytesWritten += bytesWritten
	return bytesWritten, err
}
