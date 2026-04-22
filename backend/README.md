# Greencard Backend API

This backend currently includes:

- Step 1 foundation
- Step 2 Supabase auth integration
- Step 3 current-user profile and verification state endpoints
- Step 4 accounts and balances retrieval
- Step 5 transaction creation and retrieval for funding, transfers, and payments
- Step 6 shared activity feed generation and retrieval
- Step 7 recipients and support tickets
- production hardening foundations for transaction lifecycle safety, balance movements, provider webhook ingestion, async job coordination, and reconciliation checks
- real provider integration foundation with Smile ID Enhanced KYC as the first KYC provider
- durable audit/compliance logging for sensitive profile, KYC, money, recipient, support, and provider events
- configurable IP/user-aware rate limiting for global traffic, sensitive actions, and provider webhooks

It currently sets up:

- Go module structure
- environment loading and validation
- HTTP server bootstrap
- Supabase auth configuration and JWT validation foundation
- current-user profile endpoints
- account and balance retrieval endpoints
- transaction creation and status tracking endpoints
- shared activity feed endpoints
- saved recipient endpoints
- support ticket and ticket message endpoints
- async job ledger for distributed-safe worker claims
- reconciliation checks for transaction, balance movement, and webhook-state alignment
- provider abstraction for identity verification
- Smile ID Enhanced KYC REST client with signed requests and safe response mapping
- centralized audit service backed by an `audit_logs` table
- rate limiting middleware with tighter policies for sensitive write routes
- verification status modeling
- permission helper foundation for future feature gating
- structured logging
- middleware foundation
- consistent JSON responses
- health check endpoint
- protected route middleware and request-context user extraction
- Docker and Make targets
- deployment/operations runbook in `OPERATIONS.md`

It does **not** include:

- live funding/collection or cross-border payout provider API calls
- full double-entry accounting, reconciliation operations UI, or manual finance-ops tooling
- admin support tooling or live chat

## Folder Structure

```text
backend/
  cmd/api                 API entrypoint
  internal/config         env loading and validation
  internal/handler        HTTP handlers and router setup
  internal/logger         structured logger bootstrap
  internal/middleware     request ID, recovery, logging, security headers, auth guard
  internal/model          response models
  internal/provider       external provider clients and provider response mapping
  internal/repository     Supabase-backed data access
  internal/response       JSON/error response helpers
  internal/service        thin service layer
  internal/worker         background jobs and progression engine
  .env.example            local backend env template
  Dockerfile              container build
  Makefile                common dev commands
  go.mod                  Go module definition
```

## Environment

Copy the template and fill in the required values:

```bash
cp .env.example .env
```

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Production also requires:

- `APP_ENV=production`
- `APP_VERSION` set to a release version or commit SHA, not `dev`
- `RATE_LIMIT_ENABLED=true`
- `ENABLE_TRANSACTION_SIMULATION=false`
- `WORKER_ENABLE_SIMULATION_PROGRESSION=false`

Optional defaults are already provided for:

