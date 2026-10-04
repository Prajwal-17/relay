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

`pnpm dev` selects Wrangler's `development` environment. Start your Cloudflare Tunnel with
`https://relay-dev-tunnel.prajwal.sh` forwarding to `http://localhost:8787`. Expo Go and Relay-Dev
use that HTTPS origin for API requests and Google sign-in. Local D1 migrations select the same
environment and use local storage; remote migrations still target the production database.

`wrangler.jsonc` keeps production as the default deployment configuration:

| Command           | Environment       | `BETTER_AUTH_URL`                     |
| ----------------- | ----------------- | ------------------------------------- |
| `pnpm dev`        | Local development | `https://relay-dev-tunnel.prajwal.sh` |
| `pnpm run deploy` | Production        | `https://relay-server.prajwal.sh`     |

Variables and D1 bindings are explicitly configured for each environment. Store production secrets
with Wrangler, never in `wrangler.jsonc`; local secrets stay in the ignored `.dev.vars` file:

```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
```

Production's `relay-server.prajwal.sh` custom domain is attached to the `relay-server` Worker and
serves requests independently of the development tunnel. Check
`https://relay-server.prajwal.sh/health` after deploying. The development environment has no Worker
routes, so your tunnel continues to reach the local server. Configuration changes take effect on the
deployed Worker only after `pnpm run deploy`.

Create or attach a D1 database named `relay-server-db`, then add its generated `database_id` to the
D1 binding if Wrangler does not provision it automatically. Apply migrations before deploying:

```bash
pnpm db:migrate:remote
pnpm run deploy
```

## Google OAuth

Use the configured Google OAuth web client and register both authorized redirect URIs:

```text
https://relay-dev-tunnel.prajwal.sh/api/auth/callback/google
https://relay-server.prajwal.sh/api/auth/callback/google
```

`BETTER_AUTH_URL` already matches each environment's origin. Update `GOOGLE_CLIENT_ID` in both
environments if you replace the web client. Production returns through `relay://`; development also
trusts `relay-dev://` and Expo Go callback origins. For browser testing through a different LAN
origin, add its exact URL to development's `ALLOWED_ORIGINS`.

## Schema

`src/db/schema.ts` is the single schema source. `pnpm db:generate` creates the SQL and metadata
under `drizzle/`; do not maintain a second handwritten schema. The generated migration creates
Better Auth's four tables plus the five Money tables. Every Money query is scoped by the
authenticated user. Amounts remain integer minor currency units while fields and columns use
`amount` names. Vendor suggestions come from previously entered vendor payments, so entering an
unseen name saves it automatically without a separate vendor record.

Money calendar validation, India business dates, and week/month arithmetic use
`@relay/shared/date-utils`, also consumed by desktop and mobile. Ledger date values remain
`YYYY-MM-DD`; timestamps are stored as UTC ISO strings. Each received and vendor entry has
immutable `createdAt` and an `updatedAt` set on creation and every successful edit. API reads and
mutation responses include both; a day's timestamps do not replace individual entry timestamps.

## Checks

```bash
pnpm cf-typegen
pnpm typecheck
pnpm build
```

## Quick Ledger provider rollout

New received entries accept Cash (`paymentMethodId: null`), PhonePe, and Paytm using user-owned
IDs. `/api/money/overview` adds grouped `receivedCounts`; `/api/money/summaries?year=&month=`
returns a read-only month ledger. Unsupported-provider receipts remain in totals and history.
The service rejects unsupported creation/reactivation and new receipts with an actionable error.

`0001_money_ledger.sql` ensures the two presets exist and are active, then archives earlier
providers. It preserves IDs, original names, receipts, and balances. Wrangler tracks and applies
the combined migration once. Apply and verify locally before any remote migration. Deploy compatible additive API fields first; coordinate
the new client, provider policy, and catalog migration together. Rollback may restore provider
availability without deleting or relabeling receipts. No production migration is part of UI review.

Run `pnpm test` with Node 24 or newer, `pnpm typecheck`, and `pnpm build`. Tests use real in-memory
SQLite with a D1 adapter and cover fresh/legacy migrations, ownership, counts, preserved
history, totals, date validation, and safe-integer limits. `pnpm build` is a Wrangler dry run.

## Money reads and mutation responses

- `GET /api/money/weeks?startDate=&endDate=` validates one Sunday–Saturday range and returns
  seven `{ date, entry, receivedCounts }` slots plus payment methods. Four batched range queries
  fetch daily data without per-day requests. The current week may end after today; writes still
  reject future dates.
- `GET /api/money/received-history?date=&paymentMethod=&beforeId=` filters by the authenticated
  user, business date, and actual method ID or `cash`. It returns up to 50 entries, the method
  metadata (`null` for Cash), total, and nullable `nextCursor`.
- `GET /api/money/vendors` returns all distinct trimmed, case-insensitive vendor names, newest
  first, for local filtering. The existing `?q=` search remains compatible with older clients.
- Received/vendor POSTs and received/vendor/day DELETEs now return JSON with the canonical
  affected `day`. Received POST also returns `receivedEntry`; vendor writes and day deletion
  return the complete `vendorNames`. The new client patches its cache without extra GETs.

The legacy overview, day, method, and received-entry read endpoints remain available. Deploy the
API additions before releasing the updated client. No schema migration is needed for these reads.

Money received and vendor entries support authenticated GET/PATCH by ID at
`/api/money/received-entries/:id` and `/api/money/vendor-payments/:id`. PATCH validates positive
integer-paisa amounts and editable method/vendor/note fields, preserves the original ID/date/creation time,
and returns canonical affected-day data plus the edited record (and vendor catalog when relevant).
Received method changes reconcile both totals; historical methods can remain on their own entries
but cannot receive transferred entries. All reads and writes are user-scoped.

The same `0001_money_ledger.sql` adds required `updated_at` fields and backfills existing entries with
`created_at`; earlier edit times cannot be reconstructed. It rebuilds only the two payment tables
with foreign keys enabled, preserving data, IDs, indexes, constraints, and AUTOINCREMENT counters.
Apply it with `pnpm db:migrate:local` for development and the existing remote migration command
before deploying the updated API. Migration tests cover populated, fully deleted, and fresh tables.

The Node 24 test runner reads `tests/*.test.ts` through `scripts/register-tests.ts`.
`pnpm typecheck` checks both server code and the Node test fixtures in `tsconfig.test.json`.
