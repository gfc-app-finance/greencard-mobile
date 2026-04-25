# GreenCard Backend Operations Runbook

This runbook covers the practical steps needed to build, deploy, observe, and troubleshoot the backend API.

## Runtime Contract

- The service listens on `PORT`, default `8080`.
- The container runs as a non-root user.
- Production logs are JSON structured logs on stdout.
- `X-Request-ID` and `X-Correlation-ID` are mirrored in responses and included in request logs.
- The process fails fast when required config is missing or unsafe production flags are enabled.

## Environment Runbooks

- Use `../docs/DEPLOYMENT_ENVIRONMENTS.md` for the complete local, staging, and production env var reference.
- Use `STAGING.md` for staging deployment, staging Supabase setup, and frontend/backend verification.
- Use this runbook for shared operational behavior and production deployment expectations.

## Required Production Environment

Set these in the deployment secret manager, not in Git:

- `APP_ENV=production`
- `APP_VERSION=<release-version-or-sha>`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended production values:

- `LOG_LEVEL=info`
- `RATE_LIMIT_ENABLED=true`
- `ENABLE_TRANSACTION_SIMULATION=false`
- `WORKER_ENABLE_SIMULATION_PROGRESSION=false`
- `WORKER_ENABLED=true` when background transaction checks should run in this process
- `RATE_LIMIT_TRUST_PROXY_HEADERS=true` only behind a trusted proxy or load balancer that overwrites forwarded headers

Staging should use the same safety posture for money and lifecycle behavior:

- `APP_ENV=staging`
- dedicated staging Supabase project and service-role key
- `ENABLE_TRANSACTION_SIMULATION=false`
- `WORKER_ENABLE_SIMULATION_PROGRESSION=false`
- `ENABLE_SEEDED_ACCOUNT_FALLBACK=false`

Use `backend/.env.staging.example` as the staging template.

If Smile ID is enabled in production:

- `KYC_PROVIDER=smileid`
- `SMILE_ID_ENVIRONMENT=production`
- `SMILE_ID_PARTNER_ID`
- `SMILE_ID_API_KEY`

## Build

From `backend/`:

```bash
make check
make docker-build APP_VERSION=<version>
```

The Docker image accepts:

- `APP_VERSION`
- `APP_COMMIT`
- `BUILD_DATE`

Example:

```bash
docker build \
  --build-arg APP_VERSION=2026.04.22 \
  --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \
  --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -t greencard-api:2026.04.22 .
```

## Config Smoke Test

Before deploying a new environment, run:

```bash
go run ./cmd/api check-config
```

For a built image:

```bash
docker run --rm \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=*** \
  -e APP_VERSION=2026.04.22 \
  greencard-api:2026.04.22 \
  check-config
```

This validates config and exits without starting the HTTP server.

For staging specifically:

```bash
docker run --rm --env-file .env.staging greencard-api:staging check-config
```

## Health Checks

- `GET /live`: liveness check for process health.
- `GET /health`: legacy liveness alias.
- `GET /ready`: readiness check for deploy/load-balancer gating.

Staging deployments should verify `/live` and `/ready` before connecting the frontend.

The Dockerfile uses `/ready` for container health checks.

Expected readiness response shape:

```json
{
  "status": "ready",
  "service": "greencard-api",
  "environment": "production",
  "version": "2026.04.22",
  "uptime_seconds": 123,
  "checks": []
}
```

## Logs

Use `request_id` to trace a request across logs. Clients may send either `X-Request-ID` or `X-Correlation-ID`.

Useful log events:

- `backend runtime configured`
- `starting api server`
- `request completed`
- `rate limit exceeded`
- `worker job started`
- `worker job finished`
- `worker job failed`
- `processed provider webhook event`

Do not log raw tokens, full bank details, ID numbers, provider secrets, or raw provider payloads.

## Common Operational Issues

- Config error on boot: run `go run ./cmd/api check-config` with the same env vars and fix the reported variable.
- `/ready` returns non-200: inspect the readiness `checks` array and the startup logs.
- Requests return `429`: confirm route traffic patterns, client retry behavior, and the configured `RATE_LIMIT_*` values.
- Webhooks return unsupported provider: confirm the provider secret is configured so the adapter is registered.
- Webhooks fail verification: check provider timestamp tolerance, secret rotation, and signature header names.
- Worker not running: confirm `WORKER_ENABLED=true` and look for `starting background worker engine`.

## Remaining Production Gaps

- In-memory rate limiting is per-process; use Redis or edge rate limiting before running multiple API replicas.
- Readiness is startup/config oriented and does not actively probe Supabase on every request.
- There is no deployment-specific secret rotation automation yet.
- There is no external metrics or tracing backend yet.
