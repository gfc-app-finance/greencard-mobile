# Greencard Mobile App

Greencard (`GCF`) is an Expo + React Native + TypeScript mobile product for cross-border money movement, account management, payments, cards, savings, verification, and support flows.

This repository is set up to run like a product engineering codebase rather than a throwaway MVP:

- shared engineering standards
- documented architecture and onboarding
- lint, typecheck, format, and test commands
- local Git hooks for commit/push protection
- GitHub Actions CI for pull requests

## Stack

- Expo / React Native
- Expo Router
- TypeScript
- React Query
- Supabase
- Jest + jest-expo
- ESLint + Prettier

## Quick Start

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create your local environment file:

```bash
cp .env.example .env
```

4. Fill in the required Supabase values in `.env`.
5. Start the app:

```bash
npm run start
```

## Common Commands

| Command                | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run start`        | Start Expo locally                      |
| `npm run android`      | Launch Android development session      |
| `npm run ios`          | Launch iOS development session          |
| `npm run web`          | Launch the web target                   |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Auto-fix lint issues where possible     |
| `npm run format`       | Format the repository with Prettier     |
| `npm run format:check` | Check formatting only                   |
| `npm run typecheck`    | Run TypeScript checks                   |
| `npm run test`         | Run the test suite                      |
| `npm run test:ci`      | Run tests with coverage for CI          |
| `npm run build:web`    | Validate a production-style web export  |
| `npm run check`        | Run lint, typecheck, and CI-style tests |

## Environment Variables

The app currently expects:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

See [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) for rules, examples, and security expectations.

## Supabase OTP Setup

The in-app signup flow now expects one-time codes instead of external confirmation links:

- Email confirmation emails must use `{{ .Token }}` in the Supabase email template so users receive a 6-digit code inside the app.
- Phone auth must be enabled in Supabase with an SMS provider so the app can send phone verification OTPs.
- Sign up phone numbers should be entered in international format, for example `+2348012345678`.

If the email template is still configured for `{{ .ConfirmationURL }}`, the legacy link-based confirmation route at `/auth/confirm` still works, but the preferred UX is the in-app OTP screen.

## Repository Standards

- Branches: `feature/...`, `fix/...`, `chore/...`, `refactor/...`, `docs/...`, `test/...`
- Commits: Conventional Commits such as `feat(payments): add review summary`
- PRs: reviewed, scoped, and linked to testing/documentation updates
- No direct pushes to `main`

See:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [docs/ENGINEERING_STANDARDS.md](./docs/ENGINEERING_STANDARDS.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/TESTING.md](./docs/TESTING.md)
- [docs/RELEASES.md](./docs/RELEASES.md)
- [SECURITY.md](./SECURITY.md)

## Project Structure

```text
app/          Expo Router entrypoints and navigation groups
components/   Shared UI primitives
constants/    Theme, colors, spacing, tokens
features/     Product feature modules
hooks/        Shared hooks
lib/          Environment, auth, storage, utility helpers
services/     Data shaping and business-logic helpers
types/        Shared TypeScript models
tests/        Unit and helper tests
docs/         Team-facing engineering documentation
```

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a deeper walkthrough.

## CI

GitHub Actions runs the following checks on pull requests:

- install dependencies
- lint
- typecheck
- test with coverage

Additional repo protection still needs to be enforced in GitHub settings:

- protect `main`
- require PR review before merge
- require CI status checks before merge
- enable secret scanning and Dependabot alerts

## Onboarding a New Engineer

1. Read this README.
2. Read [CONTRIBUTING.md](./CONTRIBUTING.md).
3. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
4. Read [docs/ENGINEERING_STANDARDS.md](./docs/ENGINEERING_STANDARDS.md).
5. Copy `.env.example` to `.env`.
6. Run `npm install`.
7. Run `npm run check` before opening your first PR.
