# Deployment Environments

This guide explains how GreenCard Finance separates local, staging, and production configuration for the mobile frontend and Go backend.

The short version: frontend env vars are public mobile-safe values, backend env vars may include secrets, and staging/production must never use local shortcuts.

## Environment Map

| Environment | Purpose                              | Data Source                           | Secret Location                                          | Safety Posture                                   |
| ----------- | ------------------------------------ | ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| Local       | Developer work and fast debugging    | local/dev Supabase project            | local uncommitted `.env` files                           | developer conveniences are allowed when explicit |
| Staging     | End-to-end testing before production | dedicated staging Supabase project    | deployment secret store and GitHub `staging` environment | production-like, no simulated money shortcuts    |
| Production  | Real users and real money            | dedicated production Supabase project | production secret manager only                           | strictest validation and no debug shortcuts      |

## Files And Secret Stores

| File or Store                  | Environment                    | Contents                                  | Commit? |
| ------------------------------ | ------------------------------ | ----------------------------------------- | ------- |
| `.env.example`                 | local frontend template        | public Expo values only                   | yes     |
| `.env`                         | local frontend values          | public Expo values for local/dev          | no      |
| `.env.staging.example`         | staging frontend template      | public Expo values only                   | yes     |
| `backend/.env.example`         | local backend template         | placeholder backend config                | yes     |
| `backend/.env`                 | local backend values           | local backend secrets and config          | no      |
| `backend/.env.staging.example` | staging backend template       | placeholder staging backend config        | yes     |
| `backend/.env.staging`         | local staging smoke tests only | staging backend secrets if needed locally | no      |
| deployment platform secrets    | staging/production             | real backend secrets                      | no      |
| GitHub Environments            | staging/production validation  | CI/deploy secrets                         | no      |

Never commit real `.env`, `.env.staging`, `.env.production`, service-role keys, provider API keys, webhook secrets, private keys, or raw credential exports.

## Local Environment

Local is for day-to-day development. It may point to a disposable Supabase project and may enable explicit development helpers.

Frontend setup:

```powershell
Copy-Item .env.example .env
```

Backend setup:

```powershell
Copy-Item backend\.env.example backend\.env
```

Recommended local values:

```dotenv
APP_ENV=development
APP_VERSION=dev
LOG_LEVEL=debug
WORKER_ENABLED=false
ENABLE_TRANSACTION_SIMULATION=true
WORKER_ENABLE_SIMULATION_PROGRESSION=true
RATE_LIMIT_ENABLED=true
KYC_PROVIDER=disabled
```

Local rules:

- Use a local/dev Supabase project, not staging or production.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in `backend/.env`.
- Do not put backend secrets in Expo public env vars.
- Use simulation helpers only for development testing.

## Staging Environment

Staging is for testing the frontend and backend together before production. It should behave like production for money and lifecycle safety.

Use:

- root `.env.staging.example` for public frontend staging values
- `backend/.env.staging.example` for backend staging config
- `STAGING_SECRETS_CHECKLIST.md` for staging secret setup and review
- GitHub Environment named `staging` for workflow secrets
- a dedicated staging Supabase project

Required staging safety values:

```dotenv
APP_ENV=staging
ENABLE_SEEDED_ACCOUNT_FALLBACK=false
ENABLE_TRANSACTION_SIMULATION=false
WORKER_ENABLE_SIMULATION_PROGRESSION=false
RATE_LIMIT_ENABLED=true
```

Staging rules:

- Never point staging at production Supabase.
- Never use production provider credentials in staging.
- Workers may be enabled, but worker simulation progression must stay disabled.
- Provider credentials should be sandbox credentials or disabled.
- Verify `/live` and `/ready` before connecting the frontend.

See `backend/STAGING.md` for the staging deployment checklist.

## Production Environment

Production is for real users and real money. Production should only use deployment secret management, not local env files.

Required production safety values:

```dotenv
APP_ENV=production
APP_VERSION=<release-version-or-commit-sha>
LOG_LEVEL=info
ENABLE_SEEDED_ACCOUNT_FALLBACK=false
ENABLE_TRANSACTION_SIMULATION=false
WORKER_ENABLE_SIMULATION_PROGRESSION=false
RATE_LIMIT_ENABLED=true
```

Production rules:

