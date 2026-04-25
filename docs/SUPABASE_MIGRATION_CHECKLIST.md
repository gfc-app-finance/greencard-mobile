# Supabase Migration Checklist

Use this checklist before applying GreenCard Finance database changes to staging.

The goal is simple: know what will change, confirm the target is staging, apply migrations in order, verify backend startup, and prove the frontend still works against staging.

## Migration Structure

Checked-in SQL migrations live in:

```text
supabase/migrations/
```

Current migrations are timestamp-prefixed SQL files. Keep that convention:

```text
YYYYMMDD_descriptive_name.sql
```

Examples:

- `20260419_create_profiles.sql`
- `20260420_create_balance_movements.sql`
- `20260422_create_audit_logs.sql`

## Golden Rules

- Apply migrations to staging before production.
- Never test migrations against production first.
- Confirm the active Supabase project before running anything.
- Apply migrations in filename order.
- Prefer forward-only migrations for MVP.
- Do not edit an already-applied migration unless the environment is disposable and everyone agrees.
- Add a new follow-up migration for fixes instead of rewriting history.
- Keep destructive changes out of staging until backup/rollback thinking is clear.

## Pre-Migration Review

- [ ] Confirm the PR includes all new SQL files under `supabase/migrations/`.
- [ ] Confirm migration filenames sort in the intended execution order.
- [ ] Open each pending migration and read the full SQL.
- [ ] Check whether the migration creates, alters, drops, renames, or backfills data.
- [ ] Check whether backend code expects the new schema immediately.
- [ ] Check whether frontend behavior depends on the new backend/schema behavior.
- [ ] Confirm any new table names match backend config defaults or documented env overrides.
- [ ] Confirm indexes/constraints support expected query paths and ownership checks.
- [ ] Confirm no production secrets or real user data are embedded in SQL.
- [ ] Confirm any seed/test data is staging-safe and not pretending to be production data.

## Environment Target Check

Before applying a migration, confirm:

- [ ] You are logged into the intended Supabase account.
- [ ] The selected project is the staging project.
- [ ] The project URL matches `STAGING_SUPABASE_URL`.
- [ ] You are not using production service-role keys.
- [ ] Any CLI/profile/project ref points to staging.
- [ ] If using the Supabase dashboard SQL editor, the browser tab is the staging project.

Useful sanity check:

```powershell
Write-Host $env:STAGING_SUPABASE_URL
```

If there is any doubt about the target, stop. Wrong-database migrations are annoyingly easy to do and not nearly as fun to undo.

## Data Assumption Check

For additive migrations, a backup is usually not needed for staging, but the assumptions still matter.

Check:

- [ ] Is this migration additive only, such as creating a table or adding nullable columns?
- [ ] Does it add a non-null column to a table that already has rows?
- [ ] Does it change an enum/check constraint that could reject existing data?
- [ ] Does it add unique indexes that might fail because staging has duplicate test data?
- [ ] Does it rename/drop a column the backend still reads?
- [ ] Does it alter balance, transaction, activity, audit, or auth-related tables?
- [ ] Does it create functions that mutate balances or transaction state?

If the migration touches money-state tables, transaction lifecycle tables, or audit logs:

- [ ] Capture row counts for affected tables.
- [ ] Confirm expected existing data shape.
- [ ] Consider exporting affected staging tables before applying the change.

## Apply To Staging

Use the team’s chosen Supabase workflow. If a formal CLI flow is not configured yet, use the Supabase dashboard SQL editor carefully against the staging project.

Recommended safe flow:

1. Pull the latest branch locally.
2. Review pending files in `supabase/migrations/`.
3. Confirm the staging Supabase project.
4. Apply migrations in filename order.
5. Save the migration result/output in the PR or deployment notes.

If using the dashboard SQL editor:

- [ ] Open staging Supabase project.
- [ ] Open SQL editor.
- [ ] Paste one migration at a time unless the files are tiny and obviously independent.
- [ ] Run in filename order.
- [ ] Confirm success before moving to the next migration.
- [ ] Keep the output visible until verification is done.

If using Supabase CLI later, document the exact command here once the repo is linked to Supabase.

## Verify Migration Success

After applying migrations:

- [ ] Confirm every new table exists.
- [ ] Confirm every altered column exists with expected type/nullability/default.
- [ ] Confirm indexes/constraints/functions were created.
- [ ] Confirm table permissions/RLS expectations are still safe.
- [ ] Confirm affected table row counts still look reasonable.
- [ ] Confirm no migration partially failed.

