# Staging Secrets Checklist

Use this checklist when creating or reviewing the GreenCard Finance staging environment.

Do not paste real values into this file, issues, PRs, chat, or screenshots. Store real secrets only in the approved staging secret stores.

## Approved Staging Secret Stores

| Store                              | Use For                                           | Notes                                         |
| ---------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| GitHub Environment `staging`       | CI validation and deployment workflow secrets     | Protect with reviewer approval when possible  |
| Deployment platform secret manager | runtime backend secrets                           | Preferred runtime source for deployed backend |
| Local `backend/.env.staging`       | short-lived local staging smoke tests only        | never commit, delete when no longer needed    |
| Supabase dashboard                 | Supabase-managed API keys/JWT settings            | staging project only                          |
| Provider sandbox dashboard         | provider sandbox keys and webhook signing secrets | never production provider credentials         |

## Required Before Staging Can Run

| Secret or Config                                                  | Required?                     | What It Is                                         | Why It Is Needed                                                                   | Store It In                                                | Differs From Production?         | Review Notes                                        |
| ----------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------- | --------------------------------------------------- |
| `STAGING_SUPABASE_URL` / `SUPABASE_URL`                           | required                      | URL for the staging Supabase project               | backend API, auth issuer discovery, REST calls, and frontend Supabase client setup | GitHub `staging` environment and deployment secret manager | yes, must be staging project URL | must not point to production Supabase               |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | required                      | staging Supabase service-role key                  | backend-only database access through Supabase REST                                 | GitHub `staging` environment and deployment secret manager | yes, must be staging key         | never expose to Expo/frontend, logs, or screenshots |
| `EXPO_PUBLIC_SUPABASE_URL`                                        | required for frontend staging | public staging Supabase URL                        | frontend auth/session client                                                       | frontend staging build config                              | yes                              | public value, but still should point to staging     |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                            | required for frontend staging | public Supabase key for staging app clients        | frontend Supabase client initialization                                            | frontend staging build config                              | yes                              | public/mobile-safe; not the service-role key        |
| `APP_ENV`                                                         | required config               | deployment environment name                        | enables staging validation behavior                                                | deployment config                                          | yes, set to `staging`            | not secret, but safety-critical                     |
| `APP_VERSION`                                                     | required config               | commit SHA or release identifier                   | traceability in logs and health responses                                          | deployment config or build args                            | yes                              | use commit SHA or staging release label             |
| `RATE_LIMIT_ENABLED`                                              | required config               | enables backend rate limiting                      | abuse protection                                                                   | deployment config                                          | usually same as production       | set to `true`                                       |
| `ENABLE_SEEDED_ACCOUNT_FALLBACK`                                  | required config               | controls local fallback account data               | prevents fake data in staging                                                      | deployment config                                          | same as production               | must be `false`                                     |
| `ENABLE_TRANSACTION_SIMULATION`                                   | required config               | controls explicit transaction simulation endpoints | prevents simulated transaction outcomes in staging                                 | deployment config                                          | same as production               | must be `false`                                     |
| `WORKER_ENABLE_SIMULATION_PROGRESSION`                            | required config               | controls worker-driven fake progression            | prevents fake async money flows in staging                                         | deployment config                                          | same as production               | must be `false`                                     |

## Backend Webhook Secrets

| Secret or Config                                                  | Required?                                         | What It Is                                        | Why It Is Needed                                         | Store It In                                                | Differs From Production? | Review Notes                                            |
| ----------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `STAGING_WEBHOOK_SANDBOXPAY_SECRET` / `WEBHOOK_SANDBOXPAY_SECRET` | required when SandboxPay webhook route is enabled | HMAC/signing secret for staging provider webhooks | verifies webhook authenticity before transaction updates | GitHub `staging` environment and deployment secret manager | yes                      | generate a staging-only secret; do not reuse production |
| Provider webhook endpoint URL                                     | required when provider webhooks are enabled       | public staging URL providers call                 | lets provider send staging transaction events            | provider sandbox dashboard                                 | yes                      | should target staging backend only                      |
| Provider webhook event ID/source config                           | optional                                          | provider-side event identity config if supported  | improves duplicate event handling and auditability       | provider sandbox dashboard                                 | yes                      | use sandbox/test provider account                       |

