# syntax=docker/dockerfile:1

FROM golang:1.22-alpine AS builder

ARG APP_VERSION=container
ARG APP_COMMIT=unknown
ARG BUILD_DATE=unknown

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w -X main.buildVersion=${APP_VERSION} -X main.buildCommit=${APP_COMMIT} -X main.buildDate=${BUILD_DATE}" \
    -o /out/api ./cmd/api

FROM alpine:3.20

ARG APP_VERSION=container
ARG APP_COMMIT=unknown
ARG BUILD_DATE=unknown

LABEL org.opencontainers.image.title="greencard-api" \
      org.opencontainers.image.description="GreenCard Finance backend API" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${APP_COMMIT}" \
      org.opencontainers.image.created="${BUILD_DATE}"

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -D -H -G app app

COPY --from=builder /out/api /usr/local/bin/api

USER app
WORKDIR /app

ENV APP_ENV=production \
    APP_VERSION=${APP_VERSION} \
    PORT=8080 \
    LOG_LEVEL=info

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:${PORT}/ready || exit 1

ENTRYPOINT ["/usr/local/bin/api"]
