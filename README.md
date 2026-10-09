# Relay

Relay is a retail billing and money management application.

- **Desktop:** Offline billing, sales and estimates, product management, customer accounts,
  receipts, and PDF invoices.
- **Mobile:** Daily money tracking, Cash/PhonePe/Paytm receipts, vendor payments, and transaction
  history with Google sign-in.
- **Server:** Authentication and data storage for the mobile app.

Desktop and mobile currently maintain separate records.

## Requirements

- Node.js 24 (desktop also supports Node.js 22)
- pnpm 9.0.0

## Setup

Install workspace dependencies from the repository root:

```bash
pnpm install
```

## Environment

Configuration is per app; no root `.env` is required.

```bash
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/server/.dev.vars.example apps/server/.dev.vars
```

- **Mobile:** `EXPO_PUBLIC_SERVER_URL` specifies the development backend's HTTPS URL.
- **Server:** `.dev.vars` requires `BETTER_AUTH_SECRET` and `GOOGLE_CLIENT_SECRET`. Google OAuth
  and the HTTPS tunnel are covered in the [server environment guide](apps/server/README.md#environment).
- **Desktop:** `.env` is optional. Copy `apps/desktop/.env.example` to `apps/desktop/.env` for
  local overrides; see [desktop environment configuration](apps/desktop/README.md#environment).

Apply the server's local database migrations:

```bash
pnpm --dir apps/server db:migrate:local
```

## Development

```bash
pnpm dev
```

Starts desktop, mobile's Expo development server, and the API at `http://localhost:8787`.
Mobile requires Expo Go or a simulator and a reachable HTTPS backend. The backend tunnel runs
separately.

## Build

```bash
pnpm build
```

Builds desktop to `apps/desktop/out/` and the server bundle to `apps/server/dist/`.
Android APKs use GitHub Actions; desktop installers use the app-specific packaging commands.

## Applications

- [Desktop](apps/desktop/README.md)
- [Mobile](apps/mobile/README.md)
- [Server](apps/server/README.md)
