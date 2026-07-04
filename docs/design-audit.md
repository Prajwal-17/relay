# QuickCart Design Audit

A full inventory of design implementation findings across `apps/desktop/src/renderer/`.
All file paths are relative to `apps/desktop/src/renderer/src/` unless prefixed with the `apps/desktop/` root.

---

## 1. Bug-Level Issues

### 1.1 Hex Mismatch: Sales vs Estimates Chart Bar Fill

**File:** `features/dashboard/SalesEstimatesChart.tsx`

The chart config, legend dot, and bar `<fill>` values for the Sales bar disagree with each other:

| Element                               | Line(s) | Value                                            |
| ------------------------------------- | ------- | ------------------------------------------------ |
| `chartConfig.sales.color` (JS object) | 22      | `#3b82f6`                                        |
| Legend dot (`bg-[#3b82f6]`)           | 54      | `#3b82f6`                                        |
| Bar `fill="#1b82f6"`                  | 116     | `#1b82f6` (missing `3`, different shade of blue) |

The Estimates data has a similar mismatch:

| Element                                   | Line(s) | Value                                                                |
| ----------------------------------------- | ------- | -------------------------------------------------------------------- |
| `chartConfig.estimates.color` (JS object) | 26      | `#10b981`                                                            |
| Bar `fill="#10b981"`                      | 117     | `#10b981`                                                            |
| Legend dot (`bg-[#10b983]`)               | 59      | `#10b983` (`1` instead of `3` at the end — different shade of green) |

### 1.2 Merriweather Declared But Never Loaded

**File:** `index.css:24`, `pages/export/pdf/PdfInvoicePage.tsx:73,180`

`--font-serif` is set to `Merriweather, serif` in the CSS variable system (`index.css` line 24). There is no `@font-face` declaration for Merriweather anywhere in `index.css`. The font files do not exist on disk (`assets/fonts/` contains only `inter/` and `roboto/` directories). The PDF invoice page uses `font-serif` expecting Merriweather; it will fall back to the browser's default serif font.

### 1.3 Italic Font Variants Never Declared

**File:** `index.css:6-20`

`Inter-Italic-Font.ttf` and `Roboto-Italic-Font.ttf` exist in `assets/fonts/inter/` and `assets/fonts/roboto/` respectively. There are no `@font-face` declarations for the italic variants. Any usage of `font-style: italic` with Inter or Roboto will produce a browser-generated faux-italic (slanted glyphs).

### 1.4 Undefined Color Token: `text-warning`

**File:** `features/billing/LineItemsTable.tsx:108`

The class `text-warning` is used at line 108 but no `--warning` or `--color-warning` CSS variable exists in `index.css` or anywhere else in the codebase. It is not wired in the `@theme inline` block. This is a phantom reference that resolves to nothing or relies on an unspecified external definition.

### 1.5 Duplicate Hardcoded Color Across Two Files

**File:** `features/dashboard/ItemRow.tsx:47`, `utils/index.ts:59`

The exact same arbitrary `oklch` value (`oklch(0.8618_0.2317_65.9)`) is used as `bg-[oklch(0.8618_0.2317_65.9)]/20` in two separate files with no shared constant or token. Changing this color requires editing both locations.

---

## 2. Hardcoded Color Values (Inline `oklch`, `hsl`, Hex in JSX)

Each value listed below is present as a literal string in component markup or logic and duplicates an already-defined CSS variable from `index.css:22-124`.

### 2.1 OnboardingStepper: `animate` Props

**File:** `features/onboarding/OnboardingStepper.tsx:28-57`

Eight inline `oklch()` values inside `motion.div` and `motion.span` `animate` props. Each has a corresponding CSS variable:

| Line   | Inline value                   | Already defined as   |
| ------ | ------------------------------ | -------------------- |
| 30, 36 | `oklch(69.72% 0.209 145.47)`   | `--success`          |
| 32     | `oklch(87.67% 0.165 90.15)`    | `--primary`          |
| 33     | `oklch(0.967 0.0029 264.5419)` | `--muted`            |
| 38     | `oklch(77.55% 0.174 90.04)`    | `--ring`             |
| 39     | `oklch(82% 0.006 286.286)`     | `--border`           |
| 56     | `oklch(0.2795 0.0368 260.031)` | `--foreground`       |
| 56     | `oklch(0.551 0.0234 264.3637)` | `--muted-foreground` |

### 2.2 OnboardingComplete: Inline `style` Props

**File:** `features/onboarding/OnboardingComplete.tsx:87,98`

Two inline `style={{ color: "oklch(60% 0.165 90.15)" }}` calls. This value is `--onboarding-icon-dark` defined at `index.css:74`.

### 2.3 SalesEstimatesChart: Chart Config Object

**File:** `features/dashboard/SalesEstimatesChart.tsx:19-28`

Two hex values in a plain JS config object:

- `"#3b82f6"` at line 22
- `"#10b981"` at line 26

No design-system mapping. These are the only chart data-series colors defined in the application.

### 2.4 TopProductsChart: Pie Color Palette

**File:** `features/dashboard/TopProductsChart.tsx:11-17`

Five `hsl()` values used as a pie chart color palette, defined as a plain JS array:

```ts
const COLORS = [
  "hsl(190, 45%, 45%)", // Deep Teal
  "hsl(220, 30%, 55%)", // Slate Blue
  "hsl(30, 40%, 65%)", // Muted Orange
  "hsl(140, 25%, 55%)", // Soft Sage
  "hsl(350, 30%, 65%)" // Dusty Rose
];
```

No design-token mapping.

### 2.5 Shadcn Chart Component: CSS Selectors

**File:** `components/ui/chart.tsx:56`

The generated chart component uses hex `#ccc` (4 occurrences) and `#fff` (2 occurrences) inside CSS attribute selector strings in class names:

```
[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50
[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border
[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border
[&_.recharts-dot[stroke='#fff']]:stroke-transparent
[&_.recharts-sector[stroke='#fff']]:stroke-transparent
```

### 2.6 Product Image Crop: Canvas Constant

**File:** `features/productDialog/productImageCrop.ts:4`

`CANVAS_BACKGROUND = "#ffffff"` — a standalone hex constant with no token reference.

---

## 3. Raw Tailwind Color Utilities (Bypass Design Tokens)

Each of these files uses Tailwind color utility classes (`bg-{color}-{shade}`, `text-{color}-{shade}`, etc.) instead of the semantic CSS variable tokens defined in `index.css`.

### 3.1 `features/billing/BillingSkeleton.tsx` (32 occurrences)

| Line  | Class(es)                     |
| ----- | ----------------------------- |
| 3     | `bg-gray-100`                 |
| 6     | `border-gray-200`, `bg-white` |
| 9     | `bg-gray-300`                 |
| 10    | `bg-gray-200`                 |
| 13    | `bg-gray-200`                 |
| 14    | `bg-gray-200`                 |
| 20    | `bg-gray-200`                 |
| 21    | `bg-gray-100`                 |
| 24    | `bg-gray-200`                 |
| 25    | `bg-gray-100`                 |
| 31    | `border-gray-200`, `bg-white` |
| 32    | `bg-gray-200`                 |
| 37-41 | `bg-gray-100` (5 occurrences) |
| 44    | `bg-yellow-50`                |
| 47    | `border-gray-100`             |
| 50    | `bg-yellow-200`               |
| 51    | `bg-gray-200`                 |
| 52    | `bg-gray-200`                 |
| 60    | `border-gray-200`, `bg-white` |
| 61    | `border-green-50`             |
| 62-64 | `bg-gray-200` (3 occurrences) |
| 67-69 | `bg-gray-100` (3 occurrences) |
| 74    | `bg-gray-200`                 |
| 77    | `bg-gray-300`                 |

### 3.2 `pages/print-test/DemoReceipts.tsx` (15 occurrences)

| Line                                        | Class(es)                                 |
| ------------------------------------------- | ----------------------------------------- |
| 41                                          | `bg-neutral-100`                          |
| 44                                          | `bg-white`, `text-black`                  |
| 78, 100, 113                                | `border-black` (3 occurrences)            |
| 166                                         | `bg-gray-100`                             |
| 247, 263, 270, 325, 333, 336, 367, 373, 380 | `border-black` (9 additional occurrences) |

### 3.3 `features/billing/BillPreview.tsx` (6 occurrences)

| Line       | Class(es)                                    |
| ---------- | -------------------------------------------- |
| 45         | `border-green-500`, `bg-neutral-100`         |
| 48         | `border-green-500`, `bg-white`, `text-black` |
| 63, 89, 96 | `border-black` (3 occurrences)               |

### 3.4 `features/customers/CustomerTypeColor.tsx` (4 return values, 16 raw classes total)

| Line | Class(es)                                                                        |
| ---- | -------------------------------------------------------------------------------- |
| 5    | `bg-green-100`, `text-green-800`, `dark:bg-green-900`, `dark:text-green-300`     |
| 7    | `bg-blue-100`, `text-blue-800`, `dark:bg-blue-900`, `dark:text-blue-300`         |
| 9    | `bg-purple-100`, `text-purple-800`, `dark:bg-purple-900`, `dark:text-purple-300` |
| 11   | `bg-gray-100`, `text-gray-800`, `dark:bg-gray-900`, `dark:text-gray-300`         |

### 3.5 `features/billing/BillingSaveStatus.tsx` (9 raw classes across 3 lines)

| Line | Class(es)                                                |
| ---- | -------------------------------------------------------- |
| 17   | `bg-blue-500/15`, `text-blue-400`, `ring-blue-400/25`    |
| 19   | `bg-amber-500/15`, `text-amber-400`, `ring-amber-400/25` |
| 20   | `bg-red-500/15`, `text-red-400`, `ring-red-400/25`       |

### 3.6 `features/billing/tabs/BillingTabBar.tsx`

| Line | Class(es)                                   |
| ---- | ------------------------------------------- |
| 118  | `bg-blue-500`                               |
| 134  | `hover:bg-red-500/10`, `hover:text-red-500` |

### 3.7 `features/billing/tabs/BillingTab.tsx`

| Line | Class(es)     |
| ---- | ------------- |
| 52   | `bg-blue-500` |
| 78   | `bg-blue-400` |

