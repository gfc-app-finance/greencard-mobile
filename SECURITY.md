# Security Policy

## Reporting

If you discover a security issue, do not open a public issue with full exploit details.

Instead:

1. notify the project owner privately
2. include reproduction steps, impact, and affected files
3. allow time for remediation before public disclosure

## Baseline Security Expectations

- never commit secrets or credentials
- use `.env.example` for configuration discovery
- keep client-side keys limited to public Expo-safe values
- validate input before it reaches business logic or remote APIs
- favor least privilege when configuring Supabase or any backend service

## Dependency Hygiene

- review dependency updates regularly
- check `npm audit` output during release prep
- avoid adding dependencies without a clear product or engineering reason
