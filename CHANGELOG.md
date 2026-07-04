# Changelog

## v4.3.0 — 04 Jul 2026

**Major release — UI revamp, product images, onboarding, and event-driven sync**

### Features

- Products page — grid & list views, view & edit modes, version history timeline
- Product images — upload and crop images
- Billing page — full redesign, multi-tab support
- Event-driven transaction sync (replaced state-driven autosave)
- Search dropdown — product thumbnails, arrow key navigation, highlight search term
- Sort and filter options in products page and search dropdown
- Settings page — config for PDF export path, txn prefixes, and default customer
- Onboarding flow & store profile management
- Native PDF generation & preset save paths
- Run Hono server in a child process
- Delete and duplicate transactions in billing page

### Improvements

- Split dev & prod build workflows and environments
- One-click installer (removed multiple option prompts)
- Update license to AGPL v3.0 & add database seed script
- Schema — add storeProfile, appPreferences tables & indexes
- Remove redundant logic in search dropdown

### Fixed

- Rebuild better-sqlite3 issues
- Windows installation clash between dev and prod builds
- Multiple app instances bug — restrict to single instance
- Zoom bugs — use web-based zoom (WebContents)
- Zod validation — require unit when weight is provided
- Transaction `updatedAt` field not updating
- Currency conversion parameters (`convertToRupees`, `convertToPaisa`)
- Customer transaction table UI clipping & infinite scroll
- Product snapshot generation format
- Summary footer UI issues

## v4.2.2 — 08 Mar 2026

### Features

- Persistent app zoom controls using `webContents` API
- Enable WAL mode in SQLite
- Build & release debian package

### Improvements

- Electron builder config for dev mode, get sqlite path using `userData`
- Set app name per build mode
- Move unnecessary deps to devDependencies
- Update drizzle config

### Fixed

- Zoom issues, redundant searchDropdown render logic
- `totalRevenue` and `totalTxn` fetched from last page

## v4.2.1 — 03 Mar 2026

- Configure Windows App User Model ID (taskbar grouping & notifications)
- Improve summary footer
- Fix: wrong MRP format in `generateProductSnapshot` params

## v4.2.0 — 03 Mar 2026

### Features

- Global error handler & zod validation middleware
- API client layer — `apiClient` abstraction, env config for Vite
- Customer summary — totals, counts, average amount
- View modal — mark transaction as paid/unpaid
- Redux devtools middleware for all zustand stores
- Backend logger using pino
- Run frontend as standalone mode
- Focus search input on page load

### Improvements

- Migrate all API layers (products, dashboard, billing, customers) to client layer with DRY error handling
- Electron builder overhaul — new config, app logo, scripts & dep upgrades
- Replace Geist font with Inter
- UI — tabs filter, border color, summary footer
- Convert price fields to unit form in product dialog

### Fixed

- Electron build & dependency issues, broken lockfile
- Redux devtools crash
- Close dropdown menu after triggering transaction conversion
- Hono race condition

## v4.1.7 — 25 Feb 2026

- Fix: pass correct MRP format to `generateProductSnapshot`

## v4.1.6 — 05 Feb 2026

- Display `productSnapshot` instead of product name in ViewModal
- Fix: infinite autosave trigger & line items comparison

## v4.1.5 — 04 Feb 2026

- Redirect to dashboard after print

## v4.1.4 — 03 Feb 2026

- Add GSTIN to PDF, fix PDF qty & name → `productSnapshot`
- Fix: `item.name` does not exist on adding new product

## v4.1.3 — 02 Feb 2026

- Add clear button to input & fix overlapping
- Fix: `checkedQty` unit to milli

## v4.1.2 — 02 Feb 2026

- Remove `isNewCustomer` & original `customerId` state
- Fix currency formatting, delete estimate
- Mark txn as paid when converting estimate → sale

## v4.1.1 — 01 Feb 2026

### Improvements

- Migrate quantities to milli-units (`toMilliUnits` / `fromMilliUnits`)
- Schema: change `totalQuantity` from real to integer in sales & estimates
- Refactor currency utils — rename `formatToRupees` → `convertToRupees`, `formatToPaisa` → `convertToPaisa`
- Add currency unit tests
- `updateCheckedQty` utility function

### Fixed

- Invalid datetime when navigated from home page
- Restrict user from entering limited decimals