### 3.8 `features/products/ProductListItem.tsx`

| Line | Class(es)                                              |
| ---- | ------------------------------------------------------ |
| 86   | `border-slate-200`, `bg-slate-50`, `text-slate-600`    |
| 95   | `border-orange-200`, `bg-orange-50`, `text-orange-700` |

### 3.9 `features/productDialog/StatusIndicator.tsx`

| Line | Class(es)         |
| ---- | ----------------- |
| 12   | `bg-orange-400`   |
| 13   | `text-orange-600` |
| 22   | `bg-emerald-500`  |

### 3.10 `features/productDialog/ProductEditForm.tsx`

| Line | Class(es)        |
| ---- | ---------------- |
| 269  | `bg-emerald-500` |

### 3.11 `features/productDialog/ProductHistoryTimeline.tsx`

| Line | Class(es)                                   |
| ---- | ------------------------------------------- |
| 28   | `text-emerald-600`, `dark:text-emerald-400` |

### 3.12 `features/productDialog/ProductTransactionsTable.tsx`

| Line | Class(es)                          |
| ---- | ---------------------------------- |
| 152  | `bg-purple-200`, `text-purple-600` |

### 3.13 `features/dashboard/RecentTransactionsTableRow.tsx`

| Line | Class(es)                          |
| ---- | ---------------------------------- |
| 74   | `bg-purple-200`, `text-purple-600` |

### 3.14 `features/transactionDashboard/DashboardTableRow.tsx`

| Line | Class(es)                          |
| ---- | ---------------------------------- |
| 128  | `bg-purple-200`, `text-purple-600` |

### 3.15 `features/customers/CustomerSidebar.tsx`

| Line | Class(es)       |
| ---- | --------------- |
| 130  | `text-gray-900` |
| 131  | `text-gray-500` |

### 3.16 `features/dashboard/SalesEstimatesChart.tsx`

| Line | Class(es)     |
| ---- | ------------- |
| 87   | `bg-gray-100` |

### 3.17 `features/billing/QuantityPresets.tsx`

| Line | Class(es)     |
| ---- | ------------- |
| 87   | `bg-gray-300` |

### 3.18 `features/onboarding/OnboardingFlow.tsx`

| Line | Class(es)    |
| ---- | ------------ |
| 44   | `text-white` |
| 49   | `text-white` |

### 3.19 `features/onboarding/OnboardingStepper.tsx`

| Line | Class(es)    |
| ---- | ------------ |
| 47   | `text-white` |
| 49   | `text-black` |

### 3.20 `components/Sidebar.tsx`

| Line | Class(es)                                   |
| ---- | ------------------------------------------- |
| 323  | `hover:bg-black/5`, `dark:hover:bg-white/5` |

### 3.21 `features/productDialog/ProductImageCropSelector.tsx`

| Line | Class(es)  |
| ---- | ---------- |
| 193  | `bg-black` |

### 3.22 `pages/export/pdf/PdfInvoicePage.tsx`

| Line | Class(es)        |
| ---- | ---------------- |
| 63   | `print:bg-white` |

### 3.23 Shadcn-Generated Components

| File                             | Line | Class(es)     |
| -------------------------------- | ---- | ------------- |
| `components/ui/dialog.tsx`       | 39   | `bg-black/50` |
| `components/ui/alert-dialog.tsx` | 37   | `bg-black/50` |
| `components/ui/button.tsx`       | 14   | `text-white`  |
| `components/ui/badge.tsx`        | 17   | `text-white`  |

---

## 4. Arbitrary Tailwind Values

### 4.1 Arbitrary Font Sizes (`text-[...]`)

43 occurrences across 11 files. Each value listed with its nearest standard Tailwind equivalent for scale reference.

#### `text-[10px]` (25 occurrences, nearest standard: `text-xs` = 12px)

- `features/onboarding/OnboardingComplete.tsx:98`
- `features/productDialog/ProductEditForm.tsx:309,315,321,329,335`
- `pages/export/pdf/PdfInvoicePage.tsx:110`
- `pages/print-test/DemoReceipts.tsx:60,76,98,111,320,321,325,333,338,394`

#### `text-[8px]` (9 occurrences)

- `pages/print-test/DemoReceipts.tsx:360,363,367,373,380,391,396`

#### `text-[11px]` (1 occurrence)

- `pages/print-test/DemoReceipts.tsx:357`

#### `text-[0.8rem]` ≈ 12.8px (5 occurrences, nearest standard: `text-xs` = 12px)

- `components/ui/calendar.tsx:88,97`
- `features/productDialog/ProductDialog.tsx:120,129,138`

#### `text-[0.82rem]` ≈ 13.1px (1 occurrence, between `text-xs` 12px and `text-sm` 14px)

- `features/search/SearchDropdown.tsx:389`

#### `text-[0.92rem]` ≈ 14.7px (1 occurrence, between `text-sm` 14px and `text-base` 16px)

- `features/billing/LineItemsTable.tsx:179`

#### `text-[0.95rem]` ≈ 15.2px (6 occurrences, nearest standard: `text-base` = 16px)

