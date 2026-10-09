# Relay Server

Cloudflare Workers API for Relay Mobile, using Hono, Cloudflare D1, and Better Auth.

Provides Google authentication and user-scoped storage for receipts, vendor payments, and daily
money totals. Relay Desktop uses its own local API and database.

## Setup

Install dependencies using the [workspace setup](../../README.md#setup).
All commands below run from `apps/server`:

```bash
cd apps/server
```

## Environment

```bash
cp .dev.vars.example .dev.vars
```

Local secrets are loaded from `.dev.vars`:

- `BETTER_AUTH_SECRET`: random secret of at least 32 characters.
- `GOOGLE_CLIENT_SECRET`: Google OAuth web client secret.

Development settings are defined in `wrangler.jsonc` under `env.development.vars`:

- `GOOGLE_CLIENT_ID`: the OAuth client ID matching `GOOGLE_CLIENT_SECRET`.
- `BETTER_AUTH_URL`: the public HTTPS backend origin.
- `ALLOWED_ORIGINS`: permitted web origins and mobile callback schemes.

The default development origin is `https://relay-dev-tunnel.prajwal.sh`. Configure a Cloudflare
Tunnel forwarding this origin to `http://localhost:8787` and register the Google OAuth redirect URI:

```text
https://relay-dev-tunnel.prajwal.sh/api/auth/callback/google
```

For a different HTTPS origin, update these settings, the OAuth redirect URI, and mobile's
`EXPO_PUBLIC_SERVER_URL`. Preserve the existing mobile callback schemes in `ALLOWED_ORIGINS`.

## Development

Apply local database migrations before the first run:

```bash
pnpm db:migrate:local
pnpm dev
```

Uses the `development` environment and local D1 storage. API: `http://localhost:8787`;
health endpoint: `/health`. The HTTPS tunnel runs separately.

## Build

```bash
pnpm build
```

Produces the Worker bundle in `dist/` using the default production configuration.
This is a dry run and does not deploy the Worker.
