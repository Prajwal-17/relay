# AGENTS.md

## Project Overview

QuickCart is an offline-first desktop billing app for managing invoices, estimates, products, and customers. Built with Electron + React + Hono + SQLite.

## Repository

- **GitHub**: https://github.com/Prajwal-17/pos
- **Package Manager**: pnpm (v10+)
- **Node**: 22.17.0

## Architecture

```
src/
├── main/       # Electron main process + Hono API server + SQLite
├── preload/    # contextBridge exposing native APIs to renderer
├── renderer/   # React frontend (Vite + Tailwind v4 + Shadcn/ui)
└── shared/     # Types, Zod schemas, utils used by both main + renderer
```

### Process Model

1. **Electron main process** (`src/main/index.ts`) initializes the SQLite database, then **forks** the Hono server as a **child process** (`src/main/server.ts`).
2. The **React renderer** communicates with the Hono server via HTTP `fetch` on `localhost:4722` (prod) / `localhost:4723` (dev). See `src/renderer/src/lib/apiClient.ts`.
3. The **preload script** (`src/preload/index.ts`) uses `contextBridge` to expose Electron-specific APIs (print, file dialogs, image save, PDF export) to the renderer.
4. **IPC handlers** (`src/main/ipcHandlers/`) handle native Electron operations invoked from the renderer.

## Tech Stack

