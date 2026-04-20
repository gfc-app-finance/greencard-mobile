APP_NAME ?= greencard-api
BINARY_DIR := bin
BINARY := $(BINARY_DIR)/api

.PHONY: run build test fmt fmt-check vet tidy check clean docker-build

run:
	go run ./cmd/api

build:
	@mkdir -p $(BINARY_DIR)
	go build -o $(BINARY) ./cmd/api

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

check: fmt-check vet test build

clean:
	rm -rf $(BINARY_DIR)

docker-build:
	docker build -t $(APP_NAME) .
