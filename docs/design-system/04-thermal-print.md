# Design System D: Thermal Print

**Monospace prices · Receipt aesthetic · Stark contrast · One accent.**

A billing app is a digital cash register. The interface should feel like the data itself — numbers, prices, quantities — are the primary visual element. This system borrows from the material world of POS receipts: high-contrast black on white, monospace data columns that align like printed text, ruled borders, and a single chromatic accent deployed only where it carries functional meaning. No gradients. Almost no shadows. Pure information density.

## Signature Element

**Monospace price columns.** Every price, quantity, total, and SKU in the billing table renders in a monospace font with tabular numbers. The columns snap into perfect alignment — like looking at a printed receipt where every digit occupies the same width. The sans-serif UI chrome around it (labels, buttons, nav) creates a deliberate typographic contrast: the machine-made precision of monospace data against the readable warmth of UI text.

## Fonts

### UI Chrome
**Inter** (already loaded). Tight tracking (`-0.01em`). Used for all labels, buttons, nav, headings, body text. Lowercase, utilitarian, gets out of the way.

### Data (prices, quantities, totals, SKUs)
System monospace stack:
```
ui-monospace, "Cascadia Code", "Source Code Pro", "JetBrains Mono", "Consolas", "Courier New", monospace
```
Zero additional font files. On macOS this resolves to SF Mono (beautiful). On Windows to Consolas (crisp). On Linux to the system default monospace. All render tabular numbers natively — columns align without any CSS tricks.

**Usage rule**: Any element displaying a currency amount, quantity, SKU, or numeric identifier gets `font-mono`. This is the system's signature.

---

## Core Palette

Everything is black, white, or receipt paper. One accent (receipt blue) for interactive elements. Color enters only through semantic states (success, warning, destructive).

### Surfaces

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--background` | `oklch(0.99 0.003 95)` | `bg-background` | Page — slightly warm white (receipt paper) |
| `--foreground` | `oklch(0.14 0.015 285)` | `text-foreground` | Body text — thermal print black |
| `--card` | `oklch(1 0 0)` | `bg-card` | Card — pure white |
| `--card-foreground` | `oklch(0.14 0.015 285)` | `text-card-foreground` | Text on cards |
| `--popover` | `oklch(1 0 0)` | `bg-popover` | Popover surface |
| `--popover-foreground` | `oklch(0.14 0.015 285)` | `text-popover-foreground` | Text in popovers |

### Surfaces (secondary)

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--secondary` | `oklch(0.94 0.005 100)` | `bg-secondary` | Subtle surface — like receipt carbon copy |
| `--secondary-foreground` | `oklch(0.25 0.015 285)` | `text-secondary-foreground` | Text on secondary |
| `--muted` | `oklch(0.96 0.003 100)` | `bg-muted` | De-emphasized surface |
| `--muted-foreground` | `oklch(0.45 0.01 285)` | `text-muted-foreground` | Secondary text |

### Primary / Actions

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--primary` | `oklch(0.14 0.015 285)` | `bg-primary` | Primary buttons — thermal black (solid) |
| `--primary-foreground` | `oklch(1 0 0)` | `text-primary-foreground` | Text on primary buttons — white |
| `--accent` | `oklch(0.52 0.13 250)` | `bg-accent` | Highlight accent — receipt blue |
| `--accent-foreground` | `oklch(1 0 0)` | `text-accent-foreground` | Text on accent |

### Borders (Two-Tier System)

Unlike typical design systems with near-invisible borders, Thermal Print uses visible ruled lines — like printed receipts. Two tiers: structural (dark, for card edges and section dividers) and internal (medium, for table cells and input borders).

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--border` | `oklch(0.72 0.006 285)` | `border-border` | Internal borders — table cells, form inputs |
| `--border-strong` | `oklch(0.30 0.008 285)` | `border-border-strong` | Structural borders — card edges, section dividers |
| `--input` | `oklch(0.60 0.008 285)` | `border-input` | Form input border |
| `--ring` | `oklch(0.14 0.015 285)` | `ring-ring` | Focus ring — thermal black |

### Semantic States