- `APP_VERSION` must not be `dev`.
- `LOG_LEVEL=debug` is rejected.
- `RATE_LIMIT_ENABLED=false` is rejected.
- If `KYC_PROVIDER=smileid`, then `SMILE_ID_ENVIRONMENT=production` is required.
- Use production Supabase and production provider credentials only.
- Secrets must live in the production secret manager.

## Frontend Environment Variables

Frontend variables are bundled into the mobile/web app when prefixed with `EXPO_PUBLIC_`. Treat them as public.

| Variable                               | Required                   | Used For                                 | Local                           | Staging             | Production             |
| -------------------------------------- | -------------------------- | ---------------------------------------- | ------------------------------- | ------------------- | ---------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`             | yes                        | Supabase auth/client URL used by the app | dev project URL                 | staging project URL | production project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes                        | Public Supabase client key               | dev public key                  | staging public key  | production public key  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`        | optional legacy            | fallback public Supabase key name        | avoid if publishable key exists | avoid               | avoid                  |
| `EXPO_PUBLIC_API_BASE_URL`             | when frontend calls Go API | deployed Go backend base URL             | `http://localhost:8080`         | staging API URL     | production API URL     |

Frontend safety:

- Never use `SUPABASE_SERVICE_ROLE_KEY` in frontend env.
- Never add provider secrets to Expo env.
- Assume every `EXPO_PUBLIC_` value can be read by users.

## Backend Core Variables

| Variable      | Required             | Default         | Used For                                              | Environment Notes                                 |
| ------------- | -------------------- | --------------- | ----------------------------------------------------- | ------------------------------------------------- |
| `APP_NAME`    | no                   | `greencard-api` | service name in logs and health responses             | usually same everywhere                           |
| `APP_ENV`     | strongly recommended | `development`   | validation profile and environment label              | set explicitly in every deployed environment      |
| `APP_VERSION` | production yes       | `dev`           | release/build identifier in logs and health responses | production rejects `dev`                          |
| `PORT`        | no                   | `8080`          | HTTP listen port                                      | hosting platform may override                     |
| `LOG_LEVEL`   | no                   | `info`          | structured log verbosity                              | local may use `debug`; production rejects `debug` |

## Backend Supabase Variables

| Variable                          | Required | Used For                                 | Notes                               |
| --------------------------------- | -------- | ---------------------------------------- | ----------------------------------- |
| `SUPABASE_URL`                    | yes      | Supabase project base URL                | must match the environment project  |
| `SUPABASE_SERVICE_ROLE_KEY`       | yes      | backend-only Supabase REST/admin access  | secret, never expose to frontend    |
| `SUPABASE_PUBLISHABLE_KEY`        | no       | optional backend awareness of public key | not a replacement for service role  |
| `SUPABASE_PROFILE_TABLE`          | no       | profile table name                       | default `profiles`                  |
| `SUPABASE_ACCOUNT_TABLE`          | no       | account table name                       | default `accounts`                  |
| `SUPABASE_ACTIVITY_TABLE`         | no       | activity table name                      | default `activities`                |
| `SUPABASE_BALANCE_MOVEMENT_TABLE` | no       | balance movement ledger table            | default `account_balance_movements` |
| `SUPABASE_AUDIT_LOG_TABLE`        | no       | audit log table                          | default `audit_logs`                |
| `SUPABASE_WEBHOOK_EVENT_TABLE`    | no       | provider webhook event table             | default `provider_webhook_events`   |
| `SUPABASE_FUNDING_TABLE`          | no       | funding transactions                     | default `funding_transactions`      |
| `SUPABASE_TRANSFER_TABLE`         | no       | transfer transactions                    | default `transfer_transactions`     |
| `SUPABASE_PAYMENT_TABLE`          | no       | payment transactions                     | default `payment_transactions`      |
| `SUPABASE_IDEMPOTENCY_TABLE`      | no       | idempotency records                      | default `idempotency_keys`          |
| `SUPABASE_RECIPIENT_TABLE`        | no       | saved recipients                         | default `recipients`                |
| `SUPABASE_SUPPORT_TICKET_TABLE`   | no       | support tickets                          | default `support_tickets`           |
| `SUPABASE_SUPPORT_MESSAGE_TABLE`  | no       | support ticket messages                  | default `support_ticket_messages`   |

Table-name variables are validated as safe identifiers. Use them only if an environment intentionally uses non-default table names.

