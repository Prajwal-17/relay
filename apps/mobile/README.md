# Relay Mobile

Relay Mobile is the authenticated Expo companion for the shop's daily Money workflow. Google sign-in
opens Money first. Home, Products, and Customers remain simple “Coming soon” placeholders until those
workflows are ready.

## Stack

- Expo SDK 57 with Expo Router tabs and platform-aware native modals
- React Native 0.86 and React 19.2
- UniWind with Tailwind CSS 4
- Better Auth's Expo client with SecureStore-backed native cookies
- TanStack Query for API state, cancellation, retries, focus, and connectivity
- `react-native-calendars` for the date-only Money calendar
- Local Inter font files, Lucide icons, and documented official payment marks

## Money workflow

Money loads the authenticated Cloudflare API in `apps/server`. A user can choose today or an earlier
India business date, review received/paid/net totals, add multiple entries for Cash or any active
payment method, inspect per-method entry history, record vendor payments with optional notes, view
untruncated vendor details, and delete the selected day's record.

The app has no local business database and does not import desktop data. Money values remain integer
paisa in transit and dates use the Asia/Kolkata business day. Future dates are disabled in the UI and
rejected by the server. Payment method management is server-owned; the mobile Money screen consumes the
methods returned by `/api/money/overview`.

## Authentication and resilience

Better Auth restores the SecureStore-backed session before protected routes render. Google OAuth is
the only sign-in method; the first successful sign-in creates the account. Cancellation, offline,
authentication, loading, empty, and API-error states are handled explicitly. Mutating controls pause
while offline, while cached TanStack Query data remains visible.

## Design

`global.css` maps desktop `DESIGN.md` semantics into Tailwind 4 tokens: warm canvas, white surfaces,
charcoal actions, neutral selection, and terracotta focus cues. Screens use Inter, restrained 6px/8px
radii, borders before shadows, tabular financial numerals, responsive wrapping, safe areas, and at
least 44px touch targets. iOS sheets and Android full-screen modals use native transitions; tab
switching intentionally uses no additional JavaScript animation.

## Development

Start the server first, then point Expo at it. Android emulators use `10.0.2.2` instead of
`localhost`; physical devices need a reachable LAN or deployed Worker URL.

```bash
pnpm install
cp apps/server/.dev.vars.example apps/server/.dev.vars
pnpm --dir apps/server db:migrate:local
pnpm --dir apps/server dev

cp apps/mobile/.env.example apps/mobile/.env.local
# Set EXPO_PUBLIC_SERVER_URL in apps/mobile/.env.local
pnpm --dir apps/mobile start
```

Google sign-in also requires the OAuth values documented in `apps/server/README.md`.

Static checks:

```bash
pnpm --dir apps/mobile lint
pnpm --dir apps/mobile typecheck
```

Android and iOS are the primary targets. Real-device review should cover narrow screens, the keyboard,
native sheets, tab bar safe-area spacing, OAuth cancellation, offline recovery, long names/notes, and
large Indian-formatted values.
