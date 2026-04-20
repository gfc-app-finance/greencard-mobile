# Testing Standards

## Testing Philosophy

Keep testing practical and high-value.

Prioritize:

- shared business logic
- permission and access helpers
- formatting and mapping helpers
- critical state transitions
- utilities that affect money, status, or user entitlements

## Minimum Expectations

At minimum, new work should add or update tests when it changes:

- access control
- transaction status logic
- formatting helpers
- shared services
- state models

## Test Types in This Repo

- unit tests for helpers and services
- targeted component tests only when behavior is complex enough to justify them
- integration-style tests can be added later around core flows

## Commands

- `npm run test`
- `npm run test:watch`
- `npm run test:ci`
- `cd backend && go test ./...`
- `cd backend && make check`

## Test Placement

Use the `tests/` directory for shared/unit tests.

Recommended structure:

- `tests/lib/`
- `tests/features/`
- `tests/services/`

Keep test names aligned with the module under test.

## Backend Coverage Focus

Backend tests should prioritize:

- permission and ownership helpers
- verification gating
- request validation
- transaction status progression
- activity event shaping
- recipient masking and validation
- support ticket linking and ownership checks
- auth middleware success and failure paths

## Backend Test Layout

Prefer colocated Go tests next to the package under test, for example:

- `backend/internal/service/*_test.go`
- `backend/internal/handler/*_test.go`
- `backend/internal/middleware/*_test.go`

Keep repository integration tests small and only add them when the behavior cannot be covered meaningfully through services or handlers.