## KYC Provider Secrets

Current default for staging is `KYC_PROVIDER=disabled`. Add these only when Smile ID sandbox testing is active.

| Secret or Config                                      | Required?                    | What It Is                        | Why It Is Needed                                | Store It In                                                | Differs From Production? | Review Notes                            |
| ----------------------------------------------------- | ---------------------------- | --------------------------------- | ----------------------------------------------- | ---------------------------------------------------------- | ------------------------ | --------------------------------------- |
| `KYC_PROVIDER`                                        | optional until KYC testing   | KYC provider selector             | enables provider-backed verification flow       | deployment config                                          | production may differ    | use `disabled` or `smileid`             |
| `SMILE_ID_ENVIRONMENT`                                | required if Smile ID enabled | Smile ID environment name         | routes requests to sandbox or production        | deployment config                                          | yes                      | staging must use `sandbox`              |
| `STAGING_SMILE_ID_PARTNER_ID` / `SMILE_ID_PARTNER_ID` | required if Smile ID enabled | Smile ID sandbox partner ID       | identifies the staging/sandbox Smile ID account | GitHub `staging` environment and deployment secret manager | yes                      | do not reuse production partner ID      |
| `STAGING_SMILE_ID_API_KEY` / `SMILE_ID_API_KEY`       | required if Smile ID enabled | Smile ID sandbox API key          | signs/authorizes KYC requests                   | GitHub `staging` environment and deployment secret manager | yes                      | secret; never log or expose to frontend |
| `SMILE_ID_BASE_URL`                                   | required if Smile ID enabled | Smile ID sandbox API base URL     | provider HTTP client target                     | deployment config                                          | yes                      | use sandbox URL in staging              |
| `SMILE_ID_SOURCE_SDK_VERSION`                         | optional                     | request metadata sent to Smile ID | provider request metadata                       | deployment config                                          | usually same             | not secret                              |

## App And Base URLs

| Secret or Config              | Required?                               | What It Is                                            | Why It Is Needed                                  | Store It In                                       | Differs From Production? | Review Notes                            |
| ----------------------------- | --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | ------------------------ | --------------------------------------- |
| `STAGING_BACKEND_URL`         | required for deployed smoke checks      | public staging backend base URL                       | verifies `/live` and `/ready`, frontend API calls | GitHub `staging` environment or workflow variable | yes                      | should be HTTPS once hosted             |
| `EXPO_PUBLIC_API_BASE_URL`    | required once frontend calls Go API     | public backend URL embedded in frontend staging build | frontend-to-backend API traffic                   | frontend staging build config                     | yes                      | public value; must point to staging API |
| Supabase auth redirect URLs   | required for auth flows                 | allowed callback/deep-link URLs in Supabase           | sign-in, confirmation, and redirect flows         | staging Supabase dashboard                        | yes                      | include staging app scheme/domain only  |
| Provider webhook callback URL | required when provider webhooks enabled | route provider calls for staging webhook events       | transaction status updates                        | provider sandbox dashboard                        | yes                      | must not point to production            |

## Deployment Platform Secrets

| Secret or Config                  | Required?                           | What It Is                                 | Why It Is Needed                  | Store It In                                         | Differs From Production? | Review Notes                                        |
| --------------------------------- | ----------------------------------- | ------------------------------------------ | --------------------------------- | --------------------------------------------------- | ------------------------ | --------------------------------------------------- |
| Container registry token          | optional, platform-dependent        | token used to push/pull backend images     | deploys staging container image   | GitHub `staging` environment or deployment platform | yes where possible       | use least privilege                                 |
| Deployment API token              | optional, platform-dependent        | token used by CI to deploy staging         | automated staging deploys         | GitHub `staging` environment                        | yes                      | scope to staging project/app only                   |
| Runtime environment ID/project ID | optional, platform-dependent        | target app/project identifier              | selects staging deployment target | GitHub variable or deployment config                | yes                      | not always secret, but avoid mixing with production |
| Database migration token          | optional, if migrations run from CI | credential for applying staging migrations | keeps staging schema current      | GitHub `staging` environment                        | yes                      | prefer least privilege when supported               |