## v4.1.0 — 29 Jan 2026

**Major release — billing page rewrite, Hono API migration, autosave**

### Features

- Autosave — core flow & state management (replaced drafts approach)
- Migrate all IPC handlers to Hono API routes (sales, estimates, customers, products)
- Standalone Hono server mode
- Billing page — loading skeleton, status indicator, bill preview
- Line items — checkbox, count, +/- buttons, check all/uncheck all
- Total items, total txn quantity, status count display
- Deleted filter in product search
- Integration testing for `updateSale` & sales service
- Create PDF — temporary solution

### Improvements

- Customer endpoints → RESTful resource (`/api/customers/:id/sales`)
- Customer input changed to combobox in billing page
- Billing store & line items store refactored with price/totalPrice inputs
- Search dropdown & searchProduct endpoint refactored
- Schema: `productSnapshot` on products, draft tables removed
- `TransactionType` changed to singular
- React compiler integration

### Fixed

- Product dialog input tags & data types, quantity floating errors, dropdown overlap
- Prevent accidental row deletion on sale update
- Update `product.totalQuantitySold` after item creation/deletion
- Transaction deletion when no items, customer contact empty string error
- Product response & currency format in UI

---

## v3.2.6 — 12 Dec 2025

- Fix: zod schema error in product dialog
- Fix: `setProductId` to null in product dialog

## v3.2.4 — 12 Dec 2025

- Add zod validation for product endpoints
- Migrate products API to locally hosted Hono server
- Fix: zod schema and validation in input forms & controller

## v3.2.3 — 29 Nov 2025

- Fix: update product in billing page

## v3.2.2 — 24 Nov 2025

- Fix: product dialog form state & add/update product endpoints
- Fix: update product history

## v3.2.1 — 10 Nov 2025

- View transaction — check off items
- Add `checked_qty` field to `saleItems` & `estimateItems`
- Batch check/uncheck actions button

## v3.1.8 — 09 Nov 2025

- UI fixes & changes
- Fix: paid & unpaid status

## v3.1.7 — 07 Nov 2025

- Fix: type error in conversion

## v3.1.6 — 07 Nov 2025

- Fix: date reset on new transaction

## v3.1.5 — 06 Nov 2025

- Clear search button, increased font weight
- Fix: history entry on no data change & init history entry
- Fix: weight validation to null string instead of null

## v3.1.4 — 04 Nov 2025

- Fix: print margins in bill preview

## v3.1.3 — 04 Nov 2025

- Fix: print bottom margin

## v3.1.2 — 03 Nov 2025

- Fix: prevent store reset race condition on navigation

## v3.1.1 — 03 Nov 2025

- Fix: invalid datetime in billing component
- Fix: receipt save as PDF

## v3.1.0 — 02 Nov 2025

### Features

- Dashboard home page — metrics, chart, recent transactions, top products pie chart
- Chart component metrics API endpoints

### Improvements

- Migrate customer transactions table to feature-rich table

### Fixed

- Convert rupees to paisa in save sale & estimate
- `transaction_type` typo in `deleteMutation`

## v3.0.1 — 25 Oct 2025

### Features

- Product filter type (all | active | inactive)
- Loading states across pages

### Improvements

- Products page virtualization & UI fixes
- Billing page search dropdown event handlers

### Fixed

- DB migrations & schema
- Default datetime from UTC to ISO string format & date range query
- Hardcoded styles → CSS variables

## v3.0.0 — 23 Oct 2025

**Major release — React Query migration, React Router v6, UI overhaul**

### Features

- Migrate all APIs to React Query
- Migrate to React Router v6 with folder-per-page structure
- Infinite scroll with virtualization using `@tanstack/virtual`
- `@tanstack/react-query` in customers page with loading & error handling
- Product version history logic
- Products total quantity sold count
- Not found page

### Improvements

- Rename `invoiceNo` → `transactionNo` in billing store & components
- Dashboard table — UI, actions, mutations, scroll fix
- Customers page — loading states, refactored UI
- Sidebar UI update, Geist font, new color scheme

### Fixed

- Dashboard table re-rendering

---

## v2.3.3 — 29 Sep 2025

### Features

- Sorting sales/estimates & refactor `filterByDateRange` API
- New calendar component in dashboard table with date range presets

### Improvements

- Dashboard UI refresh

### Fixed

