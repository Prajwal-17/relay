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
| `pnpm typecheck`      | Typecheck main/preload and renderer code           |
| `pnpm test --run`     | Run Vitest once                                    |
| `pnpm format`         | Format the desktop package                         |
| `pnpm seed`           | Seed the development database                      |
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

SQLite runs in WAL mode. Migrations are applied during startup and the `drizzle/` directory is
bundled into packaged applications.

The main process loads `.env`, then `.env.<MODE>`, without overriding variables already present
in the environment. Main-process variables use the `M_VITE_` prefix; renderer variables use
`VITE_`. See `.env.example` for supported project-specific values. Development and production
data remain isolated.

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

## Display contract

The reference viewport is **1280 × 650 CSS pixels at 100% Electron zoom**; **1024 × 600** is the
supported fallback. The supported zoom range is 85%–125%, with 100% as the design baseline.

All UI work must follow the canonical [DESIGN.md](../../DESIGN.md), including density tokens,
billing behavior, print isolation, accessibility, and viewport verification.

## Tests

Vitest covers the sales, estimates, and customer-ledger flows with in-memory SQLite integration
tests under `src/main/tests/`. Shared currency, date, quantity, and product-snapshot utilities
have unit tests alongside their source in `src/shared/utils/`.

Use `src/main/tests/helpers/index.ts` for test database creation and fixtures.

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

The main development, seed, and database scripts already perform the appropriate rebuild.

### Linux Chromium sandbox

The development script sets `ELECTRON_DISABLE_SANDBOX=1`. If Electron is launched outside that
script, use the same environment setting or configure the installed Chromium sandbox correctly.

### Port already in use

Close other QuickCart development instances before restarting. The API uses fixed ports `4723`
in development and `4722` in production.