- `features/productDialog/ProductDialog.tsx:150,157,164`
- `features/productDialog/ProductHistoryTimeline.tsx:23,79`
- `features/productDialog/ProductTransactionsTable.tsx:83`

#### `text-[1rem]` = 16px (1 occurrence, exactly `text-base`)

- `hooks/dashboard/useDateRangePicker.ts:32`

#### `text-[1.05rem]` ≈ 16.8px (5 occurrences, nearest standard: `text-lg` = 18px)

- `components/Sidebar.tsx:282`
- `features/billing/LineItemsTable.tsx:87,101,107`

### 4.2 Arbitrary Backgrounds (`bg-[...]`)

5 occurrences across 4 files:

| File                                         | Line | Value                                                                        |
| -------------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| `features/billing/LineItemsTable.tsx`        | 75   | `bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.88))]` |
| `features/dashboard/ItemRow.tsx`             | 47   | `bg-[oklch(0.8618_0.2317_65.9)]/20`                                          |
| `features/dashboard/SalesEstimatesChart.tsx` | 54   | `bg-[#3b82f6]`                                                               |
| `features/dashboard/SalesEstimatesChart.tsx` | 59   | `bg-[#10b983]`                                                               |
| `utils/index.ts`                             | 59   | `bg-[oklch(0.8618_0.2317_65.9)]/20`                                          |

### 4.3 Arbitrary Shadows (`shadow-[...]`)

10 occurrences across 5 files. The design system defines 8 shadow tokens (`--shadow-2xs` through `--shadow-2xl`) at `index.css:113-121`, none of which are used in these locations.

| File                                       | Line | Value                                                      |
| ------------------------------------------ | ---- | ---------------------------------------------------------- |
| `components/Sidebar.tsx`                   | 199  | `shadow-[20px_0_40px_rgba(0,0,0,0.1)]`                     |
| `features/billing/LineItemRow.tsx`         | 53   | `hover:shadow-[0_8px_24px_rgba(15,23,42,0.05)]`            |
| `features/billing/LineItemsTable.tsx`      | 74   | `shadow-[0_16px_50px_rgba(15,23,42,0.08)]`                 |
| `features/billing/LineItemsTable.tsx`      | 222  | `shadow-[0_10px_24px_rgba(15,23,42,0.1)]`                  |
| `features/productDialog/ProductDialog.tsx` | 147  | `shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]`                |
| `features/productDialog/ProductDialog.tsx` | 150  | `data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)]` |
| `features/productDialog/ProductDialog.tsx` | 157  | `data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)]` |
| `features/productDialog/ProductDialog.tsx` | 164  | `data-[state=active]:shadow-[0_2px_12px_rgba(0,0,0,0.06)]` |
| `features/search/SearchDropdown.tsx`       | 339  | `shadow-[2px_-2px_4px_rgba(0,0,0,0.06)]`                   |
| `features/search/SearchDropdown.tsx`       | 347  | `shadow-[0_18px_50px_rgba(15,23,42,0.12)]`                 |

### 4.4 Arbitrary Letter Spacing (`tracking-[...]`)

4 occurrences in 1 file:

| File                                  | Line            | Value               |
| ------------------------------------- | --------------- | ------------------- |
| `features/billing/LineItemsTable.tsx` | 89, 94, 99, 179 | `tracking-[0.14em]` |

Nearest standard tracking classes: `tracking-wider` = 0.05em, `tracking-widest` = 0.1em.

---

## 5. Non-Standard Spacing Values

Arbitrary sizes that fall outside Tailwind's default spacing scale (which uses multiples of `0.25rem`/`4px`).

| File                                   | Line  | Value                 | Description                             |
| -------------------------------------- | ----- | --------------------- | --------------------------------------- |
| `components/Sidebar.tsx`               | 288   | `[&_svg]:h-[1.35rem]` | Nav icon height                         |
| `components/Sidebar.tsx`               | 288   | `[&_svg]:w-[1.35rem]` | Nav icon width                          |
| `components/ui/switch.tsx`             | 14    | `h-[1.15rem]`         | Switch thumb height                     |
| `features/billing/LineItemRow.tsx`     | 57    | `min-h-[3.3rem]`      | Row min-height                          |
| `features/billing/tabs/BillingTab.tsx` | 77    | `h-[2.5px]`           | Active tab accent bar                   |
| `components/Sidebar.tsx`               | 209   | `h-18.25`             | Header height                           |
| `components/layouts/AppShell.tsx`      | 72    | `h-18.25`             | Header height (duplicated from sidebar) |
| `components/layouts/AppShell.tsx`      | 96-97 | `h-4.5 w-4.5`         | Search icon size                        |
| `components/layouts/AppShell.tsx`      | 69    | `w-37.5`              | Time period select width                |

---

## 6. Design Token Definition Map

### 6.1 Complete CSS Variable Inventory

All design tokens defined in `index.css:22-124`:

