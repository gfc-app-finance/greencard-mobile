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

## Test Placement

Use the `tests/` directory for shared/unit tests.

Recommended structure:

- `tests/lib/`
- `tests/features/`
- `tests/services/`

Keep test names aligned with the module under test.
