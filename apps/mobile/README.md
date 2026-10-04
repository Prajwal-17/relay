# Relay Mobile

Relay Mobile is the authenticated Expo companion for the shop's daily Money workflow. Google sign-in
opens Money first. The bottom tabs are Home, Products, Money, Customers, and Account. Money and
Account are functional; the other tabs share a simple “Coming soon” screen. The sample dashboard
and its data have been removed. Received and vendor entry use the full-screen `/money-entry` route; history and vendor
details remain separate screens. The unused standalone vendor-payment route has been removed.

## Stack

- Expo SDK 57 with Expo Router tabs, full-screen entry/history, and a compact date drawer
- React Native 0.86 and React 19.2
- React Native Reusables source-owned primitives with UniWind and Tailwind CSS 4
- Better Auth's Expo client with SecureStore-backed native cookies
- TanStack Query for API state, cancellation, retries, focus, and connectivity
- `react-native-calendars` for the date-only Money calendar drawer
- Local Inter font files, Lucide icons, and documented official payment marks

Metro keeps UniWind's native adapter imports pointed at the app's React Native entry, including
additional pnpm peer-dependency copies, to avoid recursive native export getters. After dependency
or Metro configuration changes, restart Expo with `pnpm start --clear` (add `--tunnel` when needed).

## Money workflow

Money loads the authenticated Cloudflare API in `apps/server`. A user can choose today or an earlier
India business date, review received/paid/net totals, add multiple entries for Cash, PhonePe, or
Paytm, inspect per-method entry history, record vendor payments with optional notes, view
untruncated vendor details, edit received/vendor entries, and delete the selected day's record.

The app has no local business database and does not import desktop data. Money values remain integer
paisa in transit and dates use the Asia/Kolkata business day. Future dates are disabled in the UI and
rejected by the server. Payment method management is server-owned; the mobile Money screen consumes the
methods returned by `/api/money/weeks?startDate=&endDate=`. Earlier methods remain visible in day totals and history.
The pinned month-only header leads a flat Sunday-first week pager. Swipe to move
seven days while preserving the weekday; moving forward clamps to today and cannot pass the current
week. The week has no top arrows or entry dots. A hidden Money screen pauses week settling and
cannot change the entry/history route parameters. Its virtualized pages keep fixed positions as older
history appends; swipes do not trigger a recentering scroll. An uncached week fetch starts only
when paging settles. All seven day ledgers and method counts share one week query; switching
days within it reads cached data immediately.
Only the dynamic ledger region shows skeletons when an uncached week loads. The compact calendar caches `/api/money/summaries`; recording actions stay fixed
above the bottom tabs. Timestamp labels use uppercase AM/PM without a timezone suffix.
Date parsing, business-day/week/month arithmetic, and timestamp formatting use
`@relay/shared/date-utils`, the same implementation as desktop and the Money API. Timezone-less
timestamps follow the desktop IST contract; invalid dates and times are rejected before display.

Amount fields preserve the native decimal-keypad draft while editing so Android keyboard composition
does not fight repeated text rollbacks. Invalid drafts show a field error and disable Save until
corrected. Saving requires digits, at most one decimal point, and up to two fractional digits;
leading decimals such as `.50` retain their typed text and parse as 50 paisa. Pasted separators,
letters, signs, and excess precision are rejected without changing their monetary meaning.

Received places Cash above two equal PhonePe/Paytm compartments. Each whole method row opens
history; adding remains in the fixed Money actions or eligible history's Add entry footer. Large
values and increased text size switch providers to full-width rows. Method, history, and detail
amounts keep complete one-line currency values at 16px or larger, with local horizontal scrolling
when needed. History's Add entry preserves the business date and preselects the actual provider ID
or Cash; saving updates cached Money data from the mutation response and returns to the originating history. Archived or
unsupported methods remain readable without Add entry.

Vendor names use a searchable combobox: the full distinct name list is fetched once, and matching
names are filtered locally below the field. An unmatched name has an Add vendor action. Selecting a result or new name fills the field and closes the list.
New names become reusable after saving the payment. Initial loading uses skeletons; failures
offer Retry without erasing the draft, and Refresh vendors explicitly reloads the catalog.

Vendor rows open `/vendor-details` as a full-screen card route with the shared Back/title
header and complete name, note, amount, and Created at. Received history and vendor details show
Updated at after an edit. Both use the entry's timestamps through shared IST formatting, without a
timezone suffix. Pending deletion blocks
screen Back and route removal until local cache updates and deletion feedback finish.

Received history rows and vendor details expose Edit. The shared entry screen fills in the existing
amount, method/vendor, and note. Save changes patches the original record, preserving its ID, date,
and `createdAt`; `updatedAt` advances on a successful edit. Both timestamps are applied from the
canonical mutation response without extra requests. Historical received entries can keep their original provider while correcting the
amount or note. Method changes are limited to Cash, PhonePe, and Paytm. Unchanged edits cannot save;
failed edits retain the draft and dirty edits ask before discard.

## Money query policy

TanStack Query owns server data through centralized hierarchical keys and query-option factories
in `money.keys.ts` and `money.queries.ts`. Week keys contain their Sunday–Saturday date range;
history keys contain the date and actual method ID (or Cash); vendor names have one catalog key.
Received history uses one `/api/money/received-history?date=&paymentMethod=&beforeId=` request
containing the page, method metadata, total, and next cursor. It does not fetch the whole day or
payment catalog again.