## Backend Safety Flags

| Variable                               | Required | Default                           | Used For                               | Staging/Production Rule                  |
| -------------------------------------- | -------- | --------------------------------- | -------------------------------------- | ---------------------------------------- |
| `ENABLE_SEEDED_ACCOUNT_FALLBACK`       | no       | `false`                           | local read-side fallback accounts      | rejected if `true` in staging/production |
| `ENABLE_TRANSACTION_SIMULATION`        | no       | `true` outside staging/production | explicit development simulation routes | rejected if `true` in staging/production |
| `WORKER_ENABLE_SIMULATION_PROGRESSION` | no       | follows transaction simulation    | simulated worker progression           | rejected if `true` in staging/production |

These flags should never be used to make staging demos look real. If staging needs account or transaction data, seed the staging Supabase database deliberately.

## Backend Worker Variables

| Variable                              | Required | Default                                       | Used For                                 |
| ------------------------------------- | -------- | --------------------------------------------- | ---------------------------------------- |
| `WORKER_ENABLED`                      | no       | `true` in staging/production, `false` locally | background worker engine                 |
| `WORKER_POLL_INTERVAL`                | no       | `15s`                                         | worker polling cadence                   |
| `WORKER_BATCH_SIZE`                   | no       | `100`                                         | max items per worker pass                |
| `WORKER_JOB_LOCK_TTL`                 | no       | `2m`                                          | async job lock expiration                |
| `WORKER_MAX_ATTEMPTS`                 | no       | `5`                                           | max retry attempts                       |
| `WORKER_RECONCILIATION_AGE`           | no       | `2m`                                          | minimum age before reconciliation checks |
| `WORKER_RETRY_EVALUATION_AGE`         | no       | `2m`                                          | minimum age before retry checks          |
| `WORKER_FUNDING_PENDING_TIMEOUT`      | no       | `15m`                                         | stale funding timeout                    |
| `WORKER_TRANSFER_CONVERTING_TIMEOUT`  | no       | `20m`                                         | stale transfer timeout                   |
| `WORKER_PAYMENT_SUBMITTED_TIMEOUT`    | no       | `10m`                                         | stale submitted payment timeout          |
| `WORKER_PAYMENT_UNDER_REVIEW_TIMEOUT` | no       | `20m`                                         | stale under-review payment timeout       |
| `WORKER_PAYMENT_PROCESSING_TIMEOUT`   | no       | `30m`                                         | stale processing payment timeout         |

Worker values must be positive durations or positive integers.

## Backend Rate Limit Variables

| Variable                            | Required | Default | Used For                                  |
| ----------------------------------- | -------- | ------- | ----------------------------------------- |
| `RATE_LIMIT_ENABLED`                | no       | `true`  | enables API rate limiting                 |
| `RATE_LIMIT_TRUST_PROXY_HEADERS`    | no       | `false` | allows `X-Forwarded-For`/proxy client IPs |
| `RATE_LIMIT_GLOBAL_REQUESTS`        | no       | `300`   | unauthenticated/global limit count        |
| `RATE_LIMIT_GLOBAL_WINDOW`          | no       | `1m`    | unauthenticated/global limit window       |
| `RATE_LIMIT_AUTHENTICATED_REQUESTS` | no       | `900`   | authenticated user limit count            |
| `RATE_LIMIT_AUTHENTICATED_WINDOW`   | no       | `1m`    | authenticated user limit window           |
| `RATE_LIMIT_SENSITIVE_REQUESTS`     | no       | `20`    | sensitive write limit count               |
| `RATE_LIMIT_SENSITIVE_WINDOW`       | no       | `1m`    | sensitive write limit window              |
| `RATE_LIMIT_WEBHOOK_REQUESTS`       | no       | `120`   | webhook limit count                       |
| `RATE_LIMIT_WEBHOOK_WINDOW`         | no       | `1m`    | webhook limit window                      |

Only set `RATE_LIMIT_TRUST_PROXY_HEADERS=true` behind trusted infrastructure that overwrites forwarded headers. Do not enable it on a raw public server.

## Backend Timeouts

