# Design System A: Trust & Clarity

**Indigo + Inter · Professional, high-contrast, bank-grade reliability.**

Built for billing operators who need instant readability, clear status signals, and a UI that conveys trust. Indigo is the color of banking software for a reason — it reads as stable, secure, and authoritative without being cold.

## Font: Inter

Inter is purpose-built for data-dense UIs. Tabular numbers (`tnum`) make price columns align perfectly. High x-height keeps small text legible at 12-13px. Already loaded in the codebase. No change needed.

---

## Core Palette

All values in `oklch(L C H)` format. Lightness `0-1`, chroma `0-0.4`, hue `0-360`.

### Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--background` | `oklch(0.99 0.002 264)` | `bg-background` | Page background — cool off-white |
| `--foreground` | `oklch(0.21 0.034 264)` | `text-foreground` | Body text — slate 900 |
| `--card` | `oklch(1 0 0)` | `bg-card` | Card surface — pure white |
| `--card-foreground` | `oklch(0.21 0.034 264)` | `text-card-foreground` | Text on cards |
| `--popover` | `oklch(1 0 0)` | `bg-popover` | Dropdown/popover surface |
| `--popover-foreground` | `oklch(0.21 0.034 264)` | `text-popover-foreground` | Text in popovers |

### Primary / Actions

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--primary` | `oklch(0.52 0.18 264)` | `bg-primary` | Buttons, links, active states — rich indigo |
| `--primary-foreground` | `oklch(1 0 0)` | `text-primary-foreground` | Text on primary — white |

### Secondary / Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--secondary` | `oklch(0.94 0.005 264)` | `bg-secondary` | Subtle surface behind content |
| `--secondary-foreground` | `oklch(0.32 0.02 264)` | `text-secondary-foreground` | Text on secondary |
| `--accent` | `oklch(0.55 0.2 278)` | `bg-accent` | Highlight/emphasis — violet |
| `--accent-foreground` | `oklch(1 0 0)` | `text-accent-foreground` | Text on accent |
| `--muted` | `oklch(0.967 0.003 264)` | `bg-muted` | De-emphasized surface |
| `--muted-foreground` | `oklch(0.55 0.02 264)` | `text-muted-foreground` | Secondary text |

### Semantic States

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--success` | `oklch(0.60 0.18 160)` | `bg-success` | Synced, paid, completed |
| `--success-foreground` | `oklch(1 0 0)` | `text-success-foreground` | Text on success |
| `--warning` | `oklch(0.72 0.18 85)` | `bg-warning` | Unsaved, pending, attention |
| `--warning-foreground` | `oklch(0.21 0.034 264)` | `text-warning-foreground` | Dark text on warning |
| `--destructive` | `oklch(0.52 0.24 27)` | `bg-destructive` | Error, delete, void |
| `--destructive-foreground` | `oklch(1 0 0)` | `text-destructive-foreground` | Text on destructive |
| `--info` | `oklch(0.58 0.14 242)` | `bg-info` | Saving, processing, neutral state |
| `--info-foreground` | `oklch(1 0 0)` | `text-info-foreground` | Text on info |

### Borders & Inputs

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--border` | `oklch(0.88 0.008 264)` | `border-border` | Default borders |
| `--input` | `oklch(0.91 0.006 264)` | `border-input` | Form input border |
| `--ring` | `oklch(0.52 0.18 264)` | `ring-ring` | Focus ring — matches primary |