Backend schema expectations are summarized in `backend/README.md` under Notes.

Important tables to spot-check when touched:

- `profiles`
- `accounts`
- `funding_transactions`
- `transfer_transactions`
- `payment_transactions`
- `activities`
- `account_balance_movements`
- `audit_logs`
- `provider_webhook_events`
- `async_job_runs`
- `recipients`
- `support_tickets`
- `support_ticket_messages`
- `idempotency_keys`

## Verify Backend Startup

Run config validation against staging values:

```powershell
cd backend
go run ./cmd/api check-config
```

If using Docker:

```powershell
docker run --rm --env-file .env.staging greencard-api:staging check-config
```

Then verify the deployed staging backend:

```powershell
$env:STAGING_BACKEND_URL = "https://your-staging-api.example.com"
$env:STAGING_ACCESS_TOKEN = "<staging-supabase-access-token>"
.\scripts\verify-staging.ps1
```

Checklist:

- [ ] `check-config` passes.
- [ ] `/live` returns success.
- [ ] `/ready` returns success.
- [ ] The staging verification script passes with a staging test-user token.
- [ ] Backend logs do not show schema/query errors.
- [ ] Worker startup logs look healthy if `WORKER_ENABLED=true`.

## Verify Backend API Behavior

Use a staging test user and staging Supabase access token.

Minimum checks:

- [ ] `GET /v1/me` returns the current user.
- [ ] `GET /v1/accounts` returns staging account data or a clean empty state.
- [ ] `GET /v1/activity/recent` returns recent activity or a clean empty state.
- [ ] Recipient list/detail endpoints still work if recipient tables changed.
- [ ] Support ticket list/detail endpoints still work if support tables changed.
- [ ] Transaction create/list/detail flows still work if transaction tables changed.
- [ ] Completion/status update flows still keep activity and balance movement records aligned if transaction lifecycle tables changed.

Do not use production user tokens or production data for this verification.

## Verify Frontend Against Staging

Before calling staging ready:

- [ ] Frontend staging build uses staging `EXPO_PUBLIC_SUPABASE_URL`.
- [ ] Frontend staging build uses staging `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Frontend staging build uses staging `EXPO_PUBLIC_API_BASE_URL` when calling the Go API.
- [ ] Sign in with a staging test user.
- [ ] Home loads without backend/schema errors.
- [ ] Accounts view loads account summaries.
- [ ] Activity/recent activity loads.
- [ ] Profile/verification state renders correctly.
- [ ] Recipient/payment/support screens touched by the migration still render correctly.

If the frontend fails, check backend logs first for schema errors, then check frontend API base URL and Supabase project mismatch.

## Rollback Considerations

For MVP, rollback should be explicit and cautious.

Before applying a risky migration, decide:

- [ ] Can this be rolled forward with a follow-up migration instead of rolling back?
- [ ] Is there a staging backup/export if data needs restoring?
- [ ] Are backend changes backward-compatible with the old schema during deploy?
- [ ] Does the migration drop or rename anything?
- [ ] Does the migration mutate money, transaction, or audit data?

If a migration fails before completion:

1. Stop applying further migrations.
2. Capture the error output.
3. Check whether any partial objects were created.
4. Decide whether to safely drop partial objects or write a corrective follow-up migration.
5. Re-run backend `check-config` and staging health checks after repair.

If a migration succeeds but the backend breaks:

1. Stop frontend testing and do not promote the change.
2. Capture backend logs and the failing endpoint/request ID.
3. Confirm whether the schema matches backend expectations.
4. Prefer a forward-fix migration or backend fix over manual table edits.
5. Re-run backend and frontend verification from this checklist.

## Common Failure Points

- Applying SQL to the production project by mistake.
- Running migrations out of filename order.
- Adding non-null columns without defaults to tables that already contain rows.
- Adding unique constraints where staging already has duplicate data.
- Renaming/dropping columns before backend code stops using them.
- Forgetting indexes needed by user-scoped list endpoints.
- Creating SQL functions but forgetting required grants/permissions.
- Updating backend table env vars without updating docs or deployment secrets.
- Testing frontend against one Supabase project while backend points to another.
- Assuming `.env.staging.example` contains real values.

## Current Gaps

- The repo has SQL migration files but does not yet have a fully documented Supabase CLI project-link workflow.
- There is no automated staging migration pipeline yet.
- There is no checked-in rollback migration convention yet.
- Migration success is currently verified manually through Supabase checks plus backend/frontend smoke tests.

These gaps are acceptable for the current staging setup, but they should be revisited before production database changes become frequent.
