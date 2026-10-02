# Relay Mobile

Relay Mobile is the authenticated Expo companion for the shop's daily Money workflow. Google sign-in
opens Money first. Home is a sample dashboard; Products and Customers remain simple “Coming soon”
placeholders until those workflows are ready. Profile contains the account and sign-out action.

The Home dashboard reads its illustrative shop, sales, chart, transaction, and product content from
[`src/features/home/dashboard-data.json`](src/features/home/dashboard-data.json). These figures are
separate from the authenticated Money API and are labeled as sample data on screen.

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

Release publishing in `mobile-release.yaml` uses GitHub CLI, as does the desktop release workflow.

Android releases keep the application ID `com.prajwal17.relay`. GitHub Actions generates the native
project with Expo Prebuild, compiles and signs an APK with Gradle, and publishes the APK to a GitHub
Release. EAS Build and Submit are not part of the release process. The APK can be installed directly.
Starting with `mobile-v0.0.7`, the Gradle build also includes `expo-updates` and points to Relay's
`production` EAS Update channel. Earlier APKs cannot receive OTA updates; install the new signed APK
once before testing OTA. Keep the same Android signing key for updates to install over an existing app.

Set the repository variable `MOBILE_SERVER_URL` to the deployed HTTPS Worker origin. The URL is
embedded in the app at build time. The workflow also needs four repository secrets:

- `MOBILE_ANDROID_KEYSTORE_BASE64`: base64-encoded JKS upload key
- `MOBILE_ANDROID_KEYSTORE_PASSWORD`: keystore password
- `MOBILE_ANDROID_KEY_ALIAS`: key alias
- `MOBILE_ANDROID_KEY_PASSWORD`: key password

The first release key is backed up outside the repository at
`~/.local/share/relay/mobile-signing/`. Back up that directory securely: future APKs need the same
key to update installed copies. APKs signed with the earlier test key must be uninstalled before a
newly signed release can be installed.

For each release, increment both `expo.version` and `expo.android.versionCode` in `app.json`, then
push a `mobile-v<version>` tag pointing to the release commit (for example, `mobile-v0.0.7`). The
tag must match `expo.version`. The `Mobile Android GitHub Release` workflow runs lint and typecheck,
generates the Android project, builds a signed APK, and creates a GitHub Release with that APK.
Confirm the app version, backend URL, and Google sign-in configuration before tagging; the workflow
does not perform backend or OAuth smoke checks. Re-running publication for an existing release fails
instead of replacing its APK. A native dependency, config, or Expo SDK change still needs a
new APK and app version. The `appVersion` runtime policy keeps OTA updates within that app version.

For JavaScript, styling, or asset changes after installing the `0.0.7` APK, run the
`Mobile Android Production OTA Update` GitHub workflow from the commit to publish. The EAS update
message comes from that commit's subject; provide only the rollout percentage. Use `100` for an
immediate full release or `1`–`99` for a partial rollout; the workflow omits EAS's rollout flag for a
full release. Set the repository secret `EXPO_TOKEN`, and set
`EXPO_PUBLIC_SERVER_URL` in the EAS `production` environment to the same HTTPS backend used by the
APK (`MOBILE_SERVER_URL`). The workflow requires a published GitHub Release for the current app
version. Configure the `production` EAS channel and environment before using the workflow; it publishes
to that channel. Force close and reopen the release app up to twice to download and apply the update.
A partial rollout must be completed or
reverted before publishing another update for the same runtime. To increase an existing rollout,
run the same workflow with its EAS update group ID in `existing_update_group` and set
`rollout_percentage` to the new total percentage (use `100` to finish it). This edits the existing
update; leave `existing_update_group` empty to publish a new one.

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

For a standalone Android test APK, open **Actions → Android Development Build → Run workflow**.
Choose a source branch (default: `dev`) and optionally a backend URL. The URL defaults to the repository
variable `MOBILE_DEV_SERVER_URL`, then `MOBILE_SERVER_URL`. Download `mobile-android-dev` from the run's
**Artifacts** section and install `Relay-Dev.apk`.
The selected branch must include the development variant config and scheme-aware auth client.

The workflow uses `APP_VARIANT=development` to build `com.prajwal17.relay.dev` with the `relay-dev://`
callback scheme. It installs alongside Relay, uses the template's debug signing key, and bundles the
selected branch's JavaScript without requiring Metro. OTA updates are disabled for this variant.
Add `relay-dev://` and `relay-dev://*` to the chosen backend's `ALLOWED_ORIGINS` for Google sign-in.
The workflow uploads an artifact only; it does not publish a release or an EAS update.

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
