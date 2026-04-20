# Contributing to Greencard

## Development Workflow

1. Sync from `main`.
2. Create a branch using one of:
   - `feature/...`
   - `fix/...`
   - `chore/...`
   - `refactor/...`
   - `docs/...`
   - `test/...`
3. Make the smallest reviewable change possible.
4. Run:

```bash
npm run check
cd backend && make check
```

5. Update tests and docs when behavior or architecture changes.
6. Open a PR using the repository template.

## Commit Messages

Use Conventional Commits:

- `feat(payments): add payment tracker receipt gating`
- `fix(activity): stop filter chips stretching vertically`
- `docs(engineering): add repo workflow guidance`

Allowed types:

- `feat`
- `fix`
- `chore`
- `refactor`
- `docs`
- `test`
- `style`
- `perf`
- `build`
- `ci`
- `revert`

## Pull Request Expectations

Every PR should:

- stay scoped to one clear problem or slice of work
- include tests for behavior changes where practical
- include documentation updates if setup/architecture changed
- explain risks and follow-up work clearly
- be ready for review before requesting review

For backend changes specifically:

- keep handlers thin and move business rules into `backend/internal/service`
- keep Supabase access in `backend/internal/repository`
- add or update permission checks through the shared permission helper instead of ad hoc handler logic
- add tests for ownership, validation, and gated actions when backend behavior changes

## Review Checklist

Reviewers should check:

- correctness
- maintainability
- security implications
- state/data flow impact
- test coverage for critical logic
- documentation updates
- unnecessary complexity or duplication

## Branch Protection

This repo should be configured in GitHub so that:

- `main` is protected
- direct pushes to `main` are blocked
- at least one PR review is required
- CI checks must pass before merge

## Release and Versioning Basics

- Use semantically meaningful release notes.
- Tag production releases as `vX.Y.Z`.
- Keep release PRs focused on shippable changes.
- Record noteworthy architectural shifts in docs and PR descriptions.

## Need More Context?

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/BACKEND_ENGINEERING.md](./docs/BACKEND_ENGINEERING.md)
- [docs/ENGINEERING_STANDARDS.md](./docs/ENGINEERING_STANDARDS.md)
- [docs/TESTING.md](./docs/TESTING.md)
- [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md)