| CSS Variable                   | oklch Value                      | Tailwind Class                    | Intent                   |
| ------------------------------ | -------------------------------- | --------------------------------- | ------------------------ |
| `--background`                 | `oklch(0.9942 0.0034 247.8575)`  | `bg-background`                   | Page background          |
| `--background-secondary`       | `oklch(95.46% 0.004 264.37)`     | `bg-background-secondary`         | Secondary surface        |
| `--foreground`                 | `oklch(0.2795 0.0368 260.031)`   | `text-foreground`                 | Body text                |
| `--card`                       | `oklch(1 0 0)`                   | `bg-card`                         | Card surface             |
| `--card-foreground`            | `oklch(0.2795 0.0368 260.031)`   | `text-card-foreground`            | Card text                |
| `--popover`                    | `oklch(1 0 0)`                   | `bg-popover`                      | Popover surface          |
| `--popover-foreground`         | `oklch(0.2795 0.0368 260.031)`   | `text-popover-foreground`         | Popover text             |
| `--primary`                    | `oklch(87.67% 0.165 90.15)`      | `bg-primary`                      | Amber/yellow primary     |
| `--primary-foreground`         | `oklch(0% 0 0)`                  | `text-primary-foreground`         | Text on primary          |
| `--secondary`                  | `oklch(0.9276 0.0058 264.5313)`  | `bg-secondary`                    | Secondary surface        |
| `--secondary-foreground`       | `oklch(33.43% 0 0)`              | `text-secondary-foreground`       | Text on secondary        |
| `--accent`                     | `oklch(0.9519 0.0013 106.4244)`  | `bg-accent`                       | Accent surface           |
| `--accent-foreground`          | `oklch(0.3729 0.0306 259.7328)`  | `text-accent-foreground`          | Text on accent           |
| `--muted`                      | `oklch(0.967 0.0029 264.5419)`   | `bg-muted`                        | Muted surface            |
| `--muted-foreground`           | `oklch(0.551 0.0234 264.3637)`   | `text-muted-foreground`           | Secondary text           |
| `--destructive`                | `oklch(64.69% 0.238 29.23)`      | `bg-destructive`                  | Error/danger             |
| `--destructive-foreground`     | `oklch(100% 0 0)`                | `text-destructive-foreground`     | Text on destructive      |
| `--success`                    | `oklch(69.72% 0.209 145.47)`     | `bg-success`                      | Success status           |
| `--success-foreground`         | `oklch(100% 0 0)`                | `text-success-foreground`         | Text on success          |
| `--border`                     | `oklch(82% 0.006 286.286)`       | `border-border`                   | Default borders          |
| `--borderprimary`              | `oklch(0.8475 0.173193 89.8358)` | `border-borderprimary`            | Primary-colored borders  |
| `--input`                      | `oklch(0.8717 0.0093 258.3382)`  | `border-input`                    | Form input border        |
| `--ring`                       | `oklch(77.55% 0.174 90.04)`      | `ring-ring`                       | Focus ring               |
| `--sidebar`                    | `oklch(95.46% 0.004 264.37)`     | `bg-sidebar`                      | Sidebar background       |
| `--sidebar-foreground`         | `oklch(0.2795 0.0368 260.031)`   | `text-sidebar-foreground`         | Sidebar text             |
| `--sidebar-primary`            | `oklch(0.5854 0.2041 277.1173)`  | `bg-sidebar-primary`              | Sidebar primary (purple) |
| `--sidebar-primary-foreground` | `oklch(0.9519 0.0013 106.4244)`  | `text-sidebar-primary-foreground` | Text on sidebar primary  |
| `--sidebar-accent`             | `oklch(0.9519 0.0013 106.4244)`  | `bg-sidebar-accent`               | Sidebar accent/hover     |
| `--sidebar-accent-foreground`  | `oklch(0.3729 0.0306 259.7328)`  | `text-sidebar-accent-foreground`  | Text on sidebar accent   |

### 6.2 Domain-Specific Tokens

#### Onboarding (index.css:67-74)

| CSS Variable                  | oklch Value                        |
| ----------------------------- | ---------------------------------- |
| `--onboarding-gradient-start` | `oklch(25% 0.04 264)`              |
| `--onboarding-gradient-mid`   | `oklch(18% 0.03 264)`              |
| `--onboarding-gradient-end`   | `oklch(12% 0.02 255)`              |
| `--onboarding-text-muted`     | `oklch(70% 0.01 264)`              |
| `--onboarding-text-footer`    | `oklch(45% 0.01 264)`              |
| `--onboarding-icon-bg`        | `oklch(87.67% 0.165 90.15 / 0.15)` |
| `--onboarding-feature-text`   | `oklch(80% 0.01 264)`              |
| `--onboarding-icon-dark`      | `oklch(60% 0.165 90.15)`           |

#### Product Dialog (index.css:79-85)

| CSS Variable              | oklch Value            |
| ------------------------- | ---------------------- |
| `--product-label`         | `oklch(55% 0.02 264)`  |
| `--product-value`         | `oklch(28% 0.04 260)`  |
| `--product-surface`       | `oklch(97% 0.003 264)` |
| `--product-surface-hover` | `oklch(95% 0.005 264)` |
| `--product-divider`       | `oklch(90% 0.005 264)` |
| `--product-badge-bg`      | `oklch(94% 0.02 90)`   |
| `--product-badge-text`    | `oklch(45% 0.12 80)`   |

#### Search Dropdown (index.css:88-97)

