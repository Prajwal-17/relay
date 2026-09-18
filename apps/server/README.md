# Relay Server

`server` is Relay's hosted boundary. It remains separate from the embedded desktop Hono server:
this app runs on Cloudflare Workers, stores authenticated mobile data in D1, and exposes Better
Auth plus the user-scoped Money API.

## Stack

- Cloudflare Workers and Hono
- Cloudflare D1 with Drizzle schema definitions
- Better Auth with the Expo plugin and Google OAuth
- Wrangler-managed bindings, migrations, secrets, logs, and traces

## Local setup

Copy the local secret template and replace both values:

```bash
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm dev
```

`wrangler.jsonc` contains safe development values for `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and
`ALLOWED_ORIGINS`. Override them in the Cloudflare environment for deployment. Store secrets with
Wrangler, never in `wrangler.jsonc`:

```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
```

Create or attach a D1 database named `relay-server-db`, then add its generated `database_id` to the
D1 binding if Wrangler does not provision it automatically. Apply migrations before deploying:

```bash
pnpm db:migrate:remote
pnpm deploy
```

## Google OAuth

Create a Google OAuth web client. Set its authorized redirect URI to:

```text
https://YOUR_WORKER_DOMAIN/api/auth/callback/google
```

Set `BETTER_AUTH_URL` to that Worker origin and `GOOGLE_CLIENT_ID` to the web client ID. The mobile
client returns through the `relay://` app scheme, which is included in Better Auth's trusted
origins. Expo development origins must be added explicitly to `ALLOWED_ORIGINS` when needed.

## Schema

`src/db/schema.ts` is the single schema source. `pnpm db:generate` creates the SQL and metadata
under `drizzle/`; do not maintain a second handwritten schema. The generated migration creates
Better Auth's four tables plus the five Money tables. Every Money query is scoped by the
authenticated user. Amounts remain integer minor currency units while fields and columns use
`amount` names. Vendor suggestions come from previously entered vendor payments, so entering an
unseen name saves it automatically without a separate vendor record.

## Checks

```bash
pnpm cf-typegen
pnpm typecheck
pnpm build
```