### Sidebar

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--sidebar` | `oklch(0.22 0.03 264)` | `bg-sidebar` | Sidebar surface — dark navy |
| `--sidebar-foreground` | `oklch(0.90 0.01 264)` | `text-sidebar-foreground` | Sidebar text — light |
| `--sidebar-primary` | `oklch(0.52 0.18 264)` | `bg-sidebar-primary` | Active nav item — indigo |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `text-sidebar-primary-foreground` | Text on active nav |
| `--sidebar-accent` | `oklch(0.27 0.03 264)` | `bg-sidebar-accent` | Nav item hover |
| `--sidebar-accent-foreground` | `oklch(0.94 0.005 264)` | `text-sidebar-accent-foreground` | Text on hover |

---

## Billing-Specific Tokens

### Sync Status (BillingSaveStatus, LineItemsTable)

| Token | Maps to | Tailwind class | Status |
|---|---|---|---|
| `--billing-synced` | `--success` | `bg-billing-synced` | SYNCED |
| `--billing-synced-foreground` | `--success-foreground` | `text-billing-synced-foreground` | |
| `--billing-saving` | `--info` | `bg-billing-saving` | SAVING |
| `--billing-saving-foreground` | `--info-foreground` | `text-billing-saving-foreground` | |
| `--billing-dirty` | `--warning` | `bg-billing-dirty` | IS_DIRTY |
| `--billing-dirty-foreground` | `--warning-foreground` | `text-billing-dirty-foreground` | |
| `--billing-error` | `--destructive` | `bg-billing-error` | ERROR |
| `--billing-error-foreground` | `--destructive-foreground` | `text-billing-error-foreground` | |

### Customer Type Badges (CustomerTypeColor)

| Token | Value | Tailwind class | Customer role |
|---|---|---|---|
| `--customer-cash` | `oklch(0.60 0.18 160)` | `bg-customer-cash` | Cash |
| `--customer-cash-foreground` | `oklch(0.30 0.09 160)` | `text-customer-cash-foreground` | |
| `--customer-account` | `oklch(0.58 0.14 242)` | `bg-customer-account` | Account |
| `--customer-account-foreground` | `oklch(0.28 0.07 242)` | `text-customer-account-foreground` | |
| `--customer-hotel` | `oklch(0.55 0.2 278)` | `bg-customer-hotel` | Hotel |
| `--customer-hotel-foreground` | `oklch(0.28 0.10 278)` | `text-customer-hotel-foreground` | |

### Product States

| Token | Value | Tailwind class | State |
|---|---|---|---|
| `--product-active` | `oklch(0.60 0.18 160)` | `text-product-active` | Active/enabled |
| `--product-inactive` | `oklch(0.55 0.04 80)` | `text-product-inactive` | Disabled |
| `--product-low-stock` | `oklch(0.72 0.18 85)` | `text-product-low-stock` | Stock <= threshold |

### Transaction Types

| Token | Maps to | Tailwind class | Type |
|---|---|---|---|
| `--txn-sale` | `--primary` | `text-txn-sale` | Sale invoice |
| `--txn-estimate` | `--accent` | `text-txn-estimate` | Estimate/quotation |

---

## Chart Palette

Used in SalesEstimatesChart (bar, 2 series) and TopProductsChart (pie, up to 6 slices).

| Token | Value | Hex approx | Use |
|---|---|---|---|
| `--chart-1` | `oklch(0.52 0.18 264)` | `#3b5fe0` | Sales bars, pie slice 1 |
| `--chart-2` | `oklch(0.60 0.18 160)` | `#10a370` | Estimates bars, pie slice 2 |
| `--chart-3` | `oklch(0.72 0.18 85)` | `#d4950a` | Pie slice 3 |
| `--chart-4` | `oklch(0.55 0.2 278)` | `#7749e0` | Pie slice 4 |
| `--chart-5` | `oklch(0.58 0.14 242)` | `#2b8fd4` | Pie slice 5 |
| `--chart-6` | `oklch(0.55 0.2 35)` | `#dc4a3a` | Pie slice 6 |

---

## Domain Tokens

### Onboarding (dark-themed welcome flow)

| Token | Value | Role |
|---|---|---|
| `--onboarding-bg-start` | `oklch(0.25 0.04 264)` | Gradient start |
| `--onboarding-bg-mid` | `oklch(0.18 0.03 264)` | Gradient mid |
| `--onboarding-bg-end` | `oklch(0.12 0.02 255)` | Gradient end |
| `--onboarding-text` | `oklch(0.90 0.01 264)` | Primary text on dark bg |
| `--onboarding-text-muted` | `oklch(0.65 0.01 264)` | Muted text on dark bg |
| `--onboarding-icon` | `oklch(0.52 0.18 264)` | Icon accent — matches primary |

### Product Dialog

| Token | Value | Role |
|---|---|---|
| `--product-label` | `oklch(0.50 0.015 264)` | Field labels |
| `--product-value` | `oklch(0.21 0.034 264)` | Field values (= foreground) |
| `--product-surface` | `oklch(0.97 0.003 264)` | Info block bg |
| `--product-surface-hover` | `oklch(0.95 0.005 264)` | Info block hover |
| `--product-divider` | `oklch(0.90 0.005 264)` | Section divider |
| `--product-badge-bg` | `oklch(0.94 0.02 264)` | Weight/MRP badge bg |
| `--product-badge-text` | `oklch(0.45 0.12 264)` | Badge text |

### Search Dropdown

| Token | Value | Role |
|---|---|---|
| `--search-highlight` | `oklch(0.93 0.04 264)` | Match highlight |
| `--search-icon-bg-from` | `oklch(0.97 0.01 264)` | Product icon gradient start |
| `--search-icon-bg-to` | `oklch(0.94 0.03 264)` | Product icon gradient end |
| `--search-icon-fg` | `oklch(0.55 0.15 264)` | Icon foreground |
| `--search-badge-weight-border` | `oklch(0.88 0.005 264)` | Weight badge border |
| `--search-badge-weight-bg` | `oklch(0.96 0.003 264)` | Weight badge bg |
| `--search-badge-weight-text` | `oklch(0.50 0.015 264)` | Weight badge text |
| `--search-badge-mrp-border` | `oklch(0.85 0.06 70)` | MRP badge border |
| `--search-badge-mrp-bg` | `oklch(0.95 0.03 80)` | MRP badge bg |
| `--search-badge-mrp-text` | `oklch(0.48 0.12 55)` | MRP badge text |

