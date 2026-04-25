# GreenCard Backend Staging Deployment

This runbook describes the practical staging setup for the GreenCard Finance backend. Staging should be close enough to production that the frontend and backend can be tested together safely, but it should use separate Supabase resources and sandbox provider credentials.

## Purpose

Use staging to verify:

- frontend-to-backend API integration before production
- Supabase auth and database access against non-production data
- provider webhook plumbing with sandbox secrets
- background workers, readiness, rate limiting, and startup validation
- Docker image behavior before a production rollout

## Environment Separation

Local development is allowed to use developer conveniences such as explicit simulation routes when enabled. Staging and production are stricter.

| Area                          | Local                            | Staging                   | Production                   |
| ----------------------------- | -------------------------------- | ------------------------- | ---------------------------- |
| `APP_ENV`                     | `development`                    | `staging`                 | `production`                 |
| Supabase project              | local/dev project                | dedicated staging project | dedicated production project |
| Seeded account fallback       | optional local-only              | disabled and rejected     | disabled and rejected        |
| Transaction simulation        | optional local-only              | disabled and rejected     | disabled and rejected        |
| Worker simulation progression | optional local-only              | disabled and rejected     | disabled and rejected        |
| Rate limiting                 | enabled by default, can be tuned | enabled                   | required                     |
| Provider credentials          | sandbox or disabled              | sandbox                   | production credentials only  |
| Data                          | disposable/dev                   | staging test data         | real user data               |

## Required Staging Configuration

Use `backend/.env.staging.example` as the backend template. Copy values into the deployment platform's staging secret/config store, not into Git.

For the complete local/staging/production environment variable reference, see `../docs/DEPLOYMENT_ENVIRONMENTS.md`.

For the staging secret setup/review checklist, see `../docs/STAGING_SECRETS_CHECKLIST.md`.

Required values:

- `APP_ENV=staging`
- `APP_VERSION=<commit-sha-or-release-label>`
- `SUPABASE_URL=<staging-supabase-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>`

Required safety values:

- `ENABLE_SEEDED_ACCOUNT_FALLBACK=false`
- `ENABLE_TRANSACTION_SIMULATION=false`
- `WORKER_ENABLE_SIMULATION_PROGRESSION=false`
- `RATE_LIMIT_ENABLED=true`

Recommended values:

- `WORKER_ENABLED=true`
- `LOG_LEVEL=info`
- `WEBHOOK_SANDBOXPAY_SECRET=<staging-webhook-secret>`
- `KYC_PROVIDER=disabled` until sandbox Smile ID credentials are available

Frontend public staging values live in the root `.env.staging.example`. These must only contain mobile-safe public values, never service-role keys.

## GitHub Environment Setup

Create a GitHub Environment named `staging` and add these secrets:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_WEBHOOK_SANDBOXPAY_SECRET`

Optional secrets:

- `STAGING_SUPABASE_PUBLISHABLE_KEY`
- `STAGING_BACKEND_URL`
- `STAGING_SMILE_ID_PARTNER_ID`
- `STAGING_SMILE_ID_API_KEY`

The `Backend Staging` workflow uses these secrets for manual staging validation.

## Build

From `backend/`:

```bash
docker build \
  --build-arg APP_VERSION=staging-$(git rev-parse --short HEAD) \
  --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t greencard-api:staging .
```

On PowerShell:

```powershell
$commit = git rev-parse --short HEAD
docker build `
  --build-arg APP_VERSION="staging-$commit" `
  --build-arg APP_COMMIT="$commit" `
  --build-arg BUILD_DATE="local" `
  -t greencard-api:staging .
```

## Config Smoke Test

Before starting the server, validate the exact staging config:

```bash
go run ./cmd/api check-config
```

For a built image:

```bash
docker run --rm --env-file .env.staging greencard-api:staging check-config
```

This catches missing or unsafe env vars before the app starts.

## Run Staging Locally Against Staging Supabase

Only do this with staging credentials:

```bash
docker run --rm -p 8080:8080 --env-file .env.staging greencard-api:staging
```

Then verify:

```bash
curl http://localhost:8080/live
curl http://localhost:8080/ready
```

PowerShell:

```powershell
Invoke-RestMethod http://localhost:8080/live
Invoke-RestMethod http://localhost:8080/ready
```

## Verify A Deployed Staging URL

Set the staging base URL and a Supabase access token for a staging test user, then run the helper:

```powershell
$env:STAGING_BACKEND_URL = "https://your-staging-api.example.com"
$env:STAGING_ACCESS_TOKEN = "<staging-supabase-access-token>"
.\scripts\verify-staging.ps1
```

The helper checks:

- `/live`, `/health`, and `/ready`
- safe observable config such as `environment=staging`, service name, and version
- protected routes reject missing tokens
- Supabase auth works with the staging token
- read-only core endpoints respond: profile, accounts, recent activity, transaction lists, recipients, and support tickets

For a health-only check without a token:

```powershell
.\scripts\verify-staging.ps1 -PublicOnly
```

If `/ready` fails, inspect startup logs and run `check-config` with the same environment. If authenticated checks fail, confirm the backend and frontend are using the same staging Supabase project and that migrations have been applied.

## Deployment Expectations

- Deploy from a reviewed branch or main after CI passes.
- The deployed process must fail fast if required staging env vars are missing.
- The load balancer or host health check should target `/ready`.
- Logs should be JSON and should include request IDs.
- Provider/webhook secrets must be staging-only and rotated separately from production.

## Staging Data Safety

- Never point staging at the production Supabase project.
- Never use production service-role keys in staging.
- Never put service-role keys in frontend or Expo public env vars.
- Use test accounts and test transaction data only.
- Keep provider credentials sandbox-only until a production provider rollout is planned.

## Troubleshooting

- `check-config` fails: fix the env var named in the error before deploying.
- `/live` fails: the process or container is unhealthy.
- `/ready` fails: startup/config readiness is not satisfied.
- Authenticated requests fail: confirm the frontend is using the same staging Supabase project as the backend.
- Webhooks fail verification: confirm `WEBHOOK_SANDBOXPAY_SECRET` matches the staging provider configuration.