- `APP_NAME`
- `APP_ENV`
- `APP_VERSION`
- `PORT`
- `LOG_LEVEL`
- `ENABLE_SEEDED_ACCOUNT_FALLBACK`
- `ENABLE_TRANSACTION_SIMULATION`
- `WORKER_ENABLED`
- `WORKER_ENABLE_SIMULATION_PROGRESSION`
- worker polling and timeout values
- worker job lock, max-attempt, and reconciliation age values
- rate limit enablement, windows, thresholds, and proxy-header trust
- HTTP timeout values
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROFILE_TABLE`
- `SUPABASE_ACCOUNT_TABLE`
- `SUPABASE_ACTIVITY_TABLE`
- `SUPABASE_BALANCE_MOVEMENT_TABLE`
- `SUPABASE_AUDIT_LOG_TABLE`
- `SUPABASE_WEBHOOK_EVENT_TABLE`
- `SUPABASE_FUNDING_TABLE`
- `SUPABASE_TRANSFER_TABLE`
- `SUPABASE_PAYMENT_TABLE`
- `SUPABASE_IDEMPOTENCY_TABLE`
- `SUPABASE_RECIPIENT_TABLE`
- `SUPABASE_SUPPORT_TICKET_TABLE`
- `SUPABASE_SUPPORT_MESSAGE_TABLE`
- `WEBHOOK_SIGNATURE_TOLERANCE`
- `WEBHOOK_SANDBOXPAY_SECRET`
- `KYC_PROVIDER`
- `SMILE_ID_ENVIRONMENT`
- `SMILE_ID_PARTNER_ID`
- `SMILE_ID_API_KEY`
- `SMILE_ID_BASE_URL`
- `SMILE_ID_SOURCE_SDK_VERSION`
- `SMILE_ID_TIMEOUT`
- Supabase auth timeout and JWKS cache TTL
- Supabase REST timeout

## Run Locally

From the `backend` directory:

```bash
make run
```

Or with raw Go:

```bash
go run ./cmd/api
```

The API starts on:

```text
http://localhost:8080
```

When `WORKER_ENABLED=true`, the API process also starts an in-process background worker engine. The worker runs small operational jobs:

- transaction progression checks
- stale transaction timeout checks
- retry evaluation scans
- transaction/balance movement reconciliation checks
- provider webhook reconciliation checks

Those jobs do not mutate transactions directly. They call the same centralized transaction lifecycle update service used by authenticated routes and provider webhooks, so transition validation, activity sync, and balance-settlement safety stay in one place.

Mutable worker actions are guarded by `async_job_runs` claims keyed by the logical work item, such as `transaction_timeout:failed:funding_transaction:<reference>`. That makes repeated worker runs and multiple worker instances safer: only one claimant should process the same logical job, failed attempts are counted, and exhausted jobs are marked abandoned instead of looping forever.

Reconciliation jobs are intentionally read-only. They compare completed transactions against expected balance movement records and compare provider webhook receipts against internal transaction state, then log mismatches for follow-up. They do not bypass the transaction lifecycle or settlement service.

Health endpoint:

```text
GET /health
GET /live
GET /ready
```

`/health` and `/live` are liveness checks. `/ready` is the readiness endpoint intended for deployment and load-balancer health checks.

Protected auth test endpoint:

```text
GET /v1/auth/session
Authorization: Bearer <supabase-access-token>
```

Transaction creation requests support an optional `Idempotency-Key` header. When provided, the backend replays the first successful create response for matching retry requests and rejects key reuse for a different payload:

```text
Idempotency-Key: <unique-client-request-key>
```

When `ENABLE_TRANSACTION_SIMULATION=true` in non-production environments, explicit simulation routes are also available for controlled development testing:

```text
POST /v1/transactions/funding/{id}/simulate/advance
POST /v1/transactions/transfers/{id}/simulate/advance
POST /v1/transactions/payments/{id}/simulate/advance
Authorization: Bearer <supabase-access-token>
```

Transaction status changes now flow through one central transition engine. Valid transitions are:

- funding: `initiated -> pending -> completed`, with `failed` allowed from `initiated` or `pending`
- transfers: `initiated -> converting -> completed`, with `failed` allowed from `initiated` or `converting`
- payments: `submitted -> under_review -> processing -> completed`, with `failed` allowed from `submitted`, `under_review`, or `processing`

Invalid transitions are rejected with a `400 invalid_transaction_transition` response instead of being applied silently.

Provider webhook ingestion is now available through the public verified route:

```text
POST /webhooks/providers/sandboxpay
X-Sandboxpay-Timestamp: <unix-seconds>
X-Sandboxpay-Signature: sha256=<hmac-of-timestamp-dot-body>
```

The current provider foundation uses a safe placeholder HMAC verification scheme that can be swapped later for real provider signing logic. Webhook payloads are mapped into the existing centralized transaction status update service, so webhook-driven completions reuse the same activity sync and balance-settlement path as the rest of the backend lifecycle engine.

When background simulation progression is enabled with `WORKER_ENABLE_SIMULATION_PROGRESSION=true` in non-production environments, the worker can also advance placeholder transaction lifecycles over time instead of relying only on the explicit `/simulate/advance` routes.

Balance mutations now happen only when a transaction reaches its committed completion stage:

- funding credits the target account only on `completed`
- transfers debit the source account and credit the destination account only on `completed`
- payments debit the source account only on `completed`

Those settlement effects are recorded in `account_balance_movements`, and repeated completion events are protected from double-applying the same money movement.

It returns the authenticated user context extracted from the verified Supabase access token.

Current user profile endpoints:

```text
GET /v1/profile
PATCH /v1/profile
Authorization: Bearer <supabase-access-token>
```

Identity verification endpoint:

```text
POST /v1/verification/identity
Authorization: Bearer <supabase-access-token>
```

When `KYC_PROVIDER=smileid`, this endpoint submits a signed Smile ID Enhanced KYC REST request to the configured Smile ID environment. Raw ID numbers are sent only to the provider and are not stored or returned by the API.

Smile ID result mapping:

- approved / valid ID result -> `verified`
- pending / issuer unavailable result -> `under_review`
- rejected / invalid ID result -> `restricted`
- provider HTTP/config/unexpected failures -> sanitized service errors without changing profile state

Example profile update body:

```json
{
  "full_name": "Sodiq Ojodu",
  "date_of_birth": "2002-01-01",
  "residential_address": "12 Admiralty Way, Lekki",
  "nationality": "Nigerian"
}
```

Example identity verification request:

```json
{
  "country": "NG",
  "id_type": "NIN_V2",
  "id_number": "12345678901",
  "first_name": "Sodiq",
  "last_name": "Ojodu",
  "date_of_birth": "2002-01-01",
  "phone_number": "08012345678"
}
```

Account endpoints:

```text
GET /v1/accounts
GET /v1/accounts/{id}
Authorization: Bearer <supabase-access-token>
```

Transaction endpoints:

```text
POST /v1/transactions/funding
GET /v1/transactions/funding
GET /v1/transactions/funding/{id}