The only chromatic colors in the system. Deployed exclusively for functional status.

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--success` | `oklch(0.55 0.17 155)` | `bg-success` | Synced, paid — receipt green |
| `--success-foreground` | `oklch(1 0 0)` | `text-success-foreground` | Text on success |
| `--warning` | `oklch(0.68 0.17 80)` | `bg-warning` | Unsaved, pending — price-tag amber |
| `--warning-foreground` | `oklch(0.14 0.015 285)` | `text-warning-foreground` | Dark text on warning |
| `--destructive` | `oklch(0.48 0.22 25)` | `bg-destructive` | Error, delete — stamp-ink red |
| `--destructive-foreground` | `oklch(1 0 0)` | `text-destructive-foreground` | Text on destructive |
| `--info` | `oklch(0.52 0.13 250)` | `bg-info` | Saving, processing — receipt blue |
| `--info-foreground` | `oklch(1 0 0)` | `text-info-foreground` | Text on info |

### Sidebar

Dark sidebar — like the back of a receipt roll. Unroll the paper, one side is white (content), the other is dark (sidebar). The receipt blue accent gives the nav a single point of color.

| Token | oklch Value | Tailwind class | Role |
|---|---|---|---|
| `--sidebar` | `oklch(0.14 0.015 285)` | `bg-sidebar` | Sidebar — thermal black |
| `--sidebar-foreground` | `oklch(0.88 0.005 100)` | `text-sidebar-foreground` | Sidebar text — light |
| `--sidebar-primary` | `oklch(0.52 0.13 250)` | `bg-sidebar-primary` | Active nav — receipt blue |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `text-sidebar-primary-foreground` | Text on active nav |
| `--sidebar-accent` | `oklch(0.22 0.01 285)` | `bg-sidebar-accent` | Nav hover — lighter black |
| `--sidebar-accent-foreground` | `oklch(0.92 0.005 100)` | `text-sidebar-accent-foreground` | Text on hover |

---

## Billing-Specific Tokens

### Sync Status (BillingSaveStatus, LineItemsTable)

| Token | Maps to | Status |
|---|---|---|
| `--billing-synced` | `--success` | SYNCED |
| `--billing-synced-foreground` | `--success-foreground` | |
| `--billing-saving` | `--info` | SAVING |
| `--billing-saving-foreground` | `--info-foreground` | |
| `--billing-dirty` | `--warning` | IS_DIRTY |
| `--billing-dirty-foreground` | `--warning-foreground` | |
| `--billing-error` | `--destructive` | ERROR |
| `--billing-error-foreground` | `--destructive-foreground` | |

### Customer Type Badges (CustomerTypeColor)

Monochromatic with subtle tint — badges blend with the UI, showing type without shouting.

| Token | oklch Value | Customer role |
|---|---|---|
| `--customer-cash` | `oklch(0.55 0.17 155)` | Cash — receipt green tint |
| `--customer-cash-foreground` | `oklch(0.28 0.09 155)` | |
| `--customer-account` | `oklch(0.52 0.13 250)` | Account — receipt blue tint |
| `--customer-account-foreground` | `oklch(0.26 0.07 250)` | |
| `--customer-hotel` | `oklch(0.50 0.08 310)` | Hotel — subtle violet tint |
| `--customer-hotel-foreground` | `oklch(0.25 0.04 310)` | |

### Product States

| Token | oklch Value | State |
|---|---|---|
| `--product-active` | `oklch(0.55 0.17 155)` | Active — receipt green |
| `--product-inactive` | `oklch(0.45 0.01 285)` | Disabled — muted |
| `--product-low-stock` | `oklch(0.68 0.17 80)` | Low stock — amber |

### Transaction Types

| Token | Maps to | Type |
|---|---|---|
| `--txn-sale` | `--foreground` | Sale — thermal black |
| `--txn-estimate` | `--muted-foreground` | Estimate — lighter |

### Table Row Alternation

For the billing table (long rows of line items), alternate row backgrounds help scanning without adding visual noise:

| Token | oklch Value | Role |
|---|---|---|
| `--table-row` | `oklch(1 0 0)` | Default row |
| `--table-row-alt` | `oklch(0.985 0.002 100)` | Alternating row — subtle receipt-paper shift |

---

## Chart Palette

Charts introduce more color than the UI (they need distinguishable slices), but stay muted and receipt-appropriate. Six swatches — like different colored receipt papers or stamp inks.

| Token | oklch Value | Hex approx | Use |
|---|---|---|---|
| `--chart-1` | `oklch(0.14 0.015 285)` | `#1e1f24` | Sales bars, slice 1 — thermal black |
| `--chart-2` | `oklch(0.55 0.17 155)` | `#0e7a3e` | Estimates bars, slice 2 — receipt green |
| `--chart-3` | `oklch(0.52 0.13 250)` | `#2563c0` | Slice 3 — receipt blue |
| `--chart-4` | `oklch(0.68 0.17 80)` | `#b8700a` | Slice 4 — amber |
| `--chart-5` | `oklch(0.48 0.22 25)` | `#b8221e` | Slice 5 — stamp red |
| `--chart-6` | `oklch(0.50 0.08 310)` | `#6b3fa0` | Slice 6 — violet |