| CSS Variable                   | oklch Value            |
| ------------------------------ | ---------------------- |
| `--search-highlight`           | `oklch(93% 0.14 95)`   |
| `--search-icon-bg-from`        | `oklch(97% 0.01 90)`   |
| `--search-icon-bg-to`          | `oklch(94% 0.03 90)`   |
| `--search-icon-fg`             | `oklch(55% 0.15 85)`   |
| `--search-badge-weight-border` | `oklch(88% 0.005 264)` |
| `--search-badge-weight-bg`     | `oklch(96% 0.003 264)` |
| `--search-badge-weight-text`   | `oklch(50% 0.015 264)` |
| `--search-badge-mrp-border`    | `oklch(85% 0.06 70)`   |
| `--search-badge-mrp-bg`        | `oklch(95% 0.03 80)`   |
| `--search-badge-mrp-text`      | `oklch(48% 0.12 55)`   |

#### Invoice Template (index.css:100-105)

| CSS Variable                | oklch Value           |
| --------------------------- | --------------------- |
| `--invoice-bg`              | `oklch(100% 0 0)`     |
| `--invoice-text`            | `oklch(20% 0.02 260)` |
| `--invoice-text-muted`      | `oklch(45% 0.02 260)` |
| `--invoice-accent`          | `oklch(55% 0.12 160)` |
| `--invoice-border`          | `oklch(90% 0.01 260)` |
| `--invoice-table-header-bg` | `oklch(96% 0.01 260)` |

---

## 7. Dark Mode

### 7.1 `.dark` Class Variant

**File:** `index.css:4`

```css
@custom-variant dark (&:is(.dark *));
```

Dark mode is activated when a parent element has the `.dark` class — a manual toggle. No `prefers-color-scheme` media query is configured.

### 7.2 No Dark-Mode Token Overrides

There are no `:root .dark {}` or `.dark {}` CSS blocks in `index.css`. None of the 53 CSS variables defined at `index.css:22-105` are remapped for dark mode. The current token values are light-theme-only.

### 7.3 No Toggle Mechanism

There is no UI toggle, no store state, no IPC handler, and no DOM manipulation that applies the `.dark` class to the document. Dark mode is defined as a variant but cannot be activated by the user.

### 7.4 Existing `dark:` Variant Usage

Components that use `dark:` variants (these will not apply until `.dark` is added to a parent element):

- `features/customers/CustomerTypeColor.tsx:5,7,9,11` — dark-mode badge colors for customer types
- `features/productDialog/ProductHistoryTimeline.tsx:28` — dark-mode emerald text color
- `components/Sidebar.tsx:323` — `dark:hover:bg-white/5` on resize handle
- Various shadcn/ui components (button, dialog, alert-dialog, etc.) — auto-generated dark variants

---

## 8. Typography

### 8.1 No Defined Type Scale

**File:** `index.css:126-219` — `@theme inline` block

The `@theme inline` block defines:

- 3 font families: `--font-sans`, `--font-serif`, `--font-roboto`
- ~40 color tokens
- 4 radius tokens
- 8 shadow tokens

There are **zero** font-size tokens (`--text-*`), font-weight tokens (`--font-weight-*`), line-height tokens (`--leading-*`), or letter-spacing tokens (`--tracking-*`). The entire type system relies on Tailwind's default 12-step scale (`text-xs` through `text-9xl`) plus the 43 arbitrary `text-[...]` values documented in Section 4.1.

### 8.2 Font Weight Inconsistency (Same Semantic Role, Different Weights)

**Section headings / card titles:**

- `CardTitle` shadcn base: `font-semibold` + `leading-none`
- `PdfInvoicePage.tsx:73`: `font-bold` on store name
- `SettingsSections.tsx:36`: `font-semibold` on section labels

**Metric values / large numbers:**

- `MetricCard.tsx:58`: `font-semibold`
- `Dashboard.tsx:29`: `font-bold`
- `ProductEditForm.tsx:318`: `font-black` on price display
- `ProductListItem.tsx:125`: `font-bold` on price
- `ProductViewMode.tsx:59`: `font-extrabold` on price

**Button text:**

- `button.tsx` (shadcn base): `font-medium`
- Frequently overridden with `font-semibold` in feature components

**Nav / sidebar text:**

- `Sidebar.tsx:224`: `font-semibold` on brand name
- `Sidebar.tsx:282`: `font-medium` on nav links (overridden to `font-semibold` when active)
- `BillingTabBar.tsx`: `font-semibold` on tab buttons

### 8.3 `!important` Typography Overrides

Indicates CSS specificity conflicts:

- `features/products/ProductHeader.tsx:72` — `text-2xl!` on page title
- `features/billing/BillingHeader.tsx:255,262` — `text-lg!` on dropdown menu items

### 8.4 Font Loading

- **Inter**: `@font-face` declared with `font-weight: 100 900` (variable weight). `.ttf` file exists.
- **Roboto**: `@font-face` declared with `font-weight: 100 900` (variable weight). `.ttf` file exists.
- **Merriweather**: Declared as `--font-serif` value, no `@font-face` exists, no `.ttf` file on disk. (Bug — see 1.2.)
- **Inter Italic**: `.ttf` file exists but no `@font-face` declaration. (Bug — see 1.3.)
- **Roboto Italic**: `.ttf` file exists but no `@font-face` declaration. (Bug — see 1.3.)
- **`font-mono`**: Not explicitly declared in `@theme`. Falls through to Tailwind's default monospace stack.

