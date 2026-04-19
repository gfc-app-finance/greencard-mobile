package logger

import (
	"log/slog"
	"os"
	"strings"
)

func New(appName, env, level string) *slog.Logger {
	logLevel := parseLevel(level)

	options := &slog.HandlerOptions{
		Level:     logLevel,
		AddSource: env != "production",
	}

	var handler slog.Handler
	if env == "development" || env == "local" || env == "test" {
		handler = slog.NewTextHandler(os.Stdout, options)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, options)
	}

	return slog.New(handler).With(
		slog.String("app", appName),
		slog.String("env", env),
	)
}

func parseLevel(level string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