## Logging And Error Reporting

No external logging or error-reporting provider is currently required for staging. If one is added later, document it here before enabling it.

| Secret or Config            | Required?       | What It Is                             | Why It Is Needed                | Store It In               | Differs From Production? | Review Notes                        |
| --------------------------- | --------------- | -------------------------------------- | ------------------------------- | ------------------------- | ------------------------ | ----------------------------------- |
| Error reporting DSN/API key | optional future | token/DSN for error reporting provider | captures staging runtime errors | deployment secret manager | yes                      | use staging project, not production |
| Log drain token             | optional future | token for external log platform        | ships structured logs           | deployment secret manager | yes                      | avoid logging secrets or full PII   |

## JWT And Auth Notes

The backend validates Supabase-issued access tokens. It currently needs `SUPABASE_URL` and can discover Supabase auth/JWKS URLs from that project.

| Secret or Config        | Required?                             | What It Is                         | Why It Is Needed         | Store It In                 | Differs From Production? | Review Notes                                                              |
| ----------------------- | ------------------------------------- | ---------------------------------- | ------------------------ | --------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Supabase JWT secret     | not currently required by backend env | Supabase project signing secret    | managed by Supabase auth | Supabase dashboard only     | yes                      | do not export into the app unless a future feature explicitly requires it |
| Supabase JWKS/auth URLs | derived                               | auth issuer and key discovery URLs | JWT validation           | derived from `SUPABASE_URL` | yes                      | validate by running `check-config`                                        |

## Must Not Be Reused Between Environments

- Supabase service-role keys
- Supabase projects/databases
- webhook signing secrets
- Smile ID or other provider API keys
- deployment API tokens
- container registry credentials when environment scoping is available
- error-reporting/logging project tokens
- OAuth/auth redirect URL configuration

## Setup Review Checklist

Before staging is considered ready:

- [ ] Staging Supabase project exists and is separate from production.
- [ ] Staging database migrations have been applied.
- [ ] `STAGING_SUPABASE_URL` is set in GitHub Environment `staging`.
- [ ] `STAGING_SUPABASE_SERVICE_ROLE_KEY` is set in GitHub Environment `staging`.
- [ ] Runtime deployment has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from staging secrets.
- [ ] Frontend staging build uses staging `EXPO_PUBLIC_SUPABASE_URL`.
- [ ] Frontend staging build uses staging `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the staging backend, not local or production.
- [ ] `APP_ENV=staging`.
- [ ] `APP_VERSION` is a commit SHA or staging release label.
- [ ] `ENABLE_SEEDED_ACCOUNT_FALLBACK=false`.
- [ ] `ENABLE_TRANSACTION_SIMULATION=false`.
- [ ] `WORKER_ENABLE_SIMULATION_PROGRESSION=false`.
- [ ] `RATE_LIMIT_ENABLED=true`.
- [ ] `WEBHOOK_SANDBOXPAY_SECRET` is staging-only if webhooks are enabled.
- [ ] Provider sandbox keys are configured only if provider testing is enabled.
- [ ] Supabase auth redirect URLs are configured for staging app URLs/schemes.
- [ ] Deployment health check targets `/ready`.
- [ ] `check-config` passes with the exact staging runtime environment.
- [ ] `/live` and `/ready` pass after deployment.

## Rotation And Incident Notes

- Rotate any staging secret that appears in a screenshot, chat, issue, PR, logs, or local machine you do not trust.
- If a production secret is accidentally used in staging, rotate the production secret and replace staging with a staging-only value.
- If a frontend build receives a backend-only secret, treat it as exposed and rotate immediately.
- Record secret rotations in the team operational notes without writing the secret value.
