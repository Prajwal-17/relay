# Relay Desktop

Offline retail billing application built with Electron, React, and SQLite.

- Sales and estimates
- Product catalog and pricing
- Customer accounts, payments, and balances
- Printed receipts, PDF invoices, and sales summaries

The application includes a local API and database. Relay Server is not required.

## Setup

Install dependencies using the [workspace setup](../../README.md#setup).
All commands below run from `apps/desktop`:

```bash
cd apps/desktop
```

## Environment

Environment configuration is optional. For local overrides:

```bash
cp .env.example .env
```

- `M_VITE_API_PORT`: local API port; defaults to `4723` in development and `4722` in production.
- `M_VITE_USER_DATA_DIR`: custom data directory; must be an existing absolute path.

Development loads `.env` and `.env.development`. Existing process variables take precedence,
followed by `.env`. Database creation and migrations run automatically at startup.

## Development

```bash
pnpm dev
```

Starts Electron with hot reload and rebuilds the native SQLite module.
Development uses the **Relay-Dev** identity and a separate data directory from production.

## Build

```bash
pnpm build
```

Compiled output: `out/`.

### Windows installer

```bash
pnpm build:win
```

### Linux packages

```bash
pnpm build:linux
```

Packaging commands include compilation. Artifacts are written to `dist/`: `.exe` on Windows,
`.AppImage` and `.deb` on Linux.
