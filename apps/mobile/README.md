# Relay Mobile

Expo and React Native application for daily money tracking, backed by Relay Server.

- Google sign-in
- Cash, PhonePe, and Paytm receipts
- Vendor payments and daily totals
- Transaction history, editing, and deletion

Money and Account are implemented. Home, Products, and Customers are placeholders.
Mobile records are stored on the server and are separate from desktop data.

## Setup

Install dependencies using the [workspace setup](../../README.md#setup).
Development requires Expo Go or an Android/iOS simulator. The iOS simulator requires macOS and Xcode.
All commands below run from `apps/mobile`:

```bash
cd apps/mobile
```

## Environment

```bash
cp .env.example .env.local
```

`EXPO_PUBLIC_SERVER_URL` sets the development backend URL and defaults to
`https://relay-dev-tunnel.prajwal.sh`. Configure [Relay Server](../server/README.md#environment)
with the same HTTPS origin and matching Google OAuth settings. Restart Expo after environment changes.

Production builds use `https://relay-server.prajwal.sh`.

## Development

```bash
pnpm dev
```

Starts Expo. Use the QR code for Expo Go, `a` for Android, or `i` for iOS.
`pnpm start` is an equivalent command. Root `pnpm dev` starts all three apps.

Relay Server and its HTTPS tunnel must be running separately when starting mobile alone.

## Build

Android APKs are built through GitHub Actions.

### Development APK

Run [Android Development Build](../../.github/workflows/mobile-dev-build.yaml) from the repository's
**Actions** tab. Select a branch (default: `dev`) and optionally override the backend URL.
Download the `mobile-android-dev` artifact containing `Relay-Dev.apk`.

Relay-Dev installs alongside production and includes the JavaScript bundle. Metro is not required;
the configured backend must remain reachable.

### Production APK

The [Android Release workflow](../../.github/workflows/mobile-release.yaml) runs on
`mobile-vX.Y.Z` tags matching the version in `app.json`. It builds a signed APK and publishes it
to GitHub Releases. Android signing secrets must be configured in the repository's production
environment as specified in the workflow.
