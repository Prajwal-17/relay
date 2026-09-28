# Relay Mobile

Relay Mobile is the authenticated Expo companion for the shop's daily Money workflow. Google sign-in
opens Money first. Home, Products, and Customers remain simple “Coming soon” placeholders until those
workflows are ready; Profile contains the account and sign-out action.

## Stack

- Expo SDK 57 with Expo Router tabs, full-page history, and compact add/date drawers
- React Native 0.86 and React 19.2
- React Native Reusables source-owned primitives with UniWind and Tailwind CSS 4
- Better Auth's Expo client with SecureStore-backed native cookies
- TanStack Query for API state, cancellation, retries, focus, and connectivity
- `react-native-calendars` for the date-only Money calendar drawer
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

## Android production releases

Android releases use the permanent application ID `com.prajwal17.relay`, an EAS-managed signing
key, directly installable APKs, remote version codes, and the EAS Update `production` channel. No
Google Play account is required. The app version in `app.json` is also its update runtime; increment
it before each new APK release and whenever native code or native configuration changes.

Before the first release, create an Expo access token and save it as the `EXPO_TOKEN` secret on the
GitHub `production` environment (a repository Actions secret also works). Add
`EXPO_PUBLIC_SERVER_URL` as a project-scoped, plain-text variable in the EAS `production`
environment; both builds and updates read the same value from EAS. This URL is embedded in the client
and is not a secret. Configure the Android signing key in EAS once before the first non-interactive
build. EAS can generate and retain the key; never commit or casually replace it because every future
APK must use the same key to update an installed copy of the app.

```bash
cd apps/mobile
pnpm dlx eas-cli@latest env:set \
  --environment production \
  --name EXPO_PUBLIC_SERVER_URL \
  --value https://api.example.com \
  --visibility plaintext \
  --scope project
pnpm dlx eas-cli@latest credentials:configure-build --platform android --profile production
```

Run the `Mobile Android GitHub Release` workflow after incrementing `expo.version` in `app.json`. It
validates the app and EAS production environment, creates a signed `.apk`, and publishes the APK and
its SHA-256 checksum as a GitHub Release tagged `mobile-v<version>`. Share that APK with the store's
devices; Android users may need to allow installing apps from their browser or file manager.

For JavaScript, styling, and asset-only changes, run `Mobile Android Production OTA Update` with an
update message and rollout percentage. It uses the same production URL from EAS and publishes only
to Android builds on the `production` channel with the matching app-version runtime. Force-close and
reopen the app up to twice to download and apply an eligible update. Native dependency, permission,
Expo SDK, or app-config changes require an app version bump and a new production APK instead.

For a solo release process, the same OTA update can be published directly from the CLI instead of
GitHub Actions:

```bash
cd apps/mobile
pnpm dlx eas-cli@latest update \
  --channel production \
  --environment production \
  --platform android \
  --message "Describe the change"
```

## Design

`global.css` maps desktop `DESIGN.md` semantics into React Native Reusables' standard Tailwind 4
roles: warm background, white tally surfaces, charcoal structure, terracotta active-work cues, teal
received-money cues, and the established neutral border ramp. Mobile color literals use native-safe
hex values; desktop remains the OKLCH source of truth. The mobile visual direction is Counter
Cashbox: totals form the lid, payment methods form aligned compartments, and the white Material-style
bottom navigation uses a compact soft-terracotta active icon container. Screens use Inter,
restrained 6px/8px radii, borders before shadows, tabular financial numerals, responsive wrapping,
safe areas, and at least 44px touch targets. Bottom drawers keep short input tasks in context.

Mutation feedback belongs to the initiating control. Add, delete, sign-in, and sign-out actions stay
visibly pending and duplicate-safe through the server request, active-query synchronization, outcome
feedback, and any success haptic; sheets and dialogs do not dismiss early.

## Development

Start the server first, then point Expo at it. Android emulators use `10.0.2.2` instead of
`localhost`; physical devices need a reachable LAN or deployed Worker URL. For a phone on the same
Wi-Fi, set `EXPO_PUBLIC_SERVER_URL` and `BETTER_AUTH_URL` to the computer's current LAN IP, and make
`ALLOWED_ORIGINS` match the Expo LAN origin. Wrangler's dev script listens on the LAN so the phone
can reach it.

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

The component registry is configured in `components.json`. Add or diagnose source-owned UI
primitives from `apps/mobile` with `pnpm ui:add <component>` and `pnpm ui:doctor`. Registry
components must be adapted to Relay's semantic tokens, compact geometry, Inter typography, and
minimum touch targets instead of accepting the registry's default visual theme unchanged.

Android and iOS are the primary targets. Real-device review should cover narrow screens, the keyboard,
native sheets, tab bar safe-area spacing, OAuth cancellation, offline recovery, long names/notes, and
large Indian-formatted values.
