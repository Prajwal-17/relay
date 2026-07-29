# QuickCart Desktop

The production application in the QuickCart monorepo. It combines an Electron shell, a React
renderer, a forked Hono API server, and a local SQLite database into one offline-first desktop
package.

For repository setup and workspace commands, see the [root README](../../README.md).

## Runtime architecture

```text
Electron main process
  ├─ configures app paths and native IPC handlers
  ├─ initializes and migrates SQLite
  ├─ forks the Hono API child process
  └─ creates the renderer window

React renderer ── local HTTP ──> Hono ──> service ──> repository ──> SQLite
       │
       └──────── preload bridge ────────> native print/file/image/PDF operations
```

| Area     | Location        | Responsibility                                             |
| -------- | --------------- | ---------------------------------------------------------- |
| Main     | `src/main/`     | Electron lifecycle, database, API, IPC, packaging behavior |
| Preload  | `src/preload/`  | Context-isolated native API exposed to the renderer        |
| Renderer | `src/renderer/` | React UI, routing, queries, and client state               |
| Shared   | `src/shared/`   | Types, Zod schemas, constants, and utilities               |

The renderer uses a hash router because production is loaded through Electron's `file://`
protocol. Normal application data travels over HTTP; IPC is reserved for Electron-only
capabilities.

## Development

From the repository root:

```bash
pnpm install
pnpm --dir apps/desktop dev
```

Or from this directory:

```bash
pnpm dev
```

`pnpm dev` rebuilds the native SQLite module for Electron before starting hot reload. For
renderer-only debugging, `pnpm dev:standalone` starts the Hono server and browser Vite client;
native preload features are unavailable in that mode.

## Commands

Run these from `apps/desktop` unless shown otherwise.

| Command               | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `pnpm dev`            | Start Electron development mode                    |
| `pnpm dev:standalone` | Start the local API and browser renderer           |
| `pnpm build`          | Typecheck and create the production Electron build |
| `pnpm start`          | Preview the production build                       |
| `pnpm lint`           | Run ESLint                                         |
| `pnpm typecheck`      | Typecheck application and test code                |
| `pnpm typecheck:test` | Typecheck Vitest suites and helpers                |
| `pnpm test --run`     | Run Vitest once                                    |
| `pnpm format`         | Format the desktop package                         |
| `pnpm db:migrate:dev` | Apply development migrations                       |
| `pnpm db:studio:dev`  | Open Drizzle Studio for development data           |
| `pnpm db:push:dev`    | Push the schema to the development database        |
| `pnpm build:win`      | Build the Windows installer                        |
| `pnpm build:linux`    | Build AppImage and Debian packages                 |

Production database commands use the corresponding `:prod` suffix. Packaging output is written
to `dist/`; Electron build output is written to `out/`.

## Local data and environment

- Development app name: `QuickCart-Dev`
- Production app name: `QuickCart`
- Development API port: `4723`
- Production API port: `4722`
- Database: `<Electron userData>/pos.db`
- Product images: `<Electron userData>/product-images/`

SQLite runs in WAL mode. Schema and data migrations are applied automatically during startup. The
`drizzle/` directory is required at runtime and is bundled into packaged applications; a missing
migration directory is a startup-blocking error.

The main process loads `.env`, then `.env.<MODE>`, without overriding variables already present
in the environment. Main-process variables use the `M_VITE_` prefix; renderer variables use
`VITE_`. See `.env.example` for supported project-specific values. Development and production
data remain isolated.

## Automatic database upgrades

Before opening the application, the main process checks both the Drizzle schema journal and
`app_data_migrations`. An up-to-date database follows the normal startup path without showing an
upgrade window. Pending upgrades use a compact splash to report backup, schema, named data-repair,
verification, and server-start phases. The forked API server repeats the initialization check, but
all completed work is tracked and therefore skipped.

Data repairs are registered under `src/main/db/dataMigrations/`. Every repair runs in its own SQLite
transaction and inserts its migration ID only after the repair succeeds. Failed repairs roll back
and Retry resumes from the first unapplied ID. Fresh empty databases skip legacy placeholder data
and continue to onboarding; non-empty legacy databases receive the required default store, walk-in
customer, and preferences.

Before changing a non-empty database, QuickCart uses SQLite's consistent backup API and an atomic
temporary-file rename. Only the latest pre-upgrade backup is kept at
`<Electron userData>/backups/pos-before-upgrade-latest.db`. A small adjacent marker prevents Retry
from replacing that backup with partially upgraded data. Backup, migration, or integrity-check
failures block the API and main window. QuickCart does not restore automatically; the failure window
provides Retry, Open backup folder, and Quit.

