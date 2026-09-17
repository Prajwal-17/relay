# Relay Mobile

Relay Mobile is an offline-first Expo companion focused on the shop's daily Money workflow.
Money opens first. Home, Products, and Customers are intentionally limited to a clear “Coming
soon” state until those workflows are ready.

## Stack

- Expo SDK 57 with Expo Router
- React Native 0.86 and React 19.2
- UniWind with Tailwind CSS 4
- Drizzle ORM with Expo SQLite
- Local Inter font files and Lucide icons

## Money workflow

The Money screen keeps the current daily-ledger features: choose a date, review received and paid
totals, record cash and online receipts, add vendor payments, inspect receipt history, manage online
payment channels, correct daily totals, and delete a day's record.

All values are stored as integer paisa. Dates use the Asia/Kolkata business day. The app owns one
local `relay-money.db` database and does not import or copy desktop data. Its schema contains only:

- `daily_entries`
- `online_channels`
- `daily_online_receipts`
- `supplier_payments`
- `receipt_events`

## Design

`global.css` maps the semantic colors from the desktop `DESIGN.md` into Tailwind 4 tokens: warm
canvas, white surfaces, charcoal actions, neutral selection, and terracotta focus cues. Screens use
Inter, restrained 6px/8px radii, borders before shadows, tabular money, and at least 44px touch
targets.

## Development

From the repository root:

```bash
pnpm install
pnpm --dir apps/mobile start
```

Useful checks:

```bash
pnpm --dir apps/mobile lint
pnpm --dir apps/mobile typecheck
pnpm --dir apps/mobile exec expo-doctor
```

Android and iOS are the primary targets. The web command remains available for quick layout checks:

```bash
pnpm --dir apps/mobile web
```