---

## Domain Tokens

### Onboarding (dark welcome flow)

The onboarding flow keeps the dark theme but uses the thermal aesthetic — receipt blue accent, monospace for any numbers shown.

| Token | oklch Value | Role |
|---|---|---|
| `--onboarding-bg-start` | `oklch(0.18 0.02 285)` | Gradient start |
| `--onboarding-bg-mid` | `oklch(0.12 0.015 285)` | Gradient mid |
| `--onboarding-bg-end` | `oklch(0.07 0.01 280)` | Gradient end |
| `--onboarding-text` | `oklch(0.90 0.005 100)` | Primary text on dark |
| `--onboarding-text-muted` | `oklch(0.60 0.01 285)` | Muted text on dark |
| `--onboarding-icon` | `oklch(0.52 0.13 250)` | Icon accent — receipt blue |

### Product Dialog

| Token | oklch Value | Role |
|---|---|---|
| `--product-label` | `oklch(0.45 0.01 285)` | Field labels — medium gray |
| `--product-value` | `oklch(0.14 0.015 285)` | Field values — thermal black |
| `--product-surface` | `oklch(0.97 0.003 100)` | Info block bg |
| `--product-surface-hover` | `oklch(0.94 0.005 100)` | Info block hover |
| `--product-divider` | `oklch(0.30 0.008 285)` | Section divider — border-strong |
| `--product-badge-bg` | `oklch(0.14 0.015 285)` | Badge bg — thermal black pill |
| `--product-badge-text` | `oklch(1 0 0)` | Badge text — white on black |

### Search Dropdown

| Token | oklch Value | Role |
|---|---|---|
| `--search-highlight` | `oklch(0.93 0.04 250)` | Match highlight — subtle blue |
| `--search-icon-bg-from` | `oklch(0.97 0.003 100)` | Icon gradient start |
| `--search-icon-bg-to` | `oklch(0.94 0.005 100)` | Icon gradient end |
| `--search-icon-fg` | `oklch(0.52 0.13 250)` | Icon foreground — receipt blue |
| `--search-badge-weight-border` | `oklch(0.30 0.008 285)` | Weight badge border — border-strong |
| `--search-badge-weight-bg` | `oklch(1 0 0)` | Weight badge bg |
| `--search-badge-weight-text` | `oklch(0.14 0.015 285)` | Weight badge text |
| `--search-badge-mrp-border` | `oklch(0.48 0.22 25)` | MRP badge border — stamp red |
| `--search-badge-mrp-bg` | `oklch(0.97 0.01 30)` | MRP badge bg — faint red tint |
| `--search-badge-mrp-text` | `oklch(0.48 0.22 25)` | MRP badge text — stamp red |

### Invoice (print)