POST /v1/transactions/transfers
GET /v1/transactions/transfers
GET /v1/transactions/transfers/{id}

POST /v1/transactions/payments
GET /v1/transactions/payments
GET /v1/transactions/payments/{id}

Authorization: Bearer <supabase-access-token>
```

Activity endpoints:

```text
GET /v1/activity
GET /v1/activity/recent
Authorization: Bearer <supabase-access-token>
```

Recipient endpoints:

```text
POST /v1/recipients
GET /v1/recipients
GET /v1/recipients/{id}
Authorization: Bearer <supabase-access-token>
```

Support endpoints:

```text
POST /v1/support/tickets
GET /v1/support/tickets
GET /v1/support/tickets/{id}
POST /v1/support/tickets/{id}/messages
GET /v1/support/tickets/{id}/messages
Authorization: Bearer <supabase-access-token>
```

Example funding request:

```json
{
  "account_id": "4ac1f2d8-3f77-4cf1-b16d-5c0dc30b9001",
  "amount": 50000,
  "currency": "NGN"
}
```

Example transfer request:

```json
{
  "source_account_id": "4ac1f2d8-3f77-4cf1-b16d-5c0dc30b9001",
  "destination_account_id": "8d15d31a-a82c-4e0f-8550-4ab28608cbe4",
  "source_currency": "USD",
  "destination_currency": "GBP",
  "source_amount": 100
}
```

Example payment request:

```json
{
  "source_account_id": "4ac1f2d8-3f77-4cf1-b16d-5c0dc30b9001",
  "recipient_id": "6f0ac962-e6b5-44db-995a-5ac4c9a7a0e9",
  "payment_type": "international",
  "amount": 250,
  "currency": "USD"
}
```

Example recipient request:

```json
{
  "type": "international_bank",
  "full_name": "John Doe",
  "bank_name": "Barclays",
  "iban": "GB29NWBK60161331926819",
  "swift_code": "BARCGB22",
  "country": "United Kingdom",
  "currency": "GBP",
  "nickname": "John UK"
}
```

Example support ticket request:

```json
{
  "title": "Payment failed after submission",
  "issue_type": "payment_failed",
  "description": "My USD payment failed after review and I need help checking the status.",
  "linked_entity_type": "payment_transaction",
  "linked_entity_id": "payment_txn_id_here",
  "priority": "normal"
}
```

Route structure is intentionally simple:

- public routes: mounted directly, such as `/health`
- protected routes: mounted under `/v1/*` and wrapped with Supabase auth validation middleware

## Common Commands

```bash
make run
make build
make test
make fmt
make fmt-check
make vet
make check
make tidy
make docker-build
```

Validate runtime configuration without starting the server:

```bash
go run ./cmd/api check-config
```

## Backend Permission Model

The backend enforces permission checks in the service layer, not in frontend-only flows.

- auth is required for all `/v1/*` routes
- ownership checks are centralized through the shared permission helper
- verification state gates money movement, recipient creation, and other restricted flows
- support tickets remain available even when a user is not fully verified
- account access and transaction access are scoped to the authenticated user and should fail without revealing cross-user resource existence
- global traffic is rate-limited by client IP, while authenticated `/v1` traffic is additionally rate-limited by authenticated user ID where available

When adding a new protected endpoint:

1. authenticate through the shared middleware
2. validate the request body at the handler boundary
3. apply permission and ownership checks in the service layer
4. keep Supabase queries in repositories only
5. record an audit event for sensitive writes, permission denials, or money-affecting state changes
6. return sanitized errors and minimal response payloads

## Backend Quality Checks

Backend CI now runs:

- formatting check with `gofmt`
- `go test ./...`
- `go vet ./...`
- `go build ./cmd/api`

Run the same checks locally from `backend/` with:

```bash
make check
```

## Docker

Build from the `backend` directory:

```bash
make docker-build APP_VERSION=<release-version>
```

Run:

```bash
docker run --rm -p 8080:8080 --env-file .env greencard-api
```

The container runs as a non-root user and includes a Docker healthcheck against `/ready`.

## Operations

See `OPERATIONS.md` for deployment, health check, logging, config smoke test, and troubleshooting guidance.

## Notes

- the server fails fast if required environment variables are missing
- handlers are intentionally thin
- structured logging is ready from the start
- response helpers provide a consistent JSON error format
- rate limiting returns a consistent `429 rate_limit_exceeded` JSON response with `Retry-After`
- protected routes validate Supabase access tokens before reaching handlers
- request context carries a sanitized authenticated user model for downstream handlers
- `X-Request-ID` and `X-Correlation-ID` are mirrored for request tracing
- JWT verification prefers JWKS and falls back to Supabase Auth token introspection for legacy/shared-secret projects
- the profile repository expects a Supabase table named `profiles` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_profiles.sql`
- the account repository expects a Supabase table named `accounts` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_accounts.sql`
- the transaction repositories expect Supabase tables named `funding_transactions`, `transfer_transactions`, and `payment_transactions` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_transactions.sql`
- a follow-up migration is available at `supabase/migrations/20260419_alter_payment_transactions_add_recipient_id.sql` to link payments to saved recipients
- a follow-up migration is available at `supabase/migrations/20260420_alter_transactions_add_status_metadata.sql` to add `status_reason` and `status_source` fields across transaction tables
- a follow-up migration is available at `supabase/migrations/20260420_alter_transactions_add_last_status_change_at.sql` to add `last_status_change_at` and keep completion SQL functions aligned with lifecycle metadata
- a checked-in migration is available at `supabase/migrations/20260420_create_provider_webhook_events.sql` to add provider webhook event receipts/audit records and unique transaction reference indexes
- a checked-in migration is available at `supabase/migrations/20260421_create_async_job_runs.sql` to add distributed-safe worker claim records and completion RPCs
- the idempotency repository expects a Supabase table named `idempotency_keys` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260420_create_idempotency_keys.sql`
- the activity repository expects a Supabase table named `activities` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_activities.sql`
- the balance movement repository expects a Supabase table named `account_balance_movements` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260420_create_balance_movements.sql`
- the audit log repository expects a Supabase table named `audit_logs` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260422_create_audit_logs.sql`
- the webhook event repository expects a Supabase table named `provider_webhook_events` by default
- the async job repository expects a Supabase table named `async_job_runs` by default
- the recipient repository expects a Supabase table named `recipients` by default
- the support repositories expect Supabase tables named `support_tickets` and `support_ticket_messages` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_recipients_and_support.sql`
- expected profile columns are `id`, `full_name`, `date_of_birth`, `residential_address`, `nationality`, `verification_status`, `created_at`, and `updated_at`
- expected account columns are `id`, `user_id`, `currency`, `account_type`, `display_name`, `balance`, `available_balance`, `masked_identifier`, `provider`, `status`, `created_at`, and `updated_at`
- expected funding transaction columns are `id`, `user_id`, `account_id`, `amount`, `currency`, `status`, `status_reason`, `status_source`, `last_status_change_at`, `reference`, `created_at`, and `updated_at`
- expected transfer transaction columns are `id`, `user_id`, `source_account_id`, `destination_account_id`, `source_currency`, `destination_currency`, `source_amount`, `destination_amount`, `fx_rate`, `status`, `status_reason`, `status_source`, `last_status_change_at`, `reference`, `created_at`, and `updated_at`
- expected payment transaction columns are `id`, `user_id`, `source_account_id`, `recipient_id`, `recipient_reference`, `payment_type`, `amount`, `currency`, `fee`, `fx_rate`, `total_amount`, `status`, `status_reason`, `status_source`, `last_status_change_at`, `reference`, `created_at`, and `updated_at`
- expected idempotency key columns are `id`, `user_id`, `operation`, `idempotency_key`, `request_hash`, `response_status`, `response_body`, `created_at`, and `updated_at`
- expected activity columns are `id`, `user_id`, `type`, `title`, `subtitle`, `amount`, `currency`, `status`, `linked_entity_type`, `linked_entity_id`, `created_at`, and `updated_at`
- expected balance movement columns are `id`, `user_id`, `account_id`, `linked_entity_type`, `linked_entity_id`, `movement_type`, `direction`, `amount`, `currency`, and `created_at`
- expected audit log columns are `id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `source`, `metadata_summary`, `request_id`, `ip_summary`, `provider`, `correlation_id`, and `created_at`
- expected webhook event columns are `id`, `provider`, `event_id`, `event_type`, `linked_entity_type`, `linked_entity_id`, `linked_reference`, `processing_status`, `status_message`, `received_at`, `processed_at`, and `updated_at`
- expected async job columns are `id`, `job_key`, `job_type`, `entity_type`, `entity_id`, `status`, `attempt_count`, `max_attempts`, `last_error`, `last_processed_at`, `locked_until`, `created_at`, and `updated_at`
- expected recipient columns are `id`, `user_id`, `type`, `full_name`, `bank_name`, `account_number`, `iban`, `routing_number`, `sort_code`, `swift_code`, `country`, `currency`, `nickname`, `created_at`, and `updated_at`
- expected support ticket columns are `id`, `user_id`, `title`, `issue_type`, `description`, `status`, `linked_entity_type`, `linked_entity_id`, `priority`, `created_at`, and `updated_at`
- expected support message columns are `id`, `ticket_id`, `sender_type`, `message`, and `created_at`
- verification states currently supported are `basic`, `profile_completed`, `verified`, `under_review`, and `restricted`
- seeded account fallback on read paths is now disabled by default and should stay off for broader external testing; it can be re-enabled only with `ENABLE_SEEDED_ACCOUNT_FALLBACK=true` for local demos
- transaction creation does not use seeded accounts; funding, transfer, and payment writes require real owned account records from Supabase
- transaction creation permission is derived from the user verification state through the shared permission helper
- recipient creation permission is derived from the user verification state through the shared permission helper
- payment creation now requires a real owned `recipient_id`, and the backend stores a safe recipient label snapshot as `recipient_reference`
- transaction create endpoints support `Idempotency-Key` request deduplication for safe retries
- transaction status updates are enforced centrally through the transaction service `UpdateFundingStatus`, `UpdateTransferStatus`, and `UpdatePaymentStatus` paths, and invalid lifecycle transitions are rejected instead of being applied silently
- mocked transaction progression helpers are only exposed through the explicit `/simulate/advance` routes when `ENABLE_TRANSACTION_SIMULATION=true`, and GET/list endpoints do not mutate transaction status
- transaction status updates also synchronize the matching activity item so feed status stays aligned with the source transaction state
- transaction completion now applies account balance effects through atomic database settlement functions and records matching balance movements for auditability
- sensitive writes and money lifecycle events also write durable compliance audit records through the centralized audit service
- audit metadata is summarized and redacted before persistence; raw tokens, secrets, account numbers, ID numbers, BVN/NIN values, and full provider payloads must not be stored in `audit_logs`
- rate limiting defaults are practical MVP limits: global `300/min/IP`, authenticated `900/min/user`, sensitive writes `20/min/user`, and webhooks `120/min/IP`
- `RATE_LIMIT_TRUST_PROXY_HEADERS=false` by default; enable it only when the API is behind a trusted proxy that controls `X-Forwarded-For` or `X-Real-IP`
- repeated completion events are idempotent from the balance perspective because the settlement layer checks for existing movement effects before applying balance changes again
- `last_status_change_at` tracks the last real lifecycle transition timestamp, while `updated_at` can also move when safe metadata refreshes happen on already-settled transactions
- provider webhook deliveries are tracked in `provider_webhook_events`, and already-processed `(provider, event_id)` deliveries are ignored safely
- webhook processing never mutates transaction rows directly from the handler; it maps the event into the shared transaction status updater by internal reference
- identity verification provider calls go through `internal/provider` clients and the identity verification service, not HTTP handlers
- Smile ID requests are signed with HMAC-SHA256 using the configured partner ID/API key and request timestamp
- Smile ID callback signature confirmation is available in the provider client for the future KYC callback route
- funding, transfer, and payment creation validate source-account affordability up front, but completion still performs the final sufficient-balance safety check before debiting
- provider/webhook-driven status updates are implemented through verified provider webhook routes; non-production simulation remains available only as an explicit development helper
- transaction creation itself still does not mutate account balances; balance changes only happen on committed completion
- transaction events now create or update a shared activity item for:
  - funding created, completed, failed
  - transfer created, completed, failed
  - payment created, processing, completed, failed
- support ticket creation now creates a shared activity item
- recent activity returns a small most-recent slice suitable for the Home screen
- backend quality checks are enforced through the shared `quality` GitHub Actions workflow