---

## 9. Shadow System

### 9.1 Defined Shadow Tokens

**File:** `index.css:108-121`

| Token          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| `--shadow-2xs` | `0px 4px 8px -1px hsl(0 0% 0% / 0.05)`                                      |
| `--shadow-xs`  | `0px 4px 8px -1px hsl(0 0% 0% / 0.05)` (identical to 2xs)                   |
| `--shadow-sm`  | `0px 4px 8px -1px hsl(0 0% 0% / 0.1), 0px 1px 2px -2px hsl(0 0% 0% / 0.1)`  |
| `--shadow`     | identical to `--shadow-sm`                                                  |
| `--shadow-md`  | `0px 4px 8px -1px hsl(0 0% 0% / 0.1), 0px 2px 4px -2px hsl(0 0% 0% / 0.1)`  |
| `--shadow-lg`  | `0px 4px 8px -1px hsl(0 0% 0% / 0.1), 0px 4px 6px -2px hsl(0 0% 0% / 0.1)`  |
| `--shadow-xl`  | `0px 4px 8px -1px hsl(0 0% 0% / 0.1), 0px 8px 10px -2px hsl(0 0% 0% / 0.1)` |
| `--shadow-2xl` | `0px 4px 8px -1px hsl(0 0% 0% / 0.25)`                                      |

Observations:

- `--shadow-2xs` and `--shadow-xs` produce identical output.
- `--shadow` and `--shadow-sm` produce identical output.
- All values use `hsl(0 0% 0%)` for shadow color instead of referencing `--shadow-color`.
- The shadow tokens are wired into `@theme inline` (lines 211-218) but use `hsl()` format while the main palette uses `oklch()`.

### 9.2 Shadow Tokens Not Wired to Tailwind's Default Shadow Scale

The `@theme inline` block maps the 8 custom shadow tokens (lines 211-218), but components that use `shadow-sm`, `shadow-md`, `shadow-lg` etc. will get Tailwind's built-in shadow values, not the custom ones — because Tailwind's default `--shadow-*` tokens take precedence over custom ones unless explicitly overridden. The custom `--shadow-*` tokens are mapped as color-like named tokens, not as overrides of Tailwind's built-in shadow scale.

---

## 10. Motion & Animation

### 10.1 Library Usage

- `motion/react` (`motion.div`, `motion.button`, `motion.span`) used in:
  - `Sidebar.tsx` (nav hover, sidebar enter/exit, brand hover)
  - `AppShell.tsx` (sidebar toggle button, sidebar enter/exit)
  - `OnboardingStepper.tsx` (step indicator animate)
  - `OnboardingComplete.tsx` (confetti-like rings, stagger entrance)
- `tw-animate-css` provides shadcn animation utilities (`animate-in`, `fade-in`, `slide-in`, etc.)

### 10.2 Shared Easing Curve

A consistent cubic-bezier is used across most transitions: `[0.23, 1, 0.32, 1]` — an ease-out-quad curve. This appears in:

- `Sidebar.tsx:272,304` (nav hover, store card hover)
- `AppShell.tsx:79` (sidebar toggle)
- `OnboardingStepper.tsx:41,69` (step animations)
- `OnboardingComplete.tsx:33,66,79,119` (stagger entrance)

### 10.3 No `prefers-reduced-motion` Support

The string `prefers-reduced-motion` appears zero times in any `.tsx`, `.ts`, or `.css` file under the renderer. Users with motion sensitivity get all animations at full intensity.

---

## 11. Scrollbar Styles

**File:** `index.css:222-235`

Two hex colors in `@layer base`:

```css
::-webkit-scrollbar-track {
  background-color: #e5e7eb; /* Tailwind gray-200 */
}
::-webkit-scrollbar-thumb {
  background-color: #9ca3af; /* Tailwind gray-400 */
}
```

Neither value references a CSS variable. No Firefox `scrollbar-color` or `scrollbar-width` equivalent is defined — the styling is webkit-only.

---

## 12. Spacing & Layout Patterns

### 12.1 Arbitrary Height for Header (`h-18.25`)

Used in two files with different components:

- `Sidebar.tsx:209` — sidebar brand area height
- `AppShell.tsx:72` — header bar height

Value is 4.5625rem (73px). Not a multiple of `--spacing` (0.25rem).

### 12.2 Search Icon Size (`h-4.5 w-4.5`)

**File:** `AppShell.tsx:96-97`

Value is 1.125rem (18px). Not on the Tailwind spacing scale.

### 12.3 Sidebar Nav Link Sizing

**File:** `Sidebar.tsx`

- Nav link text: `text-[1.05rem]` (line 282)
- Nav link title: `text-lg` (line 291)
- SVG icon: `[&_svg]:h-[1.35rem] [&_svg]:w-[1.35rem]` (line 288)

Breadcrumb icon size differs from text size but both are arbitrary.

### 12.4 Sidebar Width Constants

**File:** `Sidebar.tsx:11-13`

