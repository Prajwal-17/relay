# Money ledger: request and cache implementation plan

This updates the Quick Ledger plan from worktree `t3code-2c7206a9` for the implemented
mobile screens. Existing visual, numeric-input, keyboard, accessibility, and deletion contracts
in `DESIGN.md` remain authoritative. Do not build, deploy, or migrate production data.

## Data and cache contract

- Fetch one Sunday–Saturday week with explicit `startDate` and `endDate` filters. Return all
  seven daily ledgers, grouped receipt counts, and the user-owned payment catalog. Use range
  queries rather than seven independent day queries. Allow the current week's future empty
  slots in the read range; recording still rejects future dates.
- Key week data by its range, independently of the selected day. Money and entry forms share
  the same query options. Selecting another cached day or opening Add entry performs no GET.
- Fetch received history with one date/method-filtered, cursor-paginated request containing
  entries, method metadata, and its total. Preserve legacy read endpoints for older clients.
- Fetch all distinct vendor names once and filter in the combobox locally. Do not request per
  keystroke or restrict the catalog to six names. Names still come from saved payments.
- Money query options use `staleTime: Infinity`, retain their cache for the authenticated
  session, and disable mount, focus, reconnect, polling, and automatic failure retries.
  Initial cache misses and explicit pagination still fetch. Sign-out clears the cache.
- Refresh only when the user pulls to refresh or presses Retry/Refresh. Refreshing Money
  fetches only the selected week. History, calendar, and vendor search expose their own refresh.
- Successful writes return canonical affected-day data (plus the created receipt or updated
  vendor names as appropriate). Patch existing week, history, and calendar caches directly;
  do not invalidate all Money queries or issue synchronization GETs. Retain save locking and
  duplicate protection through the local cache update and navigation.
- Skeletons belong only to uncached dynamic data. Keep the month/week bar mounted and stable;
  never display another week's data as a placeholder. Pause week settling while Money is hidden
  so it cannot change the active entry route parameters. No adjacent-week prefetch or auto-sync.

## Editing entries

- Add Edit to each received-history row and vendor payment details. Reuse the full-screen entry
  form with existing numeric amount, method/vendor, and note filled in. Save changes uses PATCH,
  preserves the entry ID/date/`createdAt`, advances `updatedAt`, and returns both with canonical
  day and edited-record data.
- Received history and vendor details show Created at and, after an edit, Updated at. Use actual
  entry timestamps instead of daily-ledger timestamps; omit separate Recorded/Business date rows.
- Store required UTC ISO `createdAt`/`updatedAt` on both payment tables. Backfill existing
  `updated_at` from `created_at` through `0001_money_ledger.sql`, preserving all data and IDs.
  Verify and apply the local migration; no production migration is part of this work.
- Reuse `@relay/shared/date-utils` across desktop, mobile, and the Money API. Keep ledger calendar
  dates separate from timestamps, use UTC calendar arithmetic and IST timestamp display, and
  reject impossible dates/times. Timezone-less timestamps follow the desktop IST parsing contract.
- Seed the date/type/ID edit query from the selected cached row. Ordinary Edit opens without a GET;
  a cold edit link reads the user-owned record. Query behavior remains manual-refresh only.
- Apply updated totals/counts, vendor names, record details and received history directly from the
  PATCH response. Method changes move the receipt into its loaded cursor interval, preserving
  order and pagination boundaries. No synchronization requests after editing.
- Historical received entries can be corrected while preserving their original method. Changing
  the method is restricted to Cash, PhonePe, or Paytm. Retain discard and pending-navigation guards.

## Work and verification

1. Add validated week/history reads and mutation response data to the Hono/D1 feature.
2. Centralize TanStack Query keys/options and mutation cache updates; adopt them on Money,
   history, entry, calendar, and vendor combobox screens.
3. Verify user isolation, date boundaries, pagination, totals/counts, vendor deduplication,
   cache reuse, manual refresh, and successful save/edit/delete cache updates with focused tests.
4. Run mobile lint/typecheck/tests and server typecheck/tests; check browser request counts
   and relevant flows when available. Update mobile/server README and `DESIGN.md`.

No app build, release, production migration, or deployment is part of this work.
