# QuickCart

QuickCart is an offline-first desktop billing application for retail counters. It manages
sales, estimates, products, customer accounts, payments, receipts, and PDF invoices without
requiring a remote backend.

## Capabilities

- Fast keyboard-and-mouse billing for sales and estimates
- Product catalog with search, pricing history, images, and soft delete
- Customer accounts, payments, adjustments, and transaction ledgers
- Printable receipts and A4 PDF invoices
- Local dashboards, store settings, onboarding, and data export

## Repository

```text
apps/
  desktop/                Electron application and local API
packages/
  eslint-config/          Shared lint configuration
  typescript-config/      Shared TypeScript configuration
DESIGN.md                 Desktop UI and design-system contract
AGENTS.md                 Engineering rules for coding agents
```

The desktop application contains four source areas:

```text
apps/desktop/src/
  main/       Electron main process, Hono server, SQLite, and native handlers
  preload/    Safe renderer-to-Electron bridge
  renderer/   React application
  shared/     Types, schemas, constants, and cross-process utilities
```

## Requirements

- Node.js 22
- pnpm via Corepack; use the version declared in the root `package.json`
- Windows or Linux for packaged builds

## Quick start

```bash
corepack enable
pnpm install
pnpm dev
```

The development command starts Electron with hot reload and rebuilds `better-sqlite3` for
Electron before launch.

## Common commands

Run these from the repository root:

| Command                               | Purpose                                      |
| ------------------------------------- | -------------------------------------------- |
| `pnpm dev`                            | Start workspace development tasks            |
| `pnpm build`                          | Build all workspace packages                 |
| `pnpm lint`                           | Lint all workspace packages                  |
| `pnpm format`                         | Format the workspace                         |
| `pnpm --dir apps/desktop typecheck`   | Typecheck the Electron and renderer projects |
| `pnpm --dir apps/desktop test --run`  | Run the desktop test suite once              |
| `pnpm --dir apps/desktop build:win`   | Build the Windows installer                  |
| `pnpm --dir apps/desktop build:linux` | Build Linux AppImage and Debian packages     |

Packaged artifacts are written to `apps/desktop/dist/`.

## Runtime at a glance

Electron initializes and migrates a local SQLite database, then forks a Hono API server. The
React renderer talks to that server over local HTTP. The preload bridge is reserved for native
operations such as printing, file selection, product images, and PDF export.

Development and production use separate application data directories and ports so an installed
copy cannot conflict with local development.

## Project documentation

- [Desktop development and operations](apps/desktop/README.md)
- [UI and design-system contract](DESIGN.md)
- [Agent engineering instructions](AGENTS.md)

## License

[MIT](LICENSE)
