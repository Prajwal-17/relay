# QuickCart

Offline first desktop billing app for managing invoices, estimates, products, and customers.

## Features

- **Products** — Full CRUD, soft delete, image upload/crop, price history, search, filter, sort, grid/list view, enable/disable toggle.
- **Billing** — Ring up products, assign customers, checkout. Tracks totals and payment status.
- **Invoices** — Generate and print. Product snapshots keep past invoices accurate when prices change.
- **Estimates** — Quotes without impacting revenue.
- **Customers** — Directory for assigning to sales and estimates.
- **Dashboard** — Charts and metrics.
- **Onboarding** — First-launch wizard to set up store details.

## Getting Started

```bash
git clone https://github.com/Prajwal-17/pos.git
cd pos
pnpm install
pnpm dev
```

## Build

```bash
pnpm build:win    # Windows
pnpm build:linux  # Linux
```

Output in `dist/`.

## Commands

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `pnpm dev`             | Start dev mode with hot reload |
| `pnpm build`           | Typecheck and build            |
| `pnpm start`           | Preview production build       |
| `pnpm seed`            | Seed database                  |
| `pnpm db:migrate:dev`  | Run migrations (dev)           |
| `pnpm db:migrate:prod` | Run migrations (prod)          |
| `pnpm db:push:dev`     | Push schema to dev DB          |
| `pnpm db:push:prod`    | Push schema to prod DB         |
| `pnpm db:studio:dev`   | Open Drizzle Studio (dev)      |
| `pnpm db:studio:prod`  | Open Drizzle Studio (prod)     |

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Shadcn, Zustand, TanStack Query, React Router v7, recharts, zod.
**Backend:** Electron, Hono, better-sqlite3, Drizzle ORM.

## Architecture

Three directories under `src/`:

- `main/` — Electron process, SQLite, Hono API server.
- `renderer/` — React UI.
- `shared/` — Types, constants, Zod schemas, Utils.

## Database

Tables: app_instance, store_profile, customers, products, product_history, sales, sale_items, estimates, estimate_items.

DB file locations:

- Linux: `/home/<user>/.config/quickcart/<dbname>.db`
- Windows: `C:\Users\<username>\AppData\Roaming\quickcart\<dbname>.db`

## Common Errors & Fixes

### 1. Chrome Sandbox Error (Linux only)

```
FATAL:sandbox/linux/suid/client/setuid_sandbox_host.cc:169]
The SUID sandbox helper binary was found, but is not configured correctly.
```

Fix option 1 (set env var):

```bash
ELECTRON_DISABLE_SANDBOX=1 pnpm dev
```

The dev script in package.json already includes this.

Fix option 2 (set permissions):

```bash
sudo chown root <path-to-electron>/chrome-sandbox
sudo chmod 4755 <path-to-electron>/chrome-sandbox
```

Example:

```bash
sudo chown root /media/hdd/code/temp/pnpm/node_modules/.pnpm/electron@37.2.3/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 /media/hdd/code/temp/pnpm/node_modules/.pnpm/electron@37.2.3/node_modules/electron/dist/chrome-sandbox
```

Example:

```bash
sudo chown root /media/hdd/code/temp/pnpm/node_modules/.pnpm/electron@37.2.3/node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 /media/hdd/code/temp/pnpm/node_modules/.pnpm/electron@37.2.3/node_modules/electron/dist/chrome-sandbox
```

### 2. better-sqlite3 NODE_MODULE_VERSION Mismatch

Error: `better-sqlite3` was compiled against a different Node.js version. This happens because `better-sqlite3` is a native C++ addon. The system Node.js and Electron's embedded Node.js have different version fingerprints.

Fix for dev (Electron runtime):

```bash
pnpm rebuild better-sqlite3
```

If that fails:

```bash
rm -rf node_modules && pnpm install
```
