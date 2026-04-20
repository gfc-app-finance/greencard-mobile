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

## Validation Rules

- decode JSON with unknown fields disallowed
- validate request shape before calling repositories
- constrain lengths and supported enum values
- keep error responses consistent through shared response helpers

## Logging Hygiene

- log request IDs, route paths, status, and sanitized operational errors
- do not log tokens, secrets, raw Supabase error payloads, full bank details, or full request bodies
- prefer generic client errors and more specific internal logs only when they remain safe

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
5. add tests for validation, ownership, and denied paths
6. update backend docs if the contract or workflow changed

## Transaction Safety Notes

- read endpoints must stay side-effect free
- do not advance transaction status inside `GET` or list handlers/services
- if you need mocked progression for development, keep it behind an explicit helper, job, or test path instead of tying it to read traffic
