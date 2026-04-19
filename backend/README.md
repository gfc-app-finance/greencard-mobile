# Greencard Backend API

This backend currently includes:

- Step 1 foundation
- Step 2 Supabase auth integration
- Step 3 current-user profile and verification state endpoints
- Step 4 accounts and balances retrieval

It currently sets up:

- Go module structure
- environment loading and validation
- HTTP server bootstrap
- Supabase auth configuration and JWT validation foundation
- current-user profile endpoints
- account and balance retrieval endpoints
- verification status modeling
- permission helper foundation for future feature gating
- structured logging
- middleware foundation
- consistent JSON responses
- health check endpoint
- protected route middleware and request-context user extraction
- Docker and Make targets

It does **not** include:

- accounts, balances, or transactions
- activity or support ticket endpoints
- business logic beyond auth and profile state

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

Route structure is intentionally simple:

- public routes: mounted directly, such as `/health`
- protected routes: mounted under `/v1/*` and wrapped with Supabase auth validation middleware

## Common Commands

```bash
make run
make build
make test
make fmt
make vet
make tidy
make docker-build
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
- expected profile columns are `id`, `full_name`, `date_of_birth`, `residential_address`, `nationality`, `verification_status`, `created_at`, and `updated_at`
- expected account columns are `id`, `user_id`, `currency`, `account_type`, `display_name`, `balance`, `available_balance`, `masked_identifier`, `provider`, `status`, `created_at`, and `updated_at`
- verification states currently supported are `basic`, `profile_completed`, `verified`, `under_review`, and `restricted`
- if a user has no stored accounts yet, or the account table is not ready in Supabase, the service falls back to seeded MVP account records through the service layer instead of hardcoding them in handlers
