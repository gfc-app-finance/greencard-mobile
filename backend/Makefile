APP_NAME ?= greencard-api
BINARY_DIR := bin
BINARY := $(BINARY_DIR)/api

.PHONY: run build test fmt vet tidy clean docker-build

run:
	go run ./cmd/api

build:
	@mkdir -p $(BINARY_DIR)
	go build -o $(BINARY) ./cmd/api

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...

tidy:
	go mod tidy

clean:
	rm -rf $(BINARY_DIR)

docker-build:
	docker build -t $(APP_NAME) .