Packaged builds must include the complete `drizzle/` directory through `extraResources`. Keep the
development and packaged migration paths covered whenever startup or packaging configuration
changes.

## Application conventions

- API modules under `src/main/modules/` follow controller → service → repository layering.
- Money is stored as integer paisa and formatted with utilities in `src/shared/utils/utils.ts`.
- Fractional quantities use integer milli-units via `src/shared/utils/milliUnits.ts`.
- Product snapshots are stored on transaction items to preserve historical invoice text.
- Products are soft-deleted by default.
- Server data belongs in TanStack Query; cross-component client workflow state belongs in
  Zustand.
- Billing rows auto-sync after an 800 ms debounce and must be flushed before navigation, print,
  or export.

Detailed implementation rules live in [AGENTS.md](../../AGENTS.md).

## Accounting model

Sales and customer accounting are intentionally separate. Every sale contributes its full
`grandTotal` to sales and tax reporting. A sale changes a customer balance only when the biller
selects **Add this sale to customer accounting**; that selection maintains one full-total ledger
row linked by sale ID. Repeated billing autosaves update that row instead of creating duplicates.
The configured default/walk-in customer cannot be added to Accounting.

`Record Payment` creates an unallocated customer-level Payment row and stores Cash, UPI, or Card;
it never changes a sale. `Quick Sale` adds an amount owed, while `Adjust Balance` can increase or
decrease the overall balance. Overpayments are valid and produce an advance. Customer
`outstanding_balance` is a recomputed ledger cache and is never directly editable. Credit limits
do not exist.

Opening Balance is optional only while creating a customer. A positive amount creates the customer
and one Opening ledger row in the same transaction; existing customers have no later set-opening
operation. Opening, Quick Sale, Payment, and Adjustment rows may be edited or deleted for 48 hours
from their immutable ledger `created_at`, then lock permanently. Sale-linked ledger rows are
changed only through their sale.

Sales use immutable `recorded_at` for the same 48-hour Edit/Delete window; the displayed invoice
`created_at` cannot extend it. Deleting within the window is a hard, atomic deletion that reverses
inventory, removes the linked ledger row, and recomputes the customer balance. Estimates remain
non-payable, and Estimate → Sale creates a normal sale without opting into Accounting.

## Display contract

The reference viewport is **1280 × 650 CSS pixels at 100% Electron zoom**; **1024 × 600** is the
supported fallback. The supported zoom range is 85%–125%, with 100% as the design baseline.

All UI work must follow the canonical [DESIGN.md](../../DESIGN.md), including density tokens,
billing behavior, print isolation, accessibility, and viewport verification.

## Tests

Vitest covers API modules through Hono requests backed by a fresh, migrated in-memory SQLite
database. Expanded suites live under `src/main/tests/integration/<module>/`; existing flat suites
remain under `src/main/tests/`. Shared currency, date, quantity, and product-snapshot utilities
have unit tests alongside their source in `src/shared/utils/`.

Reusable integration support is split by responsibility and re-exported through
`src/main/tests/helpers/index.ts`:

```text
src/main/tests/
├── setup/database.mock.ts
├── helpers/
│   ├── app.ts
│   ├── database.ts
│   ├── http.ts
│   └── fixtures/
└── integration/<module>/
```

Rebuild the native dependency for Node before database tests. Run the complete suite or only the
products integration suite with:

```bash
pnpm rebuild:node
pnpm run typecheck:test
pnpm run test --run
pnpm run test --run src/main/tests/integration/products
pnpm rebuild:electron
```

## Packaging and releases

- A push to `dev` builds and uploads unsigned Windows and Linux development artifacts.
- A push to `master` builds production artifacts and creates a GitHub release.
- Windows output is an NSIS installer.
- Linux output includes AppImage and Debian packages.

## Troubleshooting

### Native module version mismatch

`better-sqlite3` must match the runtime ABI:

```bash
pnpm rebuild:electron  # before Electron development
pnpm rebuild:node      # before Node-only scripts or tests
```

The development and database commands already perform the appropriate rebuild.

### Linux Chromium sandbox

The development script sets `ELECTRON_DISABLE_SANDBOX=1`. If Electron is launched outside that
script, use the same environment setting or configure the installed Chromium sandbox correctly.

### Port already in use

Close other QuickCart development instances before restarting. The API uses fixed ports `4723`
in development and `4722` in production.
