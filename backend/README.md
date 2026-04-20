# Greencard Backend API

This backend currently includes:

- Step 1 foundation
- Step 2 Supabase auth integration
- Step 3 current-user profile and verification state endpoints
- Step 4 accounts and balances retrieval
- Step 5 transaction creation and retrieval for funding, transfers, and payments
- Step 6 shared activity feed generation and retrieval
- Step 7 recipients and support tickets

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
- verification status modeling
- permission helper foundation for future feature gating
- structured logging
- middleware foundation
- consistent JSON responses
- health check endpoint
- protected route middleware and request-context user extraction
- Docker and Make targets

It does **not** include:

- webhook integrations or external payment rails
- ledger-grade balance mutation logic
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
  internal/repository     Supabase-backed data access
  internal/response       JSON/error response helpers
  internal/service        thin service layer
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

Optional defaults are already provided for:

- `APP_NAME`
- `APP_ENV`
- `APP_VERSION`
- `PORT`
- `LOG_LEVEL`
- HTTP timeout values
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROFILE_TABLE`
- `SUPABASE_ACCOUNT_TABLE`
- `SUPABASE_ACTIVITY_TABLE`
- `SUPABASE_FUNDING_TABLE`
- `SUPABASE_TRANSFER_TABLE`
- `SUPABASE_PAYMENT_TABLE`
- `SUPABASE_RECIPIENT_TABLE`
- `SUPABASE_SUPPORT_TICKET_TABLE`
- `SUPABASE_SUPPORT_MESSAGE_TABLE`
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

Health endpoint:

```text
GET /health
```

Protected auth test endpoint:

```text
GET /v1/auth/session
Authorization: Bearer <supabase-access-token>
```

It returns the authenticated user context extracted from the verified Supabase access token.

Current user profile endpoints:

```text
GET /v1/profile
PATCH /v1/profile
Authorization: Bearer <supabase-access-token>
```

Example profile update body:

```json
{
  "full_name": "Sodiq Ojodu",
  "date_of_birth": "2002-01-01",
  "residential_address": "12 Admiralty Way, Lekki",
  "nationality": "Nigerian"
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
  "account_id": "acct_ngn_1e6a15c4",
  "amount": 50000,
  "currency": "NGN"
}
```

Example transfer request:

```json
{
  "source_account_id": "acct_usd_1e6a15c4",
  "destination_account_id": "acct_gbp_1e6a15c4",
  "source_currency": "USD",
  "destination_currency": "GBP",
  "source_amount": 100
}
```

Example payment request:

```json
{
  "source_account_id": "acct_usd_1e6a15c4",
  "recipient_id": "recipient_uuid_here",
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

## Backend Permission Model

The backend enforces permission checks in the service layer, not in frontend-only flows.

- auth is required for all `/v1/*` routes
- ownership checks are centralized through the shared permission helper
- verification state gates money movement, recipient creation, and other restricted flows
- support tickets remain available even when a user is not fully verified
- account access and transaction access are scoped to the authenticated user and should fail without revealing cross-user resource existence

When adding a new protected endpoint:

1. authenticate through the shared middleware
2. validate the request body at the handler boundary
3. apply permission and ownership checks in the service layer
4. keep Supabase queries in repositories only
5. return sanitized errors and minimal response payloads

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
docker build -t greencard-api .
```

Run:

```bash
docker run --rm -p 8080:8080 --env-file .env greencard-api
```

## Notes

- the server fails fast if required environment variables are missing
- handlers are intentionally thin
- structured logging is ready from the start
- response helpers provide a consistent JSON error format
- protected routes validate Supabase access tokens before reaching handlers
- request context carries a sanitized authenticated user model for downstream handlers
- JWT verification prefers JWKS and falls back to Supabase Auth token introspection for legacy/shared-secret projects
- the profile repository expects a Supabase table named `profiles` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_profiles.sql`
- the account repository expects a Supabase table named `accounts` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_accounts.sql`
- the transaction repositories expect Supabase tables named `funding_transactions`, `transfer_transactions`, and `payment_transactions` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_transactions.sql`
- a follow-up migration is available at `supabase/migrations/20260419_alter_payment_transactions_add_recipient_id.sql` to link payments to saved recipients
- the activity repository expects a Supabase table named `activities` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_activities.sql`
- the recipient repository expects a Supabase table named `recipients` by default
- the support repositories expect Supabase tables named `support_tickets` and `support_ticket_messages` by default
- a checked-in Supabase migration is available at `supabase/migrations/20260419_create_recipients_and_support.sql`
- expected profile columns are `id`, `full_name`, `date_of_birth`, `residential_address`, `nationality`, `verification_status`, `created_at`, and `updated_at`
- expected account columns are `id`, `user_id`, `currency`, `account_type`, `display_name`, `balance`, `available_balance`, `masked_identifier`, `provider`, `status`, `created_at`, and `updated_at`
- expected funding transaction columns are `id`, `user_id`, `account_id`, `amount`, `currency`, `status`, `reference`, `created_at`, and `updated_at`
- expected transfer transaction columns are `id`, `user_id`, `source_account_id`, `destination_account_id`, `source_currency`, `destination_currency`, `source_amount`, `destination_amount`, `fx_rate`, `status`, `reference`, `created_at`, and `updated_at`
- expected payment transaction columns are `id`, `user_id`, `source_account_id`, `recipient_id`, `recipient_reference`, `payment_type`, `amount`, `currency`, `fee`, `fx_rate`, `total_amount`, `status`, `reference`, `created_at`, and `updated_at`
- expected activity columns are `id`, `user_id`, `type`, `title`, `subtitle`, `amount`, `currency`, `status`, `linked_entity_type`, `linked_entity_id`, `created_at`, and `updated_at`
- expected recipient columns are `id`, `user_id`, `type`, `full_name`, `bank_name`, `account_number`, `iban`, `routing_number`, `sort_code`, `swift_code`, `country`, `currency`, `nickname`, `created_at`, and `updated_at`
- expected support ticket columns are `id`, `user_id`, `title`, `issue_type`, `description`, `status`, `linked_entity_type`, `linked_entity_id`, `priority`, `created_at`, and `updated_at`
- expected support message columns are `id`, `ticket_id`, `sender_type`, `message`, and `created_at`
- verification states currently supported are `basic`, `profile_completed`, `verified`, `under_review`, and `restricted`
- if a user has no stored accounts yet, or the account table is not ready in Supabase, the account read layer may fall back to seeded MVP account records for Home/Accounts placeholders
- transaction creation does not use seeded accounts; funding, transfer, and payment writes require real owned account records from Supabase
- transaction creation permission is derived from the user verification state through the shared permission helper
- recipient creation permission is derived from the user verification state through the shared permission helper
- payment creation now requires a real owned `recipient_id`, and the backend stores a safe recipient label snapshot as `recipient_reference`
- mocked transaction progression helpers still exist for controlled dev/test simulation, but GET/list endpoints no longer mutate transaction status
- transaction creation does not mutate account balances yet; Step 5 is focused on transaction storage and retrieval only
- transaction events now create or update a shared activity item for:
  - funding created, completed, failed
  - transfer created, completed, failed
  - payment created, processing, completed, failed
- support ticket creation now creates a shared activity item
- recent activity returns a small most-recent slice suitable for the Home screen
- backend quality checks are enforced through the shared `quality` GitHub Actions workflow