### Invoice (print)

| Token | Value | Role |
|---|---|---|
| `--invoice-bg` | `oklch(1 0 0)` | Invoice paper |
| `--invoice-text` | `oklch(0.20 0.02 264)` | Body text |
| `--invoice-text-muted` | `oklch(0.45 0.02 264)` | Secondary text |
| `--invoice-accent` | `oklch(0.52 0.18 264)` | Accent color (= primary) |
| `--invoice-border` | `oklch(0.90 0.01 264)` | Table borders |
| `--invoice-table-header-bg` | `oklch(0.96 0.01 264)` | Table header bg |

---

## Typography Scale

Built on Inter's variable weight axis (100-900). Slightly condensed scale optimized for data-dense billing UI — smaller body text, larger metric numbers.

| Token | Size | Line height | Weight | Role |
|---|---|---|---|---|
| `text-xs` | 0.75rem (12px) | 1rem (16px) | 400 | Captions, metadata, table footnotes |
| `text-sm` | 0.8125rem (13px) | 1.125rem (18px) | 400 | Table cells, secondary body |
| `text-base` | 0.875rem (14px) | 1.25rem (20px) | 400 | Body text, form labels |
| `text-lg` | 1rem (16px) | 1.5rem (24px) | 500 | Emphasized body, nav links |
| `text-xl` | 1.125rem (18px) | 1.75rem (28px) | 600 | Section headers, card titles |
| `text-2xl` | 1.25rem (20px) | 1.75rem (28px) | 600 | Page section titles |
| `text-3xl` | 1.5rem (24px) | 2rem (32px) | 600 | Page titles |
| `text-4xl` | 1.875rem (30px) | 2.25rem (36px) | 700 | Dashboard metric values |
| `text-5xl` | 2.25rem (36px) | 2.5rem (40px) | 700 | Hero numbers |

### Font Weights

| Token | Weight | Use |
|---|---|---|
| `font-light` | 300 | Large display text |
| `font-normal` | 400 | Body, table cells, labels |
| `font-medium` | 500 | Nav links, buttons, emphasized body |
| `font-semibold` | 600 | Section headers, card titles |
| `font-bold` | 700 | Page titles, metric values |
| `font-extrabold` | 800 | Hero numbers, grand totals |

### Letter Spacing

| Token | Value | Use |
|---|---|---|
| `tracking-normal` | 0 | Body, tables, forms |
| `tracking-wide` | 0.025em | Section labels, overlines |
| `tracking-wider` | 0.05em | Uppercase micro-text |

---

## Shadows

Normalized scale. All values use `oklch(0 0 0 / <alpha>)` for consistent shadow color.

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.05)` |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.06)` |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.07), 0 2px 4px oklch(0 0 0 / 0.06)` |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.08), 0 4px 6px oklch(0 0 0 / 0.05)` |
| `--shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.1), 0 8px 10px oklch(0 0 0 / 0.06)` |
| `--shadow-2xl` | `0 25px 50px oklch(0 0 0 / 0.15)` |

---

## Spacing Corrections

These non-standard values from the audit should be replaced with clean multiples of the Tailwind `0.25rem` grid:

| Current (audit §5) | Replace with | Rationale |
|---|---|---|
| `h-18.25` (4.5625rem, header) | `h-18` (4.5rem, 72px) | Clean multiple of 0.25rem |
| `h-4.5 w-4.5` (1.125rem, icons) | `h-4 w-4` (1rem) or `h-5 w-5` (1.25rem) | On-grid sizes |
| `h-[1.35rem]` (nav icons) | `h-5` (1.25rem) | Standard icon size |
| `h-[1.15rem]` (switch thumb) | `h-4` (1rem) | Standard switch size |
| `w-37.5` (select width) | `w-36` (9rem) or `w-40` (10rem) | On-grid |
| `h-[2.5px]` (tab accent) | `h-0.5` (2px) or `h-px` (1px) | On-grid |
| `min-h-[3.3rem]` (row) | `min-h-12` (3rem) or `min-h-14` (3.5rem) | On-grid |

---

## Scrollbar

Mapped to tokens instead of hardcoded hex:

```css
::-webkit-scrollbar-track { background-color: var(--muted); }
::-webkit-scrollbar-thumb { background-color: var(--border); }
scrollbar-color: oklch(0.88 0.008 264) oklch(0.967 0.003 264); /* Firefox */
```