```ts
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 288;
```

Hardcoded as JS constants, not CSS variables, not related to the `--spacing` scale.

---

## 13. Access Tokens With No Semantic Pair

### 13.1 `--warning` Absent

The class `text-warning` is used at `LineItemsTable.tsx:108` but `--warning` and `--warning-foreground` are not defined anywhere. The design system has `--success`/`--success-foreground` and `--destructive`/`--destructive-foreground` but no equivalent for warning/attention state.

### 13.2 `--info` Absent

The application does not define a blue/info semantic color token. Components like `BillingSaveStatus.tsx` use raw `bg-blue-500/15 text-blue-400` for "saving" status instead.

### 13.3 `--borderprimary` Exists But Is Barely Used

Defined at `index.css:53` and wired into `@theme inline:160` as `border-borderprimary`. An `rg` search across the entire renderer finds it only in the definition — no component references `border-borderprimary`.

### 13.4 `--background-secondary` Exists But Is Barely Used

Defined at `index.css:28` and wired as `bg-background-secondary`. Not referenced by any component.

### 13.5 `--sidebar-primary` Uses Purple But Sidebar Uses Amber

`--sidebar-primary` = `oklch(0.5854 0.2041 277.1173)` (purple-blue). The sidebar UI uses `--primary` (amber) for its "New Sale" button. The purple is never applied in sidebar elements.

---

## 14. Palette Overview

### 14.1 Color Families in the Design System

| Family                 | Key Token                                         | oklch Value                       | Visual                   |
| ---------------------- | ------------------------------------------------- | --------------------------------- | ------------------------ |
| Amber/Yellow (primary) | `--primary`                                       | `oklch(87.67% 0.165 90.15)`       | Warm golden              |
| Blue-gray              | `--foreground`                                    | `oklch(0.2795 0.0368 260.031)`    | Dark text                |
| Cool gray              | `--muted`, `--secondary`, `--accent`, `--sidebar` | various near-achromatic blue-gray | Muted surfaces           |
| Green                  | `--success`                                       | `oklch(69.72% 0.209 145.47)`      | Success/active           |
| Red                    | `--destructive`                                   | `oklch(64.69% 0.238 29.23)`       | Error/delete             |
| Green (invoice)        | `--invoice-accent`                                | `oklch(55% 0.12 160)`             | Invoice accent           |
| Purple (sidebar)       | `--sidebar-primary`                               | `oklch(0.5854 0.2041 277.1173)`   | Sidebar primary (unused) |

### 14.2 Color Families Used But Not Tokened

Colors that appear in components via raw Tailwind utilities (Section 3) but have no corresponding semantic design token:

| Color          | Used For                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| Blue           | Estimate tabs, "Saving" status, Account customer type                      |
| Purple         | Customer avatars, Hotel customer type                                      |
| Orange/Slate   | Product badges (weight, MRP) — separate from `--product-badge-*` tokens    |
| Emerald        | Product edit form active status                                            |
| Amber (raw)    | BillingSaveStatus "Unsaved" status — separate from `--primary`             |
| Red (raw)      | BillingTabBar close button hover, BillingSaveStatus "Error" status         |
| Yellow (raw)   | BillingSkeleton add-row area                                               |
| Green-50 (raw) | BillingSkeleton preview border                                             |
| Gray (raw)     | BillingSkeleton (30+ occurrences), empty states, sidebar, customer sidebar |

---

## 15. Chart-Only Color Definitions

Two chart components define their own palettes independent of the design system:

### 15.1 SalesEstimatesChart

**File:** `features/dashboard/SalesEstimatesChart.tsx:19-28`

| Data Series | JS Object Color     | Bar Fill             | Legend Dot          |
| ----------- | ------------------- | -------------------- | ------------------- |
| Sales       | `#3b82f6` (line 22) | `#1b82f6` (line 116) | `#3b82f6` (line 54) |
| Estimates   | `#10b981` (line 26) | `#10b981` (line 117) | `#10b983` (line 59) |

### 15.2 TopProductsChart

**File:** `features/dashboard/TopProductsChart.tsx:11-17`

Five `hsl()` values used as pie slice colors. No fallback for more than 5 products (will cycle through the same colors via recharts, but no error-handling or palette extension logic).

---

## 16. Summary Statistics

| Category                                   | Unique Findings    | Files Involved  |
| ------------------------------------------ | ------------------ | --------------- |
| Bug-level issues                           | 5                  | 6               |
| Inline hardcoded colors (oklch/hsl/hex)    | 18 value instances | 5               |
| Raw Tailwind color utilities               | 96 class usages    | 26              |
| Arbitrary Tailwind values                  | 73                 | 22              |
| Non-standard spacing                       | 9                  | 5               |
| Design tokens defined                      | 53                 | 1 (`index.css`) |
| Design tokens not referenced by components | 3 tokens           | —               |
| Undefined tokens referenced                | 1 (`text-warning`) | 1               |
| Dark mode CSS overrides                    | 0                  | —               |
| Font files on disk but not declared        | 2                  | —               |
| Declared fonts not on disk                 | 1 (Merriweather)   | —               |
| `prefers-reduced-motion` support           | 0                  | —               |
