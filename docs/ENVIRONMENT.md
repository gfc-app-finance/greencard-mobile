# Environment and Secrets

Use `DEPLOYMENT_ENVIRONMENTS.md` as the full source of truth for local, staging, and production environment setup.

## Quick Setup

Frontend local:

```bash
cp .env.example .env
```

Backend local:

```bash
cp backend/.env.example backend/.env
```

Staging templates:

- root `.env.staging.example` for public frontend staging values
- `backend/.env.staging.example` for backend staging config
- `backend/STAGING.md` for staging deployment and verification

## Core Rules

- `.env`, `.env.staging`, and `.env.production` files must never be committed.
- `EXPO_PUBLIC_*` values are public and can be included in the mobile/web bundle.
- `SUPABASE_SERVICE_ROLE_KEY`, provider API keys, webhook secrets, and private keys are backend-only secrets.
- Staging and production must use separate Supabase projects and separate provider credentials.
- Staging and production must keep seeded fallbacks and transaction simulation disabled.
- Any new env var must be added to the relevant example file and documented in `DEPLOYMENT_ENVIRONMENTS.md`.