Money queries remain fresh and cached for the authenticated session (`staleTime` and `gcTime`
are `Infinity`). Mount, focus, reconnect, polling, automatic failure retries, and retry-on-mount
are disabled for Money only. Initial cache misses and explicit pagination still fetch. Pull to
refresh reloads the selected week; history, calendar, and vendor search have explicit Refresh
controls. Opening Add entry reuses the week cache. Data changed by another client stays as last
read until the user refreshes. Sign-out clears the query cache.

Successful writes return the affected day and, as appropriate, the created receipt or complete
vendor names. Edit query keys contain the entry type and ID; the selected cached row seeds them so
ordinary Edit needs no GET. Cold edit links can read a user-owned record. PATCH responses also include
the edited record; receipt updates preserve ordering and loaded cursor boundaries when moving methods.
`money.cache.ts` cancels affected in-flight reads and updates only cached data for
that week/date, history, calendar month, and vendor catalog. No invalidation sweep or follow-up
GET is issued. Save locking lasts through that local cache update and navigation; a committed
request is not resubmitted if the later UI update must be retried.

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
tag must match `expo.version`. The `Android Release` workflow runs lint and typecheck,
generates the Android project, builds a signed APK, and creates a GitHub Release with that APK.
Confirm the app version, backend URL, and Google sign-in configuration before tagging; the workflow
does not perform backend or OAuth smoke checks. Re-running publication for an existing release fails
instead of replacing its APK. A native dependency, config, or Expo SDK change still needs a
new APK and app version. The `appVersion` runtime policy keeps OTA updates within that app version.

For JavaScript, styling, or asset changes after installing the `0.0.7` APK, run the
`Android Production OTA Update` GitHub workflow from the commit to publish. The EAS update
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
hex values; desktop remains the OKLCH source of truth. The mobile visual direction is Quick
Ledger: date and week lead the total lid and aligned payment compartments. Recording actions stay
fixed above flat five-tab navigation with a compact soft-terracotta active icon container. Screens use Inter,
restrained 6px/8px radii, borders before shadows, tabular financial numerals, responsive wrapping,
safe areas, and at least 48px touch targets. The dense calendar grid permits 44px-wide cells at a
320px viewport while retaining 48px height; the flat week pager follows the same dense-grid exception.
Money recording actions and history's Add entry keep 48px targets with compact 13px labels and 8px
vertical footer padding. Money's recording buttons use 12px horizontal padding. Received loading
skeletons match the full-width Cash row above the two provider compartments.
Received and vendor entry have a safe-area header, a scrolling form, and a footer containing only the
save action. Screen-level keyboard avoidance uses the measured window origin, keeping the whole
button above the keypad while the form scrolls.
Both screen and system Back ask before discarding a draft and stay locked while saving. Amount
fields focus when the form is ready, show the decimal keypad, and accept only digits and one decimal
point with at most two fractional digits. A decorative ₹ icon sits beside the numeric input, with no
visible label or placeholder; Amount remains its accessible name. Notes use a compact single-line
field. Inputs use native default selection and cursor colors. The native navigator explicitly shows
dark status-bar icons on authenticated light surfaces, and both native and React roots have a light
background. Modal overlays preserve that contrast.

Reanimated drives native motion: subtle content press feedback inside fixed touch targets, short
provider transitions, native week paging, a 260ms calendar slide-in, a shorter 180ms slide-out with a
linked backdrop, and a damped spring return after a canceled drag. Entry, exit, and drag share one
translation; the modal remains mounted until exit completes. Reduced motion and keyboard activation
keep feedback immediate.

Button, card, input, text, icon, and skeleton primitives are adapted from React Native Reusables'
UniWind registry. App wrappers own Relay styling and feature behavior. Initial Money, entry, and
history fetches use skeletons matching their layout, with static placeholders under reduced motion.
Small inline waits use a loader; accessibility labels say only “Loading.”

Mutation feedback belongs to the initiating control. Add, delete, sign-in, and sign-out actions stay
visibly pending and duplicate-safe through the server request, local cache updates, outcome
feedback, and dismissal; sheets and dialogs do not dismiss early. Only completed deletions trigger
haptics. Date/method/vendor selection, received/vendor saves, and sign-out stay silent.

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

## Money regression checks

With Node 24 or newer, run `pnpm test`, `pnpm lint`, and `pnpm typecheck` here. Tests run directly
from `.ts` files through `scripts/register-tests.ts`; `typecheck` checks both the app and the Node
test configuration. The TypeScript
Node tests cover IST boundaries, civil weeks, timestamp formatting, paisa validation, provider ID
resolution, and save locking through local cache updates, feedback, and completion.

Before an Android/iOS release, review 320/360/390/480px widths, the 576px content cap, short
keyboard-visible windows, and 150–200% text size. Verify Gboard/Samsung decimal input and available
Next behavior, Back/discard, safe areas, reduced motion, haptics, rapid saves, loading/offline/retry,
calendar boundaries, paginated history, and TalkBack/VoiceOver selected labels. Web checks do not
validate native IME or touch feedback. Use the existing mobile-dev-build workflow for device review.