| Variable                      | Required | Default | Used For                         |
| ----------------------------- | -------- | ------- | -------------------------------- |
| `HTTP_READ_TIMEOUT`           | no       | `10s`   | inbound request read timeout     |
| `HTTP_WRITE_TIMEOUT`          | no       | `15s`   | response write timeout           |
| `HTTP_IDLE_TIMEOUT`           | no       | `60s`   | keep-alive idle timeout          |
| `HTTP_SHUTDOWN_TIMEOUT`       | no       | `10s`   | graceful shutdown window         |
| `SUPABASE_AUTH_TIMEOUT`       | no       | `5s`    | Supabase auth/JWT fallback calls |
| `SUPABASE_JWKS_CACHE_TTL`     | no       | `10m`   | JWKS cache duration              |
| `SUPABASE_REST_TIMEOUT`       | no       | `5s`    | Supabase REST calls              |
| `WEBHOOK_SIGNATURE_TOLERANCE` | no       | `5m`    | accepted webhook timestamp skew  |

Timeout values must be valid Go durations such as `5s`, `2m`, or `1h`.

## Webhook And Provider Variables

| Variable                      | Required                             | Default            | Used For                             | Secret?                             |
| ----------------------------- | ------------------------------------ | ------------------ | ------------------------------------ | ----------------------------------- |
| `WEBHOOK_SANDBOXPAY_SECRET`   | when SandboxPay webhooks are enabled | empty              | verifies provider webhook signatures | yes                                 |
| `KYC_PROVIDER`                | no                                   | `disabled`         | KYC provider selector                | no                                  |
| `SMILE_ID_ENVIRONMENT`        | when Smile ID enabled                | `sandbox`          | Smile ID environment                 | no                                  |
| `SMILE_ID_PARTNER_ID`         | when Smile ID enabled                | empty              | Smile ID partner account             | keep server-side                    |
| `SMILE_ID_API_KEY`            | when Smile ID enabled                | empty              | Smile ID API signing key             | yes                                 |
| `SMILE_ID_BASE_URL`           | when Smile ID enabled                | empty              | Smile ID API base URL                | no secret, still server-side config |
| `SMILE_ID_SOURCE_SDK_VERSION` | no                                   | `greencard-go-1.0` | Smile ID request metadata            | no                                  |
| `SMILE_ID_TIMEOUT`            | no                                   | `10s`              | provider HTTP timeout                | no                                  |

If `KYC_PROVIDER=smileid`, the backend requires `SMILE_ID_PARTNER_ID`, `SMILE_ID_API_KEY`, and `SMILE_ID_BASE_URL`. Production also requires `SMILE_ID_ENVIRONMENT=production`.

## Startup Validation

The backend validates configuration at startup and through the explicit config check command:

```powershell
cd backend
go run ./cmd/api check-config
```

Docker smoke test:

```powershell
docker run --rm --env-file .env.staging greencard-api:staging check-config
```

Validation catches:

- missing `SUPABASE_URL`
- missing `SUPABASE_SERVICE_ROLE_KEY`
- invalid URLs
- invalid `APP_ENV`
- unsafe staging/production simulation flags
- `APP_VERSION=dev` in production
- `LOG_LEVEL=debug` in production
- disabled rate limiting in production
- Smile ID production mismatch
- invalid durations or non-positive worker/rate-limit values
- unsafe Supabase table identifiers

If validation fails, fix the environment before starting the server. Do not bypass validation to make a deploy pass.

## Environment Change Checklist

When adding or changing an env var:

1. Add it to `backend/internal/config` or the frontend config path.
2. Add it to the relevant `.env.example` file.
3. Document it in this file.
4. Decide whether it is public or secret.
5. Decide whether staging/production need stricter validation.
6. Add config tests if the value affects safety or startup behavior.
7. Update deployment secrets for staging and production.

## Manual Setup Still Required

- Create separate Supabase projects for local/dev, staging, and production.
- Add staging secrets to the GitHub `staging` environment.
- Complete `docs/STAGING_SECRETS_CHECKLIST.md` before treating staging as safe.
- Add production secrets to the production deployment secret manager.
- Configure the hosting platform health check to call `/ready`.
- Configure frontend staging builds with root `.env.staging.example` values.
- Apply staging database changes with `docs/SUPABASE_MIGRATION_CHECKLIST.md`.
- Verify deployed staging with `backend/scripts/verify-staging.ps1` and a staging test-user access token.
- Register provider sandbox/production credentials when those integrations are activated.
