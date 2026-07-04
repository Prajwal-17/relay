# Linear Light Migration — Midnight Navy Theme

Complete migration guide for QuickCart from the current amber/saffron design system to a **Linear-inspired light mode** with **Midnight Navy** accent and sidebar, tuned for a 1366×768 grocery billing workstation.

---

## Table of Contents

1. [Overview & Rationale](#1-overview--rationale)
2. [Token Architecture — Complete `:root` Spec](#2-token-architecture--complete-root-spec)
3. [Color Segregation by Use Case](#3-color-segregation-by-use-case)
4. [Products Page — Weight+Unit vs MRP Visual Differentiation](#4-products-page--weightunit-vs-mrp-visual-differentiation)
5. [Minimal Motion with React Motion](#5-minimal-motion-with-react-motion)
6. [Component Inventory (Reference)](#6-component-inventory-reference)
7. [Phase-Wise Migration Plan](#7-phase-wise-migration-plan)
8. [Component-Specific Manual Edits](#8-component-specific-manual-edits)
9. [Verification Checklist](#9-verification-checklist)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Overview & Rationale

### Why Midnight Navy

| Property                                           | Rationale                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Midnight Navy primary (`oklch(28% 0.04 264)`)      | Authoritative, bank-grade, professional — conveys trust for a billing app without being loud         |
| Dark navy sidebar (`oklch(20% 0.025 264)`)         | Visually anchors the workspace — dark enough to recede, navy enough to feel cohesive with the brand  |
| Warm canvas (`oklch(0.98 0.002 260)`)              | Reduces eye fatigue under fluorescent shop lighting                                                  |
| White cards (`oklch(1 0 0)`)                       | Crisp content surfaces that pop against the warm canvas                                              |
| Single accent, muted palette                       | The operator's attention goes to prices and status, not chrome color                                 |
| Dense, information-rich layout                     | Billing needs to show many line items at once on 768px vertical                                      |

### What Changes

| Layer          | Before                                         | After                                                          |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| Primary accent | Amber (`oklch(87.67% 0.165 90.15)`)            | Midnight Navy (`oklch(28% 0.04 264)`)                          |
| Canvas         | Cool off-white (`oklch(0.9942 0.0034 247.86)`) | Warm off-white (`oklch(0.98 0.002 260)`)                       |
| Cards          | Pure white (same as canvas-ish)                | Pure white on warm canvas (visible hierarchy)                  |
| Sidebar        | Light gray (`oklch(95.46% 0.004 264.37)`)      | **Dark navy** (`oklch(20% 0.025 264)`) with light text |
| Borders        | `oklch(82% 0.006 286.286)`                     | Hairline ladder (`oklch(0.86 0.006 260)` etc.)                 |
| Text           | `oklch(0.2795 0.0368 260.031)`                 | `oklch(0.18 0.035 260)` (deeper ink)                           |
| Font weight    | 425                                            | 500 (better readability on 100 PPI TN panel)                   |
| Charts         | Hardcoded hexes, old amber mappings            | Muted tertiary palette, midnight-navy-anchored                 |
| Products page  | Weight & MRP badges visually identical         | Clear typographic+shape distinction                            |
| Dark mode      | Removed                                        | Stays removed                                                  |

---

## 2. Token Architecture — Complete `:root` Spec

Replace the entire `:root { ... }` block in `apps/desktop/src/renderer/src/index.css` with the following. The `@theme inline` block requires **no changes** — variable names remain identical.

```css
:root {
  --font-sans: "InterVariable", system-ui, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-roboto: "InterVariable", system-ui, sans-serif;

  /* ── Surface Ladder ── */
  --canvas: oklch(0.98 0.002 260); /* warm off-white page background */
  --surface-1: oklch(1 0 0); /* cards, content panels — pure white */
  --surface-2: oklch(0.945 0.005 260); /* elevated cards, hover rows, selected nav */
  --surface-3: oklch(0.89 0.006 260); /* sub-nav, dropdowns */
  --surface-4: oklch(0.83 0.006 260); /* deepest elevated surface */

  /* ── Hairline Borders ── */
  --hairline: oklch(0.86 0.006 260); /* default card/divider borders */
  --hairline-strong: oklch(0.75 0.008 260); /* input outlines, selected card borders */
  --hairline-tertiary: oklch(0.93 0.003 260); /* nested surface borders */

  /* ── Text ── */
  --ink: oklch(0.18 0.035 260); /* headlines, body text — deep charcoal */
  --ink-muted: oklch(0.38 0.025 260); /* secondary text, meta, timestamps */
  --ink-subtle: oklch(0.5 0.02 260); /* placeholder, disabled, deselected */
  --ink-tertiary: oklch(0.63 0.02 260); /* disabled controls, decorative */

  /* ── Brand & Accent (Midnight Navy) ── */
  --primary: oklch(28% 0.04 264); /* midnight navy — CTAs, focus, links, brand */
  --primary-hover: oklch(20% 0.04 264); /* darker navy — hovered CTAs */
  --primary-focus: oklch(28% 0.04 264 / 0.5); /* focus ring tint */
  --on-primary: #ffffff; /* text on primary background */

  /* ── Midnight Navy Sidebar ── */
  --sidebar: oklch(20% 0.025 264);       /* dark navy sidebar — distinct from canvas */
  --sidebar-foreground: oklch(0.88 0.01 264);          /* light text on sidebar */
  --sidebar-primary: var(--primary);                    /* sidebar active indicator */
  --sidebar-primary-foreground: var(--on-primary);
  --sidebar-accent: oklch(28% 0.04 264 / 0.25);       /* sidebar hover/selected bg */
  --sidebar-accent-foreground: oklch(0.95 0.005 264);  /* sidebar hover text */

  /* ── Semantic States ── */
  --success: #27a644;
  --success-foreground: #ffffff;
  --warning: oklch(70% 0.14 75);
  --warning-foreground: oklch(0.18 0.035 260);
  --destructive: #d32f2f;
  --destructive-foreground: #ffffff;
  --info: #1565c0;
  --info-foreground: #ffffff;

  /* ── Charts & Data Visualization ──
     Linear-inspired muted palette: one accent + subdued tertiaries.
     No neon, no high saturation — the data speaks, not the colors. */
  --chart-1: oklch(46% 0.15 264); /* midnight navy (primary range) */
  --chart-2: oklch(48% 0.06 180); /* muted teal */
  --chart-3: oklch(45% 0.04 220); /* slate blue-gray */
  --chart-4: oklch(48% 0.05 155); /* muted sage green */
  --chart-5: oklch(50% 0.05 45); /* muted warm amber */
  /* Extra chart colors for multi-series: */
  --chart-6: oklch(42% 0.03 255); /* deep steel */
  --chart-7: oklch(50% 0.04 105); /* muted olive */
  --chart-8: oklch(47% 0.03 10); /* muted rose */

  /* ── Semantic Token Mapping (backward compat — all existing classes use these names) ── */
  --background: var(--canvas);
  --background-secondary: var(--surface-1);
  --foreground: var(--ink);

  --card: var(--surface-1);
  --card-foreground: var(--ink);

  --popover: var(--surface-1);
  --popover-foreground: var(--ink);

  --primary-foreground: var(--on-primary);

  --secondary: var(--surface-2);
  --secondary-foreground: var(--ink);

  --accent: var(--surface-2);
  --accent-foreground: var(--ink-muted);

  --muted: var(--surface-1);
  --muted-foreground: var(--ink-muted);

  --border: var(--hairline);
  --borderprimary: var(--primary);
  --input: var(--hairline-strong);

  --ring: var(--primary-focus);

  /* ── Onboarding (dark rail — intentionally dark) ── */
  --onboarding-gradient-start: oklch(25% 0.04 264);
  --onboarding-gradient-mid: oklch(18% 0.03 264);
  --onboarding-gradient-end: oklch(12% 0.02 255);
  --onboarding-text-muted: oklch(70% 0.01 264);
  --onboarding-text-footer: oklch(45% 0.01 264);
  --onboarding-icon-bg: oklch(28% 0.04 264 / 0.15);
  --onboarding-feature-text: oklch(80% 0.01 264);
  --onboarding-icon-dark: oklch(46% 0.15 264);

  /* ── Product Dialog ── */
  --product-label: var(--ink-muted);
  --product-value: var(--ink);
  --product-surface: var(--surface-1);
  --product-surface-hover: var(--surface-2);
  --product-divider: var(--hairline);
  --product-badge-bg: oklch(28% 0.04 264 / 0.08);
  --product-badge-text: oklch(28% 0.04 264);

  /* ── Search Dropdown ── */
  --search-highlight: oklch(28% 0.04 264 / 0.15);
  --search-icon-bg-from: var(--surface-1);
  --search-icon-bg-to: var(--surface-2);
  --search-icon-fg: var(--primary);
  --search-badge-weight-border: var(--hairline);
  --search-badge-weight-bg: var(--surface-2);
  --search-badge-weight-text: var(--ink-muted);
  --search-badge-mrp-border: oklch(28% 0.04 264 / 0.3);
  --search-badge-mrp-bg: oklch(28% 0.04 264 / 0.08);
  --search-badge-mrp-text: var(--primary);

  /* ── Invoice Template (PDF/print) ── */
  --invoice-bg: var(--surface-1);
  --invoice-text: var(--ink);
  --invoice-text-muted: var(--ink-muted);
  --invoice-accent: var(--primary);
  --invoice-border: var(--hairline);
  --invoice-table-header-bg: var(--surface-2);

  /* ── Shadows ── */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 16px 40px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.05);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.12);

  --radius: 0.5rem;
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}
```

### `@layer base` Body Addition

Add `font-weight: 500` and `font-size: 14px` to the body rule for 100 PPI readability:

```css
body {
  @apply bg-background text-foreground;
  font-weight: 500;
  font-size: 14px;
}
```

### Files That Require NO Changes

- `@theme inline` block — variable names unchanged, only values swapped
- `@font-face` block — InterVariable already loaded
- `@layer base` scrollbar rules — reference `var(--muted)` / `var(--border)` which auto-swap
- All Shadcn-generated `components/ui/*` — auto-adapt via token references

### Files That MUST NOT Be Changed

| File                                         | Reason                                         |
| -------------------------------------------- | ---------------------------------------------- |
| `pages/export/pdf/PdfInvoicePage.tsx`        | Thermal print formatting, own dimensions       |
| `features/productDialog/productImageCrop.ts` | `#ffffff` is a JS Canvas API constant, not CSS |
| `DemoReceipts.tsx`                           | Print demo, thermal formatting                 |

---

## 3. Color Segregation by Use Case

### 3.1 Charts & Data Visualization

Linear-style charts use a muted, restrained palette. The primary data series is midnight navy; secondary series are subdued tertiary tones. No neon, no high saturation.

| Token       | Value                 | Chart Use                                         |
| ----------- | --------------------- | ------------------------------------------------- |
| `--chart-1` | `oklch(46% 0.15 264)` | Primary data series (sales, revenue, main metric) |
| `--chart-2` | `oklch(48% 0.06 180)` | Secondary series (estimates, comparison data)     |
| `--chart-3` | `oklch(45% 0.04 220)` | Tertiary series (expenses, costs)                 |
| `--chart-4` | `oklch(48% 0.05 155)` | Quaternary series (profit, growth)                |
| `--chart-5` | `oklch(50% 0.05 45)`  | Quinary series (projections, forecasts)           |
| `--chart-6` | `oklch(42% 0.03 255)` | Extra series (deep steel)                         |
| `--chart-7` | `oklch(50% 0.04 105)` | Extra series (muted olive)                        |
| `--chart-8` | `oklch(47% 0.03 10)`  | Extra series (muted rose)                         |

#### Bar Graph Specifics

- **Sales bars**: `--chart-1` (midnight navy)
- **Estimate bars**: `--chart-2` (muted teal)
- **Profit bars**: `--chart-4` (muted sage)
- **Grid lines**: `var(--hairline)` at 50% opacity
- **Axis text**: `var(--ink-muted)`
- **Hover state**: lighter tint of the bar's color

#### Pie/Donut Specifics (Top Products)

- Slice 0: `--chart-1`
- Slice 1: `--chart-2`
- Slice 2: `--chart-3`
- Slice 3+: cycle through `--chart-4`, `--chart-5`, `--chart-6`, `--chart-7`, `--chart-8`
- All slices use 92% fill opacity — none at full saturation

#### Hardcoded Chart Color Fixes Required

- `features/dashboard/TopProductsChart.tsx:15-16` — two hardcoded `hsl()` values → replace with `var(--chart-4)` and `var(--chart-5)` references

### 3.2 Semantic States (Billing Save Status, Status Pills)

These colors appear on save-status indicators, row-check status, and status pills across all pages.

| State               | Background          | Text/Border                              | Use                       |
| ------------------- | ------------------- | ---------------------------------------- | ------------------------- |
| Synced (success)    | `bg-success/15`     | `text-success border-success/25`         | Saved, completed, paid    |
| Saving (info)       | `bg-info/15`        | `text-info border-info/25`               | Processing, uploading     |
| Unsaved (warning)   | `bg-warning/15`     | `text-warning border-warning/30`         | Pending, attention needed |
| Error (destructive) | `bg-destructive/10` | `text-destructive border-destructive/25` | Failed, deleted, void     |

### 3.3 Search Dropdown

Product search results in the billing screen dropdown:

| Element                | Token                                            | Visual Role                            |
| ---------------------- | ------------------------------------------------ | -------------------------------------- |
| Product name highlight | `--search-highlight`                             | Highlight matching query text          |
| Icon container bg      | `--search-icon-bg-from` to `--search-icon-bg-to` | Product thumbnail placeholder gradient |
| Icon fg                | `--search-icon-fg` (primary)                     | Product icon color                     |
| Weight badge border    | `--search-badge-weight-border` (hairline)        | Neutral, recedes                       |
| Weight badge bg        | `--search-badge-weight-bg` (surface-2)           | Muted background                       |
| Weight badge text      | `--search-badge-weight-text` (ink-muted)         | Secondary information                  |
| MRP badge border       | `--search-badge-mrp-border` (primary/30)         | Accent-weighted                        |
| MRP badge bg           | `--search-badge-mrp-bg` (primary/08)             | Light accent tint                      |
| MRP badge text         | `--search-badge-mrp-text` (primary)              | Stands out — price is key              |

### 3.4 Product Dialog

| Token                     | Visual Role                            |
| ------------------------- | -------------------------------------- |
| `--product-label`         | Field labels ("Price", "MRP", "Stock") |
| `--product-value`         | Field values (actual numbers)          |
| `--product-surface`       | Section background                     |
| `--product-surface-hover` | Section hover state                    |
| `--product-divider`       | Section separator                      |
| `--product-badge-bg`      | Transaction type badge (sale/estimate) |
| `--product-badge-text`    | Badge label text                       |

### 3.5 Invoice / PDF

Self-contained for PDF generation. Mapped to surface/text tokens so they auto-swap.

### 3.6 Onboarding

The onboarding flow uses a dark rail (intentionally dark regardless of main theme). Midnight navy's cooler hue (`264`) aligns well — the gradient uses navy-leaning blues that complement the primary accent.

---

## 4. Products Page — Weight+Unit vs MRP Visual Differentiation

### Problem

Currently in `ProductListItem.tsx` (lines 83–99) and `SearchDropdown.tsx` (lines 477–492), both weight+unit and MRP badges use identical visual treatment:

- Both are `Badge variant="outline"` with `rounded-full px-2.5 py-0.5 text-base font-semibold shadow-sm`
- Weight uses `border-border bg-muted text-muted-foreground`
- MRP uses `border-warning/30 bg-warning/10 text-warning`
- At a glance on a 100 PPI TN panel, they blur into each other

### Design Goal

A shop operator scanning the product list must instantly distinguish:

- **"What size is this?"** (weight+unit — quantity information, secondary)
- **"What's the printed retail price?"** (MRP — price information, important)

### Solution: Shape + Color + Position Differentiation

**Weight+Unit badge** — compact, rectangular, neutral, recedes visually:

```tsx
<Badge
  variant="outline"
  className="border-hairline/60 bg-surface-2/50 text-ink-muted rounded-md px-2 py-0 text-xs font-medium tracking-normal"
>
  {product.weight}
  {product.unit}
</Badge>
```

- **Shape**: `rounded-md` (4px) — compact rectangle, distinct from pills
- **Color**: `bg-surface-2/50 border-hairline/60 text-ink-muted` — almost invisible, doesn't compete
- **Size**: `px-2 py-0 text-xs` — smallest badge, acknowledges secondary importance
- **Font**: `font-medium` — not bold, doesn't demand attention

**MRP badge** — pill, accent-tinted, stands out:

```tsx
<Badge
  variant="outline"
  className="border-primary/30 bg-primary/8 text-primary rounded-full px-2.5 py-0.5 text-sm font-semibold tracking-normal"
>
  MRP ₹{paisaToRupeeString(product.mrp)}
</Badge>
```

- **Shape**: `rounded-full` — pill, clearly different from weight rectangle
- **Color**: `bg-primary/8 border-primary/30 text-primary` — midnight navy accent, visible but tasteful
- **Size**: `px-2.5 py-0.5 text-sm` — slightly larger than weight badge
- **Font**: `font-semibold` — commands attention for price scanning

### Visual Scan Pattern (Left to Right)

```
[Thumbnail]  Amul Gold Milk 1L  ▣ 500ml  ● MRP ₹32   ₹28.00  [Actions]
              ↑ product name    ↑ weight    ↑ MRP        ↑ selling price
              bold, large       rect, gray  pill,navy    bold, largest
```

The weight is a compact gray rectangle that the eye skips; the MRP is a navy pill that catches the eye. The selling price (rightmost, largest) remains the dominant number.

### Affected Files

| File                                    | Lines   | Change                                                           |
| --------------------------------------- | ------- | ---------------------------------------------------------------- |
| `features/products/ProductListItem.tsx` | 84–91   | Apply weight-badge classes above                                 |
| `features/products/ProductListItem.tsx` | 93–99   | Apply MRP-badge classes above (replace `warning` with `primary`) |
| `features/search/SearchDropdown.tsx`    | 477–492 | Apply weight-badge classes above                                 |
| `features/search/SearchDropdown.tsx`    | 487–492 | Apply MRP-badge classes above (replace `warning` with `primary`) |

### Search Dropdown Token Updates

Update the `--search-badge-mrp-*` tokens in `:root` to use primary (midnight navy) instead of warning amber:

- `--search-badge-mrp-border`: `oklch(28% 0.04 264 / 0.3)` → midnight navy at 30%
- `--search-badge-mrp-bg`: `oklch(28% 0.04 264 / 0.08)` → midnight navy at 8%
- `--search-badge-mrp-text`: `var(--primary)` → midnight navy

---

## 5. Minimal Motion with React Motion

Motion is already imported in several components (`motion/react`). These additions are subtle — a billing workstation should never feel distracting.

### 5.1 LineItemRow — Entry & Exit

When a new line item is added or removed in billing:

```tsx
import { motion, AnimatePresence } from "motion/react";

// Inside LineItemsTable, wrap each row:
<AnimatePresence mode="popLayout">
  {lineItems.map((item) => (
    <motion.div
      key={item.rowId}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <LineItemRow ... />
    </motion.div>
  ))}
</AnimatePresence>
```

- **Duration**: 150ms — fast enough to feel instant, slow enough to register
- **Animates**: opacity + height (layout-aware)
- **No scale/rotation**: these would be distracting in a data table

### 5.2 Sidebar Nav Items — Hover Lift

Subtle hover feedback on navigation items:

```tsx
<motion.div whileHover={{ x: 2 }} transition={{ duration: 0.12, ease: "easeOut" }}>
  {/* nav item content */}
</motion.div>
```

- **Translates**: 2px right — micro lift, barely perceptible
- **Duration**: 120ms — snappy

### 5.3 Billing Save Status — Pulse When Saving

When the sync status is "SAVING", a gentle opacity pulse:

```tsx
<motion.div
  animate={status === "SAVING" ? { opacity: [1, 0.65, 1] } : { opacity: 1 }}
  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
>
  {/* save status indicator */}
</motion.div>
```

- **Pulse**: soft 1.2s cycle — visible but not urgent
- **Stops**: when status becomes SYNCED or IS_DIRTY

### 5.4 Tab Content — Fade Transition

When switching between billing tabs (Sale / Estimate) or settings sub-pages:

```tsx
<motion.div
  key={activeTabId}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.12, ease: "easeOut" }}
>
  {/* tab content */}
</motion.div>
```

- **Duration**: 120ms — near-instant
- **No translation**: tab content stays in place, just fades in

### 5.5 Dashboard Metric Cards — Hover Scale

Cards in the dashboard metrics section gain a subtle pressable feel:

```tsx
<motion.div
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.99 }}
  transition={{ duration: 0.12, ease: "easeOut" }}
>
  <MetricCard ... />
</motion.div>
```

- **Scale**: 1% hover, 1% press — almost imperceptible but adds tactility

### 5.6 Product List Items — Staggered Fade-In

When the product list loads, items fade in with a stagger:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2, delay: index * 0.02 }}
>
  <ProductListItem ... />
</motion.div>
```

- **Stagger**: 20ms per item — creates a subtle cascade
- **Only on initial load**: not on filter/sort changes (would be distracting)

### Motion Rules

| Do                                       | Don't                            |
| ---------------------------------------- | -------------------------------- |
| 150ms max duration for layout animations | Anything over 300ms              |
| Opacity + height/width only              | Rotation, bounce, spring effects |
| `easeOut` easing                         | `easeInOut` or elastic curves    |
| Stagger only on initial page load        | Stagger on every filter change   |
| Respect `prefers-reduced-motion: reduce` | Ignore accessibility preferences |

---

## 6. Component Inventory (Reference)

### Page Routes (`pages/`)

| File                            | Complexity   | Key Concern                              |
| ------------------------------- | ------------ | ---------------------------------------- |
| `home/HomePage.tsx`             | Low          | Token-driven, verify only                |
| `products/ProductsPage.tsx`     | Medium       | Product list + search/filter             |
| `customers/CustomersPage.tsx`   | Medium       | Customer table + sidebar                 |
| `billing/BillingPage.tsx`       | High         | Debounced sync, tabs, overlay sidebar    |
| `dashboard/DashboardPage.tsx`   | Medium       | Route param validation → `Dashboard.tsx` |
| `reports/ReportsPage.tsx`       | Low          | Token-driven                             |
| `settings/SettingsPage.tsx`     | Medium       | Nested sub-routes                        |
| `export/pdf/PdfInvoicePage.tsx` | Do Not Touch | Thermal print formatting                 |
| `NotFoundPage.tsx`              | Low          | Gradient text uses tokens                |

### Feature Components (`features/`)

| Feature                 | Files                  | Concerns                                                |
| ----------------------- | ---------------------- | ------------------------------------------------------- |
| `billing/`              | 11 files + `tabs/` (2) | Line items table, sync status, tabs, save-status        |
| `products/`             | 3 files                | Product list header, list items, results                |
| `productDialog/`        | 8 files                | Edit form, view mode, image crop, history, transactions |
| `customers/`            | 8 files                | Table, rows, sidebar, details, dialog                   |
| `dashboard/`            | 9 files                | Metrics, charts, transactions, modals                   |
| `transactionDashboard/` | 4 files                | Dashboard table, rows, cards, date picker               |
| `onboarding/`           | 3 + `steps/` (4)       | Dark rail flow, stepper, completion screen              |
| `search/`               | 2 files                | Global search dropdown                                  |
| `settings/`             | 3 files                | Settings sections, field row, nav config                |

### Layout Components (`components/`)

| File                     | Role                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `Sidebar.tsx`            | Resizable nav sidebar — docked (default) or overlay (billing) |
| `layouts/AppShell.tsx`   | Main shell — sidebar + header + `<Outlet />`                  |
| `layouts/RootLayout.tsx` | Bootstrap/onboarding gate                                     |
| `highlighted-text.tsx`   | Search query substring highlighter                            |

---

## 7. Phase-Wise Migration Plan

> **Golden rule:** ~95% of components need **zero className changes**. After the CSS variable swap, walk each phase and visually verify, then patch only the flagged items.

### Phase 0 — CSS Foundation Swap

**Files:** `apps/desktop/src/renderer/src/index.css`

1. Replace the entire `:root { ... }` block with the spec in §2 (lines 12–118 → new block).
2. Add `font-weight: 500; font-size: 14px;` to the `body` rule in `@layer base`.
3. Remove the `.linear-light` scope block entirely (lines 120–284) — its values are now in `:root`.
4. `@theme inline` and `@font-face` blocks: **zero changes**.

**Verify:** Reload app. Warm canvas, midnight navy primary, dark navy sidebar, weight-500 body text.

### Phase 1 — App Shell

**Files:** `components/layouts/RootLayout.tsx`, `components/layouts/AppShell.tsx`, `components/Sidebar.tsx`

| File           | Line | Current                                   | Change                                                                        |
| -------------- | ---- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `AppShell.tsx` | 68   | `bg-background/95`                        | (stays) — auto-swaps to warm canvas at 95%                                    |
| `AppShell.tsx` | 96   | `bg-muted/40`                             | → `bg-muted/60` (search bar needs more contrast against warm canvas)          |
| `Sidebar.tsx`  | 198  | `bg-sidebar text-sidebar-foreground`      | (stays) — auto-swaps to dark navy sidebar                                     |
| `Sidebar.tsx`  | 198  | `border-r-black/8`                        | → `border-r-border/15` (use token, not raw black)                             |
| `Sidebar.tsx`  | 303  | `bg-background/80 hover:bg-background/90` | → `bg-sidebar-accent/80 hover:bg-sidebar-accent` (store card on dark sidebar) |

### Phase 2 — Leaf Pages

**Files:** `pages/home/HomePage.tsx`, `pages/reports/ReportsPage.tsx`, `pages/NotFoundPage.tsx`

- Token-driven. Verify colors render correctly.
- `NotFoundPage.tsx:15` gradient `from-primary to-sidebar-primary` — verify midnight navy gradient.

### Phase 3 — Products + Product Dialog

**Pages:** `pages/products/ProductsPage.tsx`
**Features:** `features/products/*`, `features/productDialog/*`

#### Product List Items

| File                  | Line  | Change                                                                                   |
| --------------------- | ----- | ---------------------------------------------------------------------------------------- |
| `ProductListItem.tsx` | 84–91 | Weight badge: apply new compact rectangular classes (§4)                                 |
| `ProductListItem.tsx` | 93–99 | MRP badge: apply new primary-accent pill classes (§4) — replace `warning` with `primary` |

#### Opacity Retunes

| File                           | Line    | Current           | Change                                    |
| ------------------------------ | ------- | ----------------- | ----------------------------------------- |
| `ProductHeader.tsx`            | 72, 390 | `bg-muted/40`     | → `bg-muted/60`                           |
| `ProductHeader.tsx`            | 92, 222 | `bg-muted/30`     | → `bg-muted/50`                           |
| `ProductListItem.tsx`          | 64      | `bg-muted/30`     | → `bg-muted/50` (image thumb placeholder) |
| `ProductViewMode.tsx`          | 36      | `bg-secondary/40` | → `bg-secondary/60`                       |
| `ProductViewMode.tsx`          | 95      | `bg-secondary/10` | (stays)                                   |
| `ProductEditForm.tsx`          | 59      | `bg-secondary/40` | → `bg-secondary/60`                       |
| `ProductImageCropSelector.tsx` | 192     | `bg-secondary/20` | → `bg-secondary/40`                       |
| `ProductTransactionsTable.tsx` | 181     | `bg-secondary/40` | → `bg-secondary/60`                       |
| `ProductHistoryTimeline.tsx`   | 118     | `bg-card/50`      | → `bg-card/70`                            |
| `ProductDialog.tsx`            | 147     | `bg-secondary/40` | → `bg-secondary/60` (TabsList)            |

#### Shadow Cleanup

| File                | Line          | Current                                     | Change        |
| ------------------- | ------------- | ------------------------------------------- | ------------- |
| `ProductDialog.tsx` | 147           | `shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]` | → `shadow-xs` |
| `ProductDialog.tsx` | 150, 157, 164 | `shadow-[0_2px_12px_rgba(0,0,0,0.06)]`      | → `shadow-md` |

#### Do Not Touch

- `productImageCrop.ts:4` — `#ffffff` canvas fill
- `--product-*` domain tokens — auto-swap via `:root`

### Phase 4 — Customers

**Page:** `pages/customers/CustomersPage.tsx`
**Features:** `features/customers/*`

| File                      | Line | Current                                                  | Change                       |
| ------------------------- | ---- | -------------------------------------------------------- | ---------------------------- |
| `CustomerTableRow.tsx`    | 131  | Status pills (`border-destructive/20 bg-destructive/10`) | Verify against new palette   |
| `CustomerSummaryCard.tsx` | 79   | `bg-primary/15`                                          | Verify against midnight navy |

Token-driven, no hardcoded colors. Verify status pill contrast.

### Phase 5 — Dashboard + Charts

**Pages:** `pages/dashboard/DashboardPage.tsx`, `Dashboard.tsx`
**Features:** `features/dashboard/*`, `features/transactionDashboard/*`

#### Opacity Retunes

| File             | Line | Current                                 | Change                                    |
| ---------------- | ---- | --------------------------------------- | ----------------------------------------- |
| `MetricCard.tsx` | 50   | `bg-secondary/60 hover:bg-secondary/80` | → `bg-secondary/70 hover:bg-secondary/90` |
| `Dashboard.tsx`  | 32   | `bg-secondary/90`                       | (stays)                                   |
| `ViewModal.tsx`  | 47   | `bg-secondary/30`                       | → `bg-secondary/50`                       |
| `ViewModal.tsx`  | 120  | `bg-secondary/10`                       | (stays)                                   |

#### Chart Color Fixes

| File                      | Line | Current                   | Change               |
| ------------------------- | ---- | ------------------------- | -------------------- |
| `TopProductsChart.tsx`    | 15   | `"hsl(140, 25%, 55%)"`    | → `"var(--chart-4)"` |
| `TopProductsChart.tsx`    | 16   | `"hsl(350, 30%, 65%)"`    | → `"var(--chart-5)"` |
| `SalesEstimatesChart.tsx` | 22   | `color: "var(--chart-1)"` | (stays — auto-swaps) |
| `SalesEstimatesChart.tsx` | 26   | `color: "var(--chart-2)"` | (stays — auto-swaps) |

### Phase 6 — Settings

**Page:** `pages/settings/SettingsPage.tsx`
**Features:** `features/settings/*`

Token-driven. Verify nested-route nav active states against midnight navy primary.

### Phase 7 — Global Search

**Features:** `features/search/*`, `components/highlighted-text.tsx`

| File                   | Line    | Current               | Change                                     |
| ---------------------- | ------- | --------------------- | ------------------------------------------ |
| `SearchDropdown.tsx`   | 351     | `bg-muted/50`         | → `bg-muted/70`                            |
| `SearchDropdown.tsx`   | 453     | `bg-muted/30`         | → `bg-muted/50`                            |
| `SearchDropdown.tsx`   | 318     | `ring-1 ring-black/6` | → `ring-1 ring-border` (use token)         |
| `SearchDropdown.tsx`   | 477–492 | Weight/MRP badges     | Apply same classes as ProductListItem (§4) |
| `highlighted-text.tsx` | 12      | `bg-search-highlight` | (stays — auto-swaps via token)             |

### Phase 8 — Billing (Most Complex)

**Page:** `pages/billing/BillingPage.tsx`
**Features:** `features/billing/*` incl. `tabs/`

#### Table & Rows

| File                 | Line     | Current               | Change                            |
| -------------------- | -------- | --------------------- | --------------------------------- |
| `LineItemsTable.tsx` | 74       | `bg-background/95`    | → `bg-background`                 |
| `LineItemsTable.tsx` | 75       | `bg-background/95`    | → `bg-muted/60`                   |
| `LineItemsTable.tsx` | 122      | `bg-background/80`    | → `bg-muted/60`                   |
| `LineItemRow.tsx`    | 53       | `hover:border-border` | (stays)                           |
| `LineItemRow.tsx`    | 96       | `bg-muted/30`         | → `bg-muted/60` (qty control)     |
| `LineItemRow.tsx`    | 184      | `bg-muted/25`         | → `bg-muted/40` (amount display)  |
| `LineItemRow.tsx`    | 202      | `bg-background/90`    | → `bg-muted/70` (discount button) |
| `LineItemRow.tsx`    | 231, 251 | `bg-background/80`    | → `bg-muted/60` (action buttons)  |

#### Header, Footer, Tabs

| File                | Line | Current                    | Change                             |
| ------------------- | ---- | -------------------------- | ---------------------------------- |
| `BillingHeader.tsx` | 170  | `bg-card border-border/60` | (stays)                            |
| `BillingHeader.tsx` | 201  | `bg-muted/30`              | → `bg-muted/60` (date/time box)    |
| `SummaryFooter.tsx` | 118  | `bg-background/60`         | → `bg-background/80`               |
| `BillingPage.tsx`   | 125  | `bg-background-secondary`  | (stays — auto-swaps)               |
| `BillingTab.tsx`    | 47   | `bg-background-secondary`  | → `bg-surface-1` (active tab lift) |

#### Shared Utility

| File             | Line | Current                                                                           | Change                                                                       |
| ---------------- | ---- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `utils/index.ts` | 54   | `getCheckStatusColor()` returns `bg-success/25`, `bg-warning/20`, `bg-background` | → `bg-success/15`, `bg-warning/15`, `bg-background` (retune for new palette) |

### Phase 9 — Onboarding

**Features:** `features/onboarding/*`

The onboarding flow uses a dark rail, intentionally dark regardless of main theme. The `--onboarding-*` tokens have been synced to midnight navy's hue (264) in the `:root` spec.

#### Hardcoded Colors in Motion Props

`OnboardingStepper.tsx` has inline `oklch()` values in `motion.animate` props (JavaScript objects — cannot reference CSS variables directly). Replace with a shared constant:

```tsx
// Add at top of OnboardingStepper.tsx
const STEP_COLORS = {
  completed: "#27a644", // --success
  active: "oklch(28% 0.04 264)", // --primary (midnight navy)
  inactive: "oklch(0.945 0.005 260)", // --surface-2
  activeBorder: "oklch(28% 0.04 264 / 0.5)", // --ring
  inactiveBorder: "oklch(0.86 0.006 260)", // --hairline
  activeText: "oklch(0.18 0.035 260)", // --ink
  inactiveText: "oklch(0.50 0.02 260)" // --ink-subtle
};
```

Then reference `STEP_COLORS.active`, `STEP_COLORS.inactive`, etc. in the motion `animate` props (lines 30–39, 56).

### Phase 10 — Verification & Polish

1. Run `pnpm typecheck && pnpm lint` — must pass clean.
2. Manual smoke test every route:
   - Home (`/`), Products, Customers, Dashboard (sales + estimates), Reports, Settings (all sub-pages)
   - Billing: create new sale, create new estimate, edit existing sale
   - Search dropdown (open in billing line item row)
   - Product dialog: view, edit, delete (soft), restore, permanent delete
   - Onboarding: fresh launch flow (store identity → location → owner → complete)
3. Verify all semantic states: success, warning, info, destructive — visible against warm canvas.
4. Verify charts render with correct muted palette.
5. Verify weight vs MRP badges are visually distinct.
6. Verify sidebar contrast — dark navy with light text, active item clearly visible.
7. Run `pnpm build` to verify production build succeeds.

---

## 8. Component-Specific Manual Edits

### Complete File-Change Checklist

| #   | File                                         | Lines              | Change                                               | Phase |
| --- | -------------------------------------------- | ------------------ | ---------------------------------------------------- | ----- |
| 1   | `src/index.css`                              | 12–284             | Replace `:root` and remove `.linear-light`           | 0     |
| 2   | `src/index.css`                              | `body` rule        | Add `font-weight: 500; font-size: 14px;`             | 0     |
| 3   | `components/Sidebar.tsx`                     | 198                | `border-r-black/8` → `border-r-border/15`            | 1     |
| 4   | `components/Sidebar.tsx`                     | 303                | Store card bg → `bg-sidebar-accent/80`               | 1     |
| 5   | `layouts/AppShell.tsx`                       | 96                 | `bg-muted/40` → `bg-muted/60`                        | 1     |
| 6   | `products/ProductListItem.tsx`               | 84–91              | Weight badge: compact rectangle classes              | 3     |
| 7   | `products/ProductListItem.tsx`               | 93–99              | MRP badge: primary-accent pill classes               | 3     |
| 8   | `products/ProductListItem.tsx`               | 64                 | `bg-muted/30` → `bg-muted/50`                        | 3     |
| 9   | `products/ProductHeader.tsx`                 | 72,390             | `bg-muted/40` → `bg-muted/60`                        | 3     |
| 10  | `products/ProductHeader.tsx`                 | 92,222             | `bg-muted/30` → `bg-muted/50`                        | 3     |
| 11  | `productDialog/ProductViewMode.tsx`          | 36                 | `bg-secondary/40` → `bg-secondary/60`                | 3     |
| 12  | `productDialog/ProductViewMode.tsx`          | 95                 | (stays)                                              | 3     |
| 13  | `productDialog/ProductEditForm.tsx`          | 59                 | `bg-secondary/40` → `bg-secondary/60`                | 3     |
| 14  | `productDialog/ProductImageCropSelector.tsx` | 192                | `bg-secondary/20` → `bg-secondary/40`                | 3     |
| 15  | `productDialog/ProductTransactionsTable.tsx` | 181                | `bg-secondary/40` → `bg-secondary/60`                | 3     |
| 16  | `productDialog/ProductHistoryTimeline.tsx`   | 118                | `bg-card/50` → `bg-card/70`                          | 3     |
| 17  | `productDialog/ProductDialog.tsx`            | 147                | `bg-secondary/40` → `bg-secondary/60` + shadow fix   | 3     |
| 18  | `productDialog/ProductDialog.tsx`            | 150,157,164        | `shadow-[...]` → `shadow-md`                         | 3     |
| 19  | `dashboard/MetricCard.tsx`                   | 50                 | `bg-secondary/60` → `bg-secondary/70`                | 5     |
| 20  | `dashboard/ViewModal.tsx`                    | 47                 | `bg-secondary/30` → `bg-secondary/50`                | 5     |
| 21  | `dashboard/TopProductsChart.tsx`             | 15–16              | Hardcoded hsl() → `var(--chart-4)`, `var(--chart-5)` | 5     |
| 22  | `search/SearchDropdown.tsx`                  | 351                | `bg-muted/50` → `bg-muted/70`                        | 7     |
| 23  | `search/SearchDropdown.tsx`                  | 453                | `bg-muted/30` → `bg-muted/50`                        | 7     |
| 24  | `search/SearchDropdown.tsx`                  | 318                | `ring-black/6` → `ring-border`                       | 7     |
| 25  | `search/SearchDropdown.tsx`                  | 477–492            | Weight/MRP badges (same as ProductListItem)          | 7     |
| 26  | `billing/LineItemsTable.tsx`                 | 74,75,122          | `bg-background/95` → `bg-background`/`bg-muted/60`   | 8     |
| 27  | `billing/LineItemRow.tsx`                    | 96,184,202,231,251 | Opacity retunes (see table)                          | 8     |
| 28  | `billing/BillingHeader.tsx`                  | 201                | `bg-muted/30` → `bg-muted/60`                        | 8     |
| 29  | `billing/SummaryFooter.tsx`                  | 118                | `bg-background/60` → `bg-background/80`              | 8     |
| 30  | `billing/BillingTab.tsx`                     | 47                 | `bg-background-secondary` → `bg-surface-1`           | 8     |
| 31  | `utils/index.ts`                             | 54                 | `getCheckStatusColor()` — retune opacities           | 8     |
| 32  | `onboarding/OnboardingStepper.tsx`           | 30–39,56           | Extract STEP_COLORS constant, sync to midnight navy  | 9     |

---

## 9. Verification Checklist

### After Phase 0 (CSS Swap)

- [ ] Page background is warm off-white (`oklch(0.98 0.002 260)`), not the previous cool off-white
- [ ] Sidebar is dark navy, clearly dimmer than content
- [ ] Sidebar text is legible (light text on dark navy)
- [ ] Primary buttons are midnight navy, not amber
- [ ] Text is deep charcoal (`oklch(0.18 0.035 260)`), body appears at weight 500
- [ ] Cards are pure white with 1px hairline borders — visible against warm canvas
- [ ] Success (green), warning (amber), destructive (red), info (blue) states all visible
- [ ] Scrollbars use token colors correctly

### After Phase 1–9 (Component Edits)

- [ ] Search bar in AppShell has sufficient contrast against warm canvas
- [ ] Sidebar store card blends with sidebar (not canvas-colored)
- [ ] Weight badges are compact gray rectangles (`rounded-md`), not pills
- [ ] MRP badges are midnight navy pills (`rounded-full`), distinct from weight badges
- [ ] Product list image thumbnails have correct background contrast
- [ ] Product dialog secondary surfaces have sufficient lift
- [ ] Product dialog tabs have correct shadows
- [ ] Customer status pills have proper contrast
- [ ] Dashboard metric cards have correct hover contrast
- [ ] Chart colors are muted Linear-style (no neon)
- [ ] `TopProductsChart` has no hardcoded hsl() — all tokens
- [ ] Search dropdown weight/MRP badges match ProductListItem style
- [ ] Search dropdown border uses token, not raw black
- [ ] Billing table container renders as a card
- [ ] Billing toolbar strip has subtle surface lift
- [ ] Billing qty controls and amount displays distinguishable from row bg
- [ ] Billing active tab has surface lift
- [ ] Billing save status displays correct semantic colors for all states
- [ ] `getCheckStatusColor()` opacities work with new palette
- [ ] Onboarding stepper uses midnight navy (not amber) for active step
- [ ] Onboarding stepper motion colors match palette tokens
- [ ] Onboarding gradient uses navy-leaning dark blues

### After Phase 10 (Final)

- [ ] `pnpm typecheck` passes clean
- [ ] `pnpm lint` passes clean
- [ ] `pnpm build` succeeds
- [ ] App loads on 1366×768 at zoomFactor 1.0 without horizontal scrollbars
- [ ] Print/PDF invoice pages untouched and correct
- [ ] No raw hex, rgb(), or oklch() values remain outside of `index.css` and `OnboardingStepper.tsx` STEP_COLORS constant

---

## 10. Rollback Plan

**Simplest rollback:**

```
git checkout -- apps/desktop/src/renderer/src/index.css
```

This restores the old `:root` token block and the `.linear-light` scope. All component className changes in Phases 1–9 are opacity/background tweaks that degrade gracefully — they work with either palette. However, if you want a complete rollback of component changes too:

```
git checkout -- apps/desktop/src/renderer/src/features/
git checkout -- apps/desktop/src/renderer/src/components/
git checkout -- apps/desktop/src/renderer/src/utils/index.ts
```

**Files safe from any migration impact (verified no changes):**

- `pages/export/pdf/PdfInvoicePage.tsx`
- `components/ui/*` (all 22 Shadcn files)
- `features/productDialog/productImageCrop.ts`
- Any files not listed in §8

---

## Appendix A: Doc Accuracy Notes

The previous migration guide (`08-linear-light-billing-migration.md`) had two stale line references. These are corrected in this document:

| Old doc claim                               | Actual line | Corrected here |
| ------------------------------------------- | ----------- | -------------- |
| §2.1 Sidebar `bg-background/80` at line 306 | Line 303    | §8 item #4     |
| §2.4 LineItemRow `bg-muted/25` at line 186  | Line 184    | §8 item #27    |

## Appendix B: Previously Undocumented Hotspots Now Covered

| Hotspot                                | Location                                                  | §8 item # |
| -------------------------------------- | --------------------------------------------------------- | --------- |
| `getCheckStatusColor()` opacity helper | `utils/index.ts:54`                                       | 31        |
| `TopProductsChart` hardcoded hsl()     | `TopProductsChart.tsx:15-16`                              | 21        |
| Raw `border-r-black/8` in Sidebar      | `Sidebar.tsx:198`                                         | 3         |
| Raw `ring-black/6` in SearchDropdown   | `SearchDropdown.tsx:318`                                  | 24        |
| ProductDialog arbitrary rgba() shadows | `ProductDialog.tsx:147,150,157,164`                       | 17, 18    |
| Weight/MRP badge visual parity bug     | `ProductListItem.tsx:84-99`, `SearchDropdown.tsx:477-492` | 6, 7, 25  |