---

## What's Removed

| Removed | Reason |
|---|---|
| `--borderprimary` | Never used by any component |
| `--background-secondary` | Redundant — use `--secondary` |
| `--font-serif` (Merriweather) | Font file doesn't exist on disk |
| Italic `@font-face` declarations | Faux-italic works; real files load but aren't declared |
| Dark mode variant (`@custom-variant dark`) | Not needed for billing app |
| All `dark:` class variants | Remove from components |
| `--shadow-2xs` (duplicate of xs) | Consolidated into `--shadow-xs` |
| `--shadow` (duplicate of sm) | Consolidated into `--shadow-sm` |
| `prefers-reduced-motion` | Still absent (defer to follow-up PR) |

---

## Token Migration Map

When implementing this system, update component class references:

| Old class / value | New class / token | Files affected |
|---|---|---|
| `bg-[oklch(87.67% 0.165 90.15)]` | `bg-primary` | OnboardingStepper, OnboardingComplete |
| `oklch(77.55% 0.174 90.04)` (ring) | `ring-ring` | OnboardingStepper |
| `text-warning` (undefined) | `text-warning-foreground` (now defined) | LineItemsTable |
| `#3b82f6` / `#1b82f6` (sales chart) | `var(--chart-1)` | SalesEstimatesChart |
| `#10b981` / `#10b983` (estimates chart) | `var(--chart-2)` | SalesEstimatesChart |
| Raw `hsl(...)` pie colors | `var(--chart-1)` through `var(--chart-6)` | TopProductsChart |
| `#ffffff` (canvas bg) | `var(--background)` | productImageCrop.ts |
| `#ccc` (chart grid) | `var(--border)` | chart.tsx (shadcn) |
| `#e5e7eb` / `#9ca3af` (scrollbar) | `var(--muted)` / `var(--border)` | index.css |
| `bg-blue-500/15 text-blue-400` (saving) | `bg-billing-saving/15 text-billing-saving` | BillingSaveStatus |
| `bg-amber-500/15 text-amber-400` (dirty) | `bg-billing-dirty/15 text-billing-dirty` | BillingSaveStatus |
| `bg-red-500/15 text-red-400` (error) | `bg-billing-error/15 text-billing-error` | BillingSaveStatus |
| `bg-blue-500` / `bg-blue-400` (tabs) | `bg-primary` | BillingTab, BillingTabBar |
| `bg-green-100 text-green-800` (cash badge) | `bg-customer-cash/15 text-customer-cash` | CustomerTypeColor |
| `bg-blue-100 text-blue-800` (account badge) | `bg-customer-account/15 text-customer-account` | CustomerTypeColor |
| `bg-purple-100 text-purple-800` (hotel badge) | `bg-customer-hotel/15 text-customer-hotel` | CustomerTypeColor |
| `bg-gray-100 text-gray-800` (default badge) | `bg-muted text-foreground` | CustomerTypeColor |
| `bg-orange-400` / `bg-emerald-500` (status) | `bg-warning` / `bg-success` | StatusIndicator, ProductEditForm |
| `text-emerald-600` (history) | `text-success` | ProductHistoryTimeline |
| `bg-purple-200 text-purple-600` (txn tag) | `bg-accent/20 text-accent` | ProductTransactionsTable, RecentTransactionsTableRow, DashboardTableRow |
| `border-slate-200 bg-slate-50` (product badge) | `border-border bg-muted` | ProductListItem |
| `border-orange-200 bg-orange-50` (MRP badge) | `border-search-badge-mrp-border bg-search-badge-mrp-bg` | ProductListItem |
| `bg-gray-100/200/300` (skeleton 32 occurrences) | `bg-muted`, `bg-secondary` | BillingSkeleton |
| `border-gray-200 bg-white` (skeleton panels) | `border-border bg-card` | BillingSkeleton |
| `bg-yellow-50/200` (skeleton add-row) | `bg-warning/10`, `bg-warning/30` | BillingSkeleton |
| `border-green-50` (skeleton preview) | `border-success/20` | BillingSkeleton |
| `border-black` / `text-black` (print) | `border-invoice-border` / `text-invoice-text` | DemoReceipts, BillPreview |
| `bg-neutral-100` (receipt) | `bg-invoice-bg` | DemoReceipts, BillPreview |
| `border-green-500 bg-white` (paid) | `border-success bg-card` | BillPreview |
| `hover:bg-black/5` (sidebar resize) | `hover:bg-sidebar-accent` | Sidebar |
| `bg-black (overlay)` | `bg-foreground/50` | dialog, alert-dialog, ProductImageCropSelector |
| `text-white` (button, badge) | `text-primary-foreground` or `text-success-foreground` etc. | button, badge, OnboardingFlow |
