# Backend Engineering Notes

## Backend Structure

The backend is intentionally layered but lightweight:

- `backend/cmd/api`: server bootstrap and dependency wiring
- `backend/internal/config`: env loading and validation
- `backend/internal/handler`: HTTP handlers and routing
- `backend/internal/middleware`: auth, request IDs, logging, security headers, recovery
- `backend/internal/service`: business rules, permissions, validation orchestration
- `backend/internal/repository`: Supabase-backed persistence
- `backend/internal/model`: request and response models
- `backend/internal/response`: JSON and error helpers
- `backend/internal/worker`: in-process background jobs for progression, timeouts, and async operational checks

## Auth Model

- Supabase remains the source of truth for authentication
- the Go API validates Supabase access tokens
- authenticated user context is attached in middleware and consumed downstream
- handlers should never parse or trust raw auth headers themselves

## Verification and Permission Model

Permission rules should stay centralized in `backend/internal/service/permission.go`.

Use that layer for:

- verification-based gating
- account usability checks
- ownership checks
- future resource-level policies

Do not scatter ad hoc `if status == ...` checks across handlers.

## Ownership Rules

Protected resources must always be scoped to the authenticated user.

Patterns to keep:

- repositories query by `user_id` where possible
- services apply shared ownership helpers before returning data
- cross-user resource access should resolve to `not found` unless a stronger `forbidden` response is explicitly required

For transaction writes:

- use real owned account records only
- do not fall back to seeded placeholder accounts on create/update paths
- payment creation must validate a real owned recipient before persisting
- transaction create handlers should use idempotency support for safe retry behavior when an `Idempotency-Key` header is provided
- transaction status changes must flow through the shared transition service (`UpdateFundingStatus`, `UpdateTransferStatus`, `UpdatePaymentStatus`), not direct repository status updates
- balance effects must be applied only from the service-owned completion path, never directly from handlers

## Validation Rules

- decode JSON with unknown fields disallowed
- validate request shape before calling repositories
- constrain lengths and supported enum values
- keep error responses consistent through shared response helpers

## Logging Hygiene

- log request IDs, route paths, status, and sanitized operational errors
- do not log tokens, secrets, raw Supabase error payloads, full bank details, or full request bodies
- prefer generic client errors and more specific internal logs only when they remain safe

## Rate Limiting and Abuse Protection

- keep global IP-based limiting enabled for all API traffic unless a local test explicitly disables it
- keep authenticated `/v1` limiting user-keyed after Supabase auth so one noisy user does not consume another user's allowance
- sensitive writes such as KYC submission, recipient creation, support ticket creation, transaction creation, profile updates, and simulation routes should use the tighter sensitive policy
- provider webhook routes should use a dedicated public webhook policy and still verify signatures before processing payloads
- do not log full IPs, tokens, or request bodies for rate-limit events; log policy, scope, path, request ID, and a hashed key only
- only enable proxy-header trust when deployment infrastructure guarantees `X-Forwarded-For` or `X-Real-IP` cannot be spoofed by clients

## Audit and Compliance Logging

Audit logs are a durable compliance trail, not normal debugging logs.

- use the centralized audit service for sensitive writes and lifecycle events
- audit profile updates, verification state changes, recipient creation, transaction creation, transaction status changes, balance-affecting completions, support ticket creation, permission denials, and provider webhook outcomes
- do not write audit records directly from HTTP handlers; handlers should call services and services should audit business outcomes
- keep audit metadata summarized and minimal
- never store tokens, secrets, raw provider payloads, raw account numbers, raw ID numbers, BVN/NIN values, PINs, OTPs, or authorization headers in audit metadata
- audit failure should be logged safely and investigated, but normal user flows should avoid leaking audit persistence failures to clients

## Testing

Backend tests should cover:

- permission helpers
- verification state resolution
- service validation and gating
- handler error mapping
- middleware auth behavior

Run locally:

```bash
cd backend
make check
```

## Adding a New Endpoint Safely

1. add request/response models in `internal/model`
2. add repository methods for persistence
3. add service logic for validation, permissions, and orchestration
4. keep the handler thin and map errors cleanly
5. add audit logging for sensitive writes or permission-sensitive outcomes
6. decide whether the route needs the sensitive rate-limit policy
7. add tests for validation, ownership, denied paths, audit generation, and limiter behavior where relevant
8. update backend docs if the contract or workflow changed

## Transaction Safety Notes

- read endpoints must stay side-effect free
- do not advance transaction status inside `GET` or list handlers/services
- if you need mocked progression for development, keep it behind an explicit helper, job, or test path instead of tying it to read traffic
- seeded account fallback on read paths is for local/non-production use only and should stay disabled for broader external testing
- if explicit transaction simulation is enabled, keep it non-production only and mount it behind an intentional route such as `/simulate/advance`
- valid lifecycle changes should be enforced centrally for funding, transfer, and payment transactions, and invalid transitions should fail cleanly instead of being coerced
- persist `status_reason`, `status_source`, and `last_status_change_at` from the same transition flow so future provider/manual updaters do not fork lifecycle metadata behavior
- when a transaction status changes, the corresponding activity item should be updated in the same service flow so feed state remains consistent
- balance mutation should happen only on the right committed status, not on transaction creation
- completion-side money mutation should create `account_balance_movements` records so there is a minimal audit trail for how balances changed
- completion-side money mutation should also emit a compliance audit event through the audit service
- repeated completion events must be safe: settlement should no-op if the matching balance movement already exists
- final sufficient-balance checks belong in the completion/settlement path for debit flows, even if create-time validation already rejected obviously impossible requests
- provider webhook handlers must verify signatures before parsing or trusting the event payload
- provider-specific payload mapping belongs in webhook provider adapters, not in HTTP handlers
- webhook processing should identify transactions by safe internal references, then call the shared transaction lifecycle updater so activity sync and balance mutation stay centralized
- duplicate webhook deliveries must be safe by combining webhook event receipt records with idempotent completion/settlement logic
- background workers should never mutate transactions directly through repositories; they must call the shared lifecycle updater by reference
- worker-driven timeouts or delayed progression must remain idempotent so repeated polling does not duplicate money effects
- mutable worker actions should claim a stable `async_job_runs` key before calling lifecycle services, so duplicate worker instances and repeated polling do not process the same logical job at the same time
- async job attempts should have explicit max attempts and lock TTLs; exhausted jobs should be marked abandoned instead of looping forever
- retry evaluation is allowed to inspect and log candidate work, but it should not invent a second status-mutation path outside the lifecycle service
- reconciliation jobs are read-only operational checks; they may compare transaction state, balance movements, and webhook receipts, but they must not bypass the lifecycle or settlement services
- reconciliation mismatches should be logged with safe entity references and followed up operationally rather than hidden or auto-fixed with ad hoc mutations

## Provider Integration Notes

- provider API clients live in `backend/internal/provider`; handlers should not build provider HTTP requests directly
- provider credentials must come from config/env and must never be logged
- provider clients should expose typed internal results and errors instead of leaking raw provider payloads to services or handlers
- Smile ID is the first real KYC provider integration and currently uses the Enhanced KYC REST `id_verification` endpoint
- identity verification requests may send raw ID numbers to the configured provider, but raw ID numbers should not be persisted or returned by GreenCard API responses
- KYC provider decisions map into GreenCard verification states in the service layer: approved -> `verified`, pending -> `under_review`, rejected -> `restricted`
- future funding and payout provider clients should follow the same pattern: provider package for API calls, service layer for orchestration, repository layer for persistence, and webhook handlers only for verified event ingestion
