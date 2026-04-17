# Environment and Secrets

## Required Variables

Copy `.env.example` to `.env` and provide:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional legacy fallback:

- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Rules

- `.env` must never be committed
- use only public Expo-prefixed variables for values that are safe to expose to the client
- anything truly secret belongs in server-side infrastructure, not the mobile app bundle

## Setup

```bash
cp .env.example .env
```

Then update the values using your local development credentials.

## Security Guidance

- rotate exposed keys if they are ever committed by mistake
- never put service-role or admin credentials in Expo public env vars
- prefer separate environments for local, staging, and production
- document any new env var in `.env.example` and this file in the same PR