| Token | oklch Value | Role |
|---|---|---|
| `--invoice-bg` | `oklch(1 0 0)` | Invoice paper |
| `--invoice-text` | `oklch(0.14 0.015 285)` | Body text — thermal black |
| `--invoice-text-muted` | `oklch(0.40 0.01 285)` | Secondary text |
| `--invoice-accent` | `oklch(0.14 0.015 285)` | Accent — thermal black (no color in print) |
| `--invoice-border` | `oklch(0.30 0.008 285)` | Table borders — visible rules |
| `--invoice-table-header-bg` | `oklch(0.96 0.003 100)` | Table header bg |

---

## Typography Scale

### Sans-Serif (Inter — UI Chrome)

Compressed, utilitarian scale. Negative tracking on headings. Tight line heights for data density.

| Token | Size | Line height | Weight | Tracking | Role |
|---|---|---|---|---|---|
| `text-xs` | 0.6875rem (11px) | 0.9375rem (15px) | 400 | 0 | Captions, footnotes |
| `text-sm` | 0.75rem (12px) | 1rem (16px) | 400 | 0 | Labels, metadata |
| `text-base` | 0.8125rem (13px) | 1.1875rem (19px) | 400 | `-0.005em` | Body, nav, form inputs |
| `text-lg` | 0.9375rem (15px) | 1.3125rem (21px) | 500 | `-0.01em` | Emphasized body, nav links |
| `text-xl` | 1rem (16px) | 1.375rem (22px) | 600 | `-0.01em` | Section headers |
| `text-2xl` | 1.125rem (18px) | 1.5rem (24px) | 600 | `-0.015em` | Card titles, page sections |
| `text-3xl` | 1.25rem (20px) | 1.625rem (26px) | 600 | `-0.015em` | Page titles |
| `text-4xl` | 1.5rem (24px) | 1.75rem (28px) | 700 | `-0.02em` | Dashboard metrics (monospace!) |
| `text-5xl` | 1.875rem (30px) | 2.125rem (34px) | 700 | `-0.02em` | Hero totals (monospace!) |

### Monospace (System Mono — Data)

Monospace renders ~12% larger than sans-serif at the same `rem`. The scale is offset to compensate — a monospace `0.8125rem` reads the same optical size as a sans-serif `0.875rem`. All monospace tokens have implicit tabular numbers.

**Monospace type scale** (apply with `font-mono` + the size class):

| Token | Size | Use |
|---|---|---|
| `text-mono-xs` | 0.6875rem (11px) | Small units, secondary quantities |
| `text-mono-sm` | 0.75rem (12px) | Table quantities, SKU codes |
| `text-mono-base` | 0.8125rem (13px) | Prices in table rows, line totals |
| `text-mono-lg` | 0.9375rem (15px) | Subtotal, discount, tax amounts |
| `text-mono-xl` | 1.125rem (18px) | Grand total on billing screen |
| `text-mono-2xl` | 1.5rem (24px) | Dashboard KPI numbers |

> Note: Tailwind's `@theme` block supports custom `--text-*` tokens. Define these as `--text-mono-base: 0.8125rem;` etc. in the `@theme inline` block.

### Font Weight Rules

Since monospace fonts have fewer weight variants than Inter, the usable range is narrower:

| Weight | Sans (Inter) | Mono (System) |
|---|---|---|
| `font-normal` (400) | Body, labels, table text | Quantities, SKUs |
| `font-medium` (500) | Buttons, nav, emphasized labels | Prices, subtotals |
| `font-semibold` (600) | Headers, card titles | Line totals |
| `font-bold` (700) | Page titles, metrics | Grand total, KPI numbers |

---

## Border System

Thermal Print has higher-contrast borders than any other design system. Two explicit tiers:

| Usage | Class | Token |
|---|---|---|
| Card edges, section dividers, sidebar boundary, table header bottom | `border-border-strong` | `--border-strong` (oklch 0.30) |
| Table cell dividers, form input borders, dropdown separators | `border-border` | `--border` (oklch 0.72) |
| Focus ring on inputs/buttons | `ring-ring` | `--ring` (oklch 0.14 — thermal black) |

In `@theme inline`:
```css
--color-border: var(--border);
--color-border-strong: var(--border-strong);
```

---

## Shadows

Almost none. Flat surfaces with border-based depth. The only shadows are for elevation that absolutely needs it (modals, dropdowns).

