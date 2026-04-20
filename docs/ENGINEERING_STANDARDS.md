# Engineering Standards

## Philosophy

Greencard should feel like a product codebase:

- readable
- maintainable
- secure by default
- easy to onboard into
- disciplined without unnecessary ceremony

## Naming and File Conventions

- Components: `PascalCase`
- Hooks: `useSomething`
- Utilities/services: clear noun/verb naming
- Types: colocate shared cross-feature types in `types/`
- Routes: follow Expo Router conventions in `app/`

## File Size Guidance

Avoid giant files.

Use these as practical thresholds:

- component/screen files: split when they become hard to scan or exceed roughly 250-300 lines
- services/helpers: split when they take on multiple responsibilities
- types: group by domain, not by “miscellaneous”

## Component Structure

Prefer:

1. imports
2. types
3. helper constants/functions
4. component definition
5. styles

Use shared primitives before introducing one-off variants.

## State and Business Logic

- keep presentation logic in components
- move repeated logic into hooks/services
- keep permission and access rules centralized
- avoid duplicating status checks across screens

## Styling

- use shared theme tokens from `constants/`
- keep spacing on the `8 / 12 / 16 / 20 / 24 / 32` rhythm
- prefer subtle borders and surface hierarchy over decorative effects
- do not hardcode random font sizes or spacing values without a good reason

## Imports

- prefer alias imports via `@/` for app code
- group related imports clearly
- sort imports when touching a file

## Security Hygiene

- never commit secrets
- use `.env.example` for required environment variables
- validate all input at the edges of the system
- keep auth/session persistence in vetted storage helpers
- prefer least-privilege assumptions for any future backend/service integration

## Backend Standards

- keep HTTP concerns in `backend/internal/handler`
- keep permission, verification, and transaction rules in `backend/internal/service`
- keep Supabase-specific persistence in `backend/internal/repository`
- never trust route parameters or request bodies without validation
- ownership checks should fail as `not found` where that prevents cross-user resource disclosure
- do not log tokens, secrets, full request bodies, raw bank details, or Supabase error payloads
- add or update tests when changing permission logic, validators, transaction progression, or handler error mapping

## Tech Debt Expectations

Before adding new code, ask:

- can this reuse an existing primitive or helper?
- does this duplicate business logic already in another feature?
- is this a domain concern that belongs in a service/provider instead?
- will a new engineer understand this without extra explanation?

## Documentation Expectations

Update docs when you change:

- setup steps
- environment requirements
- architecture patterns
- branching or release workflow
- security expectations
