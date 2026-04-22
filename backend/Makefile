APP_NAME ?= greencard-api
APP_VERSION ?= local
APP_COMMIT ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)
BUILD_DATE ?= $(shell date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo unknown)
BINARY_DIR := bin
BINARY := $(BINARY_DIR)/api

.PHONY: run build test fmt fmt-check vet tidy config-check check clean docker-build docker-smoke

run:
	go run ./cmd/api

build:
	@mkdir -p $(BINARY_DIR)
	go build -trimpath -ldflags="-s -w -X main.buildVersion=$(APP_VERSION) -X main.buildCommit=$(APP_COMMIT) -X main.buildDate=$(BUILD_DATE)" -o $(BINARY) ./cmd/api

test:
	go test ./...

fmt:
	go fmt ./...

fmt-check:
	@test -z "$$(gofmt -l ./cmd ./internal)" || (gofmt -l ./cmd ./internal && exit 1)

vet:
	go vet ./...

tidy:
	go mod tidy

config-check:
	APP_ENV=staging APP_VERSION=$(APP_VERSION) SUPABASE_URL=https://placeholder.supabase.co SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role go run ./cmd/api check-config

check: fmt-check vet test build config-check

clean:
	rm -rf $(BINARY_DIR)

docker-build:
	docker build --build-arg APP_VERSION=$(APP_VERSION) --build-arg APP_COMMIT=$(APP_COMMIT) --build-arg BUILD_DATE=$(BUILD_DATE) -t $(APP_NAME) .

docker-smoke: docker-build
	docker run --rm -e SUPABASE_URL=https://placeholder.supabase.co -e SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role $(APP_NAME) check-config