| Token | Value | Use |
|---|---|---|
| `--shadow-none` | `none` | Default — cards, panels, sidebar |
| `--shadow-sm` | `0 0 0 1px oklch(0 0 0 / 0.06)` | Subtle elevation — dropdowns |
| `--shadow-md` | `0 0 0 1px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.06)` | Modals, dialogs |
| `--shadow-lg` | `0 0 0 1px oklch(0 0 0 / 0.1), 0 8px 16px oklch(0 0 0 / 0.1)` | High elevation — overlays |

The `0 0 0 1px` ring-shadow pattern creates a crisp boundary — like the edge of cut receipt paper — rather than a soft blur.

---

## Spacing Corrections

Same as [System A](./01-trust-clarity.md) — replace all non-standard spacing with clean 0.25rem grid multiples.

---

## Scrollbar

Matches the thermal aesthetic — dark thumb on light track:

```css
::-webkit-scrollbar-track { background-color: var(--muted); }
::-webkit-scrollbar-thumb { background-color: var(--border); }
/* Firefox */
scrollbar-color: oklch(0.72 0.006 285) oklch(0.96 0.003 100);
```

---

## What's Removed

| Removed | Reason |
|---|---|
| All chromatic UI color except semantic states | Color is for function, not decoration |
| Soft shadows (`shadow-*` except for modals) | Flat surfaces, border-based depth |
| `--font-serif` (Merriweather) | Never loaded, not needed |
| Dark mode (`@custom-variant dark`, all `dark:` classes) | Not needed for billing |
| `--borderprimary`, `--background-secondary`, unused `--sidebar-primary` | Consolidated |
| Gradients | Flat thermal aesthetic |
| `--shadow-2xs`, `--shadow-xs` duplicates | Replaced with border-based elevation |
| Rounded corners (reduce `--radius` to `0.25rem`) | Crisp, receipt-like edges |

---

## Implementation Guidelines

### Component Classes

Apply monospace to numeric data everywhere:
```html
<!-- Price in table row -->
<span class="font-mono font-medium text-mono-base tabular-nums">₹ 1,299.50</span>

<!-- Quantity input -->
<input class="font-mono text-mono-sm tabular-nums" value="5" />

<!-- Grand total -->
<span class="font-mono font-bold text-mono-xl tabular-nums">₹ 24,580.00</span>
```

### Borders

Use strong borders for structural elements:
```html
<!-- Card -->
<div class="border border-border-strong bg-card rounded-sm">...</div>

<!-- Table -->
<table class="border-collapse">
  <thead class="border-b border-border-strong">...</thead>
  <tr class="border-b border-border">...</tr>
</table>

<!-- Sidebar -->
<aside class="bg-sidebar text-sidebar-foreground border-r border-border-strong">...</aside>
```

### Buttons

Primary buttons are thermal black (solid), secondary are bordered:
```html
<!-- Primary -->
<button class="bg-primary text-primary-foreground font-medium">Checkout</button>

<!-- Secondary / Ghost -->
<button class="border border-border-strong text-foreground hover:bg-secondary">Cancel</button>
```

---

## Token Migration Map

Same token names as Systems A/B/C — the migration map in [01-trust-clarity.md](./01-trust-clarity.md#token-migration-map) applies universally.

Additional changes specific to Thermal Print:
- All price/quantity/SKU elements: add `font-mono tabular-nums`
- Card components: change `shadow-sm` to `border border-border-strong`, remove `rounded-lg` → `rounded-sm`
- Sidebar: use `border-r border-border-strong` for the sidebar edge
- Table headers: `border-b border-border-strong` instead of `border-b border-border`
- Remove any remaining gradient backgrounds (billing skeleton, search icon gradients → use flat `bg-secondary` instead)

---

## Design Principle

> "The interface is the receipt. The receipt is the product."

A billing app's job is to make money legible. Every design decision here — monospace data, stark borders, absent shadows, minimal color — serves that single purpose: the numbers on screen should feel as authoritative and unambiguous as ink on paper. The UI chrome (buttons, nav, labels) is just the frame around the data. The data is the product.