- Multiple fetch API calls in dashboard page
- Prevent deletion of `sale_items` / `estimate_items` tables in migration
- Delete product endpoint

## v2.3.2 — 20 Sep 2025

- Customer input validation
- Remove customer name & contact from sales/estimates — use unique field reference
- Schema: add `getCustomerByName` API handler
- Fix: customer change & update while billing
- Fix: hydration error in dashboard table and customer header

## v2.3.1 — 18 Sep 2025

- Eslint fix
- Fix: copy to clipboard

## v2.3.0 — 18 Sep 2025

### Features

- Generate PDF for sales & estimates, copy to clipboard
- Zod validation for product dialog
- Custom infinite scroll hook for products page
- Global constants & enums

### Improvements

- Restructure IPC handlers & modularize frontend

### Fixed

- `TransactionType` inconsistency — major fix & build script update
- Overflow scroll in customers page
- Early function call `clearTransactionState` before printing

## v2.2.5 — 10 Sep 2025

### Features

- Change date and time in billing
- Sidebar access in billing page & billing header UI refactor
- Summary footer component
- Custom hook for save & print

### Improvements

- Fix all date conversions & update transactions API
- Remove static font files

### Fixed

- Unnecessary rendering in `LineItemRows`
- Clear transaction state on save and route change
- Custom name items not saving in sale/estimate
- Save & print by sharing receipt ref
- MRP input zero bug in product dialog

## v2.2.4 — 04 Sep 2025

- Convert estimate ↔ sale
- Add purchase price field for products
- Fetch sales/estimates in desc order
- Schema: invoice no & estimate no set to unique

## v2.2.3 — 01 Sep 2025

- Fix: view button in customers page

## v2.2.2 — 01 Sep 2025

**Major release — customers, sales dashboard, estimates**

### Features

- Customers page — sidebar, details UI, CRUD APIs, search, delete logic
- Customer selection in billing page with backend logic
- Transactions per customer view
- Google contacts import (fetch & insert to DB)
- Sales dashboard with date filter API
- Estimates dashboard
- Delete & view sales
- `useTransactionState` hook
- Folder structure reorganization, added `react-hot-toast`
- CI/CD — build for both Windows & Ubuntu
- Auto-update feature

### Fixed

- Print issues (iframe removal, auto cut, 20-item limit, estimate no display)
- Transaction not saving
- Accessing env variables in production
- Preserve qty after selecting new item

## v2.1.2–v2.1.9 — 26–27 Aug 2025

_Build & release pipeline iterations — package.json, build.yml, auto-updater setup_

## v2.1.1 — 26 Aug 2025

- Fix: edit button not working in estimates page
- Fix: zoom screen width

## v2.1.0 — 26 Aug 2025

- Update products directly in billing page
- Weight + unit + MRP displayed next to product name with search logic
- Fix: force reset zoom
- Fix: remove placeholder in product dialog & fix UI not reflecting after update

## v2.0.1 — 26 Aug 2025

- Add electron-updater

## v2.0.0 — 25 Aug 2025

**Major release — products management**

### Features

- Products page UI & search
- Add, update, delete products
- Prevent multiple app instances
- Disable ctrl+/ctrl- zoom shortcuts
- Revamp search dropdown UI

### Improvements

- Add weight & MRP tag on product card
- Utils for MRP and price formatting
- Schema: `isPaid` to notNull, SQL expression for `updatedAt`

### Fixed

- `createdAt`/`updatedAt` null errors, `value.getTime` error
- `invoiceNo` / `estimateNo` mismatch while editing
- Update `totalQuantity` of sale/estimate
- Zoom factor on lower resolution devices
- Use paisa in backend & rupees in frontend

---

## v1.0.0 — 23 Aug 2025

**Initial release**

- Electron + React + Vite project scaffold
- Tailwind CSS, shadcn/ui, Inter font
- Drizzle ORM — schema, migrations, seed (CSV import)
- SQLite database with sales, estimates, and items tables
- Sidebar layout with HashRouter page routing
- Billing page — line item table, zustand store with CRUD
- Product search — dropdown, debounced API, infinite scroll
- Quantity presets popover, auto-update amount on price/qty change
- Save sale & estimate APIs with standardized types
- Sales & estimates pages
- Print feature using `react-to-print`
- Zoom factor fix (disable auto scaling)
- GitHub Actions CI/CD workflows