| Layer               | Technology                                                                 |
| ------------------- | -------------------------------------------------------------------------- |
| Desktop shell       | Electron 39                                                                |
| Build tool          | electron-vite                                                              |
| Frontend            | React 19, Vite 7, Tailwind CSS v4, Shadcn/ui (new-york style)              |
| Routing             | React Router v7 (hash router — required for Electron's `file://` protocol) |
| API server          | Hono 4 (forked child process)                                              |
| Database            | better-sqlite3 + Drizzle ORM                                               |
| State (server data) | TanStack Query                                                             |
| State (client)      | Zustand with immer + devtools middleware                                   |
| Validation          | Zod v4                                                                     |
| Animation           | motion (framer-motion)                                                     |
| Charts              | recharts                                                                   |
| Testing             | Vitest v4                                                                  |
| Linting             | ESLint 9 (flat config) + Prettier + prettier-plugin-tailwindcss            |

## Commands

| Command                | Description                                                                  |
| ---------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`             | Start Electron dev mode with hot reload (rebuilds better-sqlite3 first)      |
| `pnpm build`           | Typecheck (`typecheck:node` + `typecheck:web`) then build with electron-vite |
| `pnpm test`            | Run Vitest tests                                                             |
| `pnpm lint`            | Lint with ESLint                                                             |
| `pnpm format`          | Format with Prettier                                                         |
| `pnpm typecheck`       | Run both `typecheck:node` and `typecheck:web`                                |
| `pnpm seed`            | Seed the database with sample data                                           |
| `pnpm db:migrate:dev`  | Run Drizzle migrations (development)                                         |
| `pnpm db:migrate:prod` | Run Drizzle migrations (production)                                          |
| `pnpm db:studio:dev`   | Open Drizzle Studio (development)                                            |
| `pnpm db:studio:prod`  | Open Drizzle Studio (production)                                             |
| `pnpm db:push:dev`     | Push schema to dev DB                                                        |
| `pnpm db:push:prod`    | Push schema to prod DB                                                       |
| `pnpm build:win`       | Build Windows installer                                                      |
| `pnpm build:linux`     | Build Linux AppImage + deb                                                   |
| `pnpm start`           | Preview production Electron build                                            |

Output directories: `out/` (dev build), `dist/` (packaged installers).

## TypeScript Path Aliases

```json
{
  "@/*": "src/renderer/src/*",
  "@shared/*": "src/shared/*"
}
```

`@/*` works in the renderer. `@shared/*` works in both main and renderer. These are configured in `tsconfig.web.json` and `electron.vite.config.ts`.

## Database

- **Engine**: SQLite via `better-sqlite3` (WAL journal mode)
- **ORM**: Drizzle ORM
- **Schema**: `src/main/db/schema.ts`
- **Migrations**: `drizzle/` directory (copied into packaged app as extra resources)
- **DB location**: `app.getPath("userData")/pos.db` (e.g., `~/.config/quickcart/pos.db` on Linux)
- **Dev DB**: Separate `QuickCart-Dev` directory so dev and prod don't conflict

### Tables

- `app_instance` — Single-row OS install tracking
- `store_profile` — Store identity (name, owner, address, GSTIN)
- `customers` — Customer directory (role: cash/account/hotel)
- `products` — Product catalog (soft-delete via `isDeleted`/`deletedAt`)
- `product_history` — Price/MRP/purchase price change audit log
- `sales` — Sales transactions
- `sale_items` — Line items per sale
- `estimates` — Estimate transactions
- `estimate_items` — Line items per estimate
- `app_preferences` — JSON-config settings

## Module Pattern (N-Tier)

Every API module follows a strict 3-layer pattern under `src/main/modules/<name>/`:

```
Controller  (*.controller.ts) — Hono route definitions, input validation
    ↓
Service     (*.service.ts)     — Business logic, orchestration
    ↓
Repository  (*.repository.ts)  — Raw Drizzle database queries
```

Plus optional `*.schema.ts` (Zod validation schemas) and `*.types.ts` (TypeScript types).

### Existing Modules

| Module         | Prefix                 |
| -------------- | ---------------------- |
| `onboarding`   | `/api/onboarding`      |
| `dashboard`    | `/api/dashboard`       |
| `products`     | `/api/products`        |
| `customers`    | `/api/customers`       |
| `sales`        | `/api/sales`           |
| `estimates`    | `/api/estimates`       |
| `preferences`  | `/api/app-preferences` |
| `storeProfile` | `/api/store-profile`   |

When adding a new feature that needs API endpoints, follow this same pattern.

## Key Conventions

### Prices are in Paisa

All monetary values are stored as integers in **paisa** (Indian currency subunit). Convert to rupees only for display using utilities from `src/shared/utils/utils.ts`:

```ts
import { convertToRupees, convertToPaisa, formatToRupees } from "@shared/utils/utils";
```

### Product Snapshots

Products have a computed `productSnapshot` field — a searchable display string like `"Amul Gold Milk 1L 1Litre 72Rs"`. Generated by `generateProductSnapshot()` in `src/shared/utils/productSnapshot.ts`. This is embedded in `sale_items` and `estimate_items` so past invoices remain accurate when product details change.

### Soft Delete

Products use soft delete (`isDeleted` / `deletedAt` fields), not hard delete. There are separate REST endpoints for soft delete and hard delete. Restore is also supported.

### API Response Format

All endpoints return:

```json
{ "status": "success", "data": <T> }
```

Or on error:

```json
{ "status": "error", "error": { "message": "..." } }
```

Error handling in `src/main/server.ts` catches `HTTPException`, `SqliteError`, and `AppError` (custom error class from `src/main/utils/appError.ts`).

### Billing Sync Pattern

The billing UI uses a debounced auto-sync pattern:

- Line items are synced to the Hono server incrementally (not batch)
- `src/renderer/src/utils/syncWorker.ts` debounces changes (800ms) before POSTing
- Each item tracks row-level sync status: `SAVING` | `IS_DIRTY` | `SYNCED`
- `flushSync()` provides a promise-based interface to wait for sync completion before navigation/export

### Cursor-Based Pagination

List endpoints use `limit` + `nextPageNo` (cursor) pattern. Returns `null` for `nextPageNo` when there are no more pages.

### Environment Variables

- Env files: `.env.development`, `.env.production` (selected by `MODE`)
- Main process env vars use `M_VITE_` prefix (required by electron-vite)
- Renderer env vars use `VITE_` prefix (standard Vite)
- Schema: `.env.example` at project root

### Zoom Persistence

Zoom level is persisted in `electron-store` and restored on window `ready-to-show`.

## Adding UI Components (Shadcn)

Shadcn/ui uses new-york style with neutral base color. Components live under `src/renderer/src/components/ui/`. Use the `cn()` utility from `@/lib/utils` for className merging. Existing UI components are listed in `components.json`.

## Environment & Modes

| Variable   | Values                       | Effect                              |
| ---------- | ---------------------------- | ----------------------------------- |
| `MODE`     | `development` / `production` | Selects env file, DB path, API port |
| `NODE_ENV` | `development` / `production` | Standard Node env                   |

In dev mode, the app name is `QuickCart-Dev`, userData goes to `QuickCart-Dev/`, and the API runs on port 4723.

## Testing

- **Framework**: Vitest v4
- **Config**: `src/vitest.config.ts`
- **Database**: Tests use in-memory SQLite (`:memory:`) via `better-sqlite3`
- **Test helpers**: `src/main/tests/helpers/index.ts` provides `createTestDb()`, `createTestApp()`, seed functions, and cleanup
- **Mocking**: The main process `db.ts` is mocked with `vi.mock("../db/db", ...)` to inject the test DB
- **Test files**:

| File                               | Type                                           |
| ---------------------------------- | ---------------------------------------------- |
| `src/main/tests/sales.test.ts`     | Integration (full sale create + sync flow)     |
| `src/main/tests/estimates.test.ts` | Integration (full estimate create + sync flow) |
| `src/shared/tests/utils.test.ts`   | Unit (currency conversion utilities)           |

Run tests: `pnpm test`

## CI/CD (GitHub Actions)

### dev-build.yaml

- Trigger: push to `dev` branch
- Builds Windows + Linux dev installers
- Uploads artifacts (does not create a release)

### prod-build.yaml

- Trigger: push to `master` branch
- Builds Windows + Linux production installers
- Creates a GitHub Release with all artifacts + latest.yml files (for electron-updater)

## Formatting & Linting

- **Prettier**: `singleQuote: false`, `semi: true`, `printWidth: 100`, `trailingComma: "none"`, Tailwind CSS plugin
- **ESLint**: Flat config (TypeScript + React + React Hooks + React Refresh + Prettier)
- **Ignored in lint**: `node_modules`, `dist`, `out`, `src/renderer/src/components/ui/**` (Shadcn generated components)

Run before committing: `pnpm format && pnpm lint && pnpm typecheck`

## Common Pitfalls

1. **better-sqlite3 NODE_MODULE_VERSION mismatch**: Always run `pnpm rebuild better-sqlite3` after switching Node versions. The `dev` script does this automatically via `pnpm run rebuild:electron`.

2. **Chrome sandbox (Linux)**: The dev script sets `ELECTRON_DISABLE_SANDBOX=1`. See README for alternative fix.

3. **Module import timing in main process**: Modules that call `app.getPath()` must be lazy-imported after `app.setPath()` has run. This is why `setupIpcHandlers` and `electronStore` use dynamic `import()` in `src/main/index.ts`.

4. **Hash router**: React Router must use `createHashRouter` because Electron loads from `file://` protocol in production. `BrowserRouter` would fail.

5. **Drizzle migrations in packaged app**: The `drizzle/` folder is bundled as extra resources and read from `process.resourcesPath` when packaged. The main process sets `M_VITE_MIGRATION_FOLDER` accordingly.

6. **Single instance lock**: The app prevents multiple instances via `app.requestSingleInstanceLock()`. Second instance triggers focus of the existing window.

7. **Dev vs Prod separation**: Dev builds use `QuickCart-Dev` app name, separate userData directory, separate appId, and different port to avoid conflicts with installed production build.
