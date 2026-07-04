# Design System C: Modern Monochrome

**Slate + System UI · Minimal, typography-driven, near-achromatic.**

Color is reserved for actions and status only. Everything else is grayscale — surfaces, text, borders, charts. The typography scale and spacing do the heavy lifting. This reduces visual noise during repetitive billing tasks where color would be a distraction, not a help. The system font stack means zero font loading overhead and a native feel on every platform.

## Font: System UI Stack

```
system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

No custom font files. Instant render. Native look and feel on Windows (`Segoe UI`), macOS (`-apple-system`), and Linux (varies by distro). The trade-off is slightly less typographic personality — but for a billing tool, that's a feature.

---

## Core Palette

Every surface, text, and border is from the same cool-slate family. Color only appears in semantic states and charts.

### Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--background` | `oklch(0.985 0.002 264)` | `bg-background` | Page — near-white with cool cast |
| `--foreground` | `oklch(0.22 0.03 264)` | `text-foreground` | Body text — dark slate |
| `--card` | `oklch(1 0 0)` | `bg-card` | Card — pure white |
| `--card-foreground` | `oklch(0.22 0.03 264)` | `text-card-foreground` | Text on cards |
| `--popover` | `oklch(1 0 0)` | `bg-popover` | Popover surface |
| `--popover-foreground` | `oklch(0.22 0.03 264)` | `text-popover-foreground` | Text in popovers |

### Primary / Actions

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--primary` | `oklch(0.28 0.03 260)` | `bg-primary` | Buttons, links — charcoal |
| `--primary-foreground` | `oklch(1 0 0)` | `text-primary-foreground` | Text on primary — white |

### Secondary / Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--secondary` | `oklch(0.94 0.005 264)` | `bg-secondary` | Subtle surface |
| `--secondary-foreground` | `oklch(0.32 0.02 264)` | `text-secondary-foreground` | Text on secondary |
| `--accent` | `oklch(0.50 0.03 264)` | `bg-accent` | Highlight — mid slate |
| `--accent-foreground` | `oklch(1 0 0)` | `text-accent-foreground` | Text on accent |
| `--muted` | `oklch(0.967 0.003 264)` | `bg-muted` | De-emphasized surface |
| `--muted-foreground` | `oklch(0.50 0.02 264)` | `text-muted-foreground` | Secondary text |

### Semantic States

Color is introduced here for functional clarity — the only chromatic tokens in the system.

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--success` | `oklch(0.58 0.16 160)` | `bg-success` | Synced, paid |
| `--success-foreground` | `oklch(1 0 0)` | `text-success-foreground` | Text on success |
| `--warning` | `oklch(0.70 0.16 85)` | `bg-warning` | Unsaved, pending |
| `--warning-foreground` | `oklch(0.22 0.03 264)` | `text-warning-foreground` | Dark text on warning |
| `--destructive` | `oklch(0.52 0.22 27)` | `bg-destructive` | Error, delete |
| `--destructive-foreground` | `oklch(1 0 0)` | `text-destructive-foreground` | Text on destructive |
| `--info` | `oklch(0.55 0.12 240)` | `bg-info` | Saving, processing |
| `--info-foreground` | `oklch(1 0 0)` | `text-info-foreground` | Text on info |

### Borders & Inputs

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--border` | `oklch(0.88 0.008 264)` | `border-border` | Default borders |
| `--input` | `oklch(0.91 0.006 264)` | `border-input` | Form input border |
| `--ring` | `oklch(0.28 0.03 260)` | `ring-ring` | Focus ring — matches primary |

### Sidebar

Unlike Systems A and B, the sidebar shares the page's color family — no dark sidebar. The hierarchy comes from subtle surface shifts, not color contrast.

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--sidebar` | `oklch(0.94 0.005 264)` | `bg-sidebar` | Sidebar — same as secondary |
| `--sidebar-foreground` | `oklch(0.22 0.03 264)` | `text-sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | `oklch(0.28 0.03 260)` | `bg-sidebar-primary` | Active nav — charcoal |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `text-sidebar-primary-foreground` | Text on active nav |
| `--sidebar-accent` | `oklch(0.90 0.005 264)` | `bg-sidebar-accent` | Nav hover |
| `--sidebar-accent-foreground` | `oklch(0.22 0.03 264)` | `text-sidebar-accent-foreground` | Text on hover |

---

## Billing-Specific Tokens

### Sync Status

| Token | Maps to | Status |
|---|---|---|
| `--billing-synced` | `--success` | SYNCED |
| `--billing-saving` | `--info` | SAVING |
| `--billing-dirty` | `--warning` | IS_DIRTY |
| `--billing-error` | `--destructive` | ERROR |

### Customer Type Badges

Subtle, low-saturation tints — badges blend with the monochrome UI.

| Token | Value | Customer role |
|---|---|---|
| `--customer-cash` | `oklch(0.58 0.16 160)` | Cash |
| `--customer-cash-foreground` | `oklch(0.29 0.08 160)` | |
| `--customer-account` | `oklch(0.55 0.12 240)` | Account |
| `--customer-account-foreground` | `oklch(0.28 0.06 240)` | |
| `--customer-hotel` | `oklch(0.55 0.10 310)` | Hotel |
| `--customer-hotel-foreground` | `oklch(0.28 0.05 310)` | |

### Product States

| Token | Value | State |
|---|---|---|
| `--product-active` | `oklch(0.58 0.16 160)` | Active |
| `--product-inactive` | `oklch(0.50 0.02 264)` | Disabled — monochrome |
| `--product-low-stock` | `oklch(0.70 0.16 85)` | Low stock |

### Transaction Types

| Token | Maps to | Type |
|---|---|---|
| `--txn-sale` | `--primary` | Sale — charcoal text |
| `--txn-estimate` | `--muted-foreground` | Estimate — muted slate |

---

## Chart Palette

Only 2 of 6 chart swatches are truly chromatic. The rest are slate variants — charts feel like part of the UI, not decoration.

| Token | Value | Hex approx | Use |
|---|---|---|---|
| `--chart-1` | `oklch(0.28 0.03 260)` | `#3b3d45` | Sales bars, slice 1 — charcoal |
| `--chart-2` | `oklch(0.58 0.16 160)` | `#108a50` | Estimates bars, slice 2 — muted green |
| `--chart-3` | `oklch(0.50 0.02 264)` | `#727786` | Slice 3 — mid slate |
| `--chart-4` | `oklch(0.35 0.02 264)` | `#4a4e58` | Slice 4 — dark slate |
| `--chart-5` | `oklch(0.60 0.02 264)` | `#9197a3` | Slice 5 — light slate |
| `--chart-6` | `oklch(0.70 0.16 85)` | `#c48a10` | Slice 6 — muted amber (as accent) |

---

## Domain Tokens

### Onboarding (dark flow)

Even onboarding is desaturated — dark slate gradient, not deep indigo.

| Token | Value | Role |
|---|---|---|
| `--onboarding-bg-start` | `oklch(0.22 0.02 264)` | Gradient start |
| `--onboarding-bg-mid` | `oklch(0.16 0.015 264)` | Gradient mid |
| `--onboarding-bg-end` | `oklch(0.10 0.01 255)` | Gradient end |
| `--onboarding-text` | `oklch(0.90 0.005 264)` | Primary text on dark |
| `--onboarding-text-muted` | `oklch(0.60 0.01 264)` | Muted text on dark |
| `--onboarding-icon` | `oklch(0.55 0.02 264)` | Icon accent — mid slate |

### Product Dialog

| Token | Value | Role |
|---|---|---|
| `--product-label` | `oklch(0.48 0.015 264)` | Field labels |
| `--product-value` | `oklch(0.22 0.03 264)` | Field values |
| `--product-surface` | `oklch(0.97 0.003 264)` | Info block bg |
| `--product-surface-hover` | `oklch(0.95 0.005 264)` | Info block hover |
| `--product-divider` | `oklch(0.90 0.005 264)` | Section divider |
| `--product-badge-bg` | `oklch(0.94 0.003 264)` | Badge bg |
| `--product-badge-text` | `oklch(0.48 0.02 264)` | Badge text |

### Search Dropdown

| Token | Value | Role |
|---|---|---|
| `--search-highlight` | `oklch(0.93 0.03 264)` | Match highlight — subtle |
| `--search-icon-bg-from` | `oklch(0.97 0.005 264)` | Icon gradient start |
| `--search-icon-bg-to` | `oklch(0.94 0.008 264)` | Icon gradient end |
| `--search-icon-fg` | `oklch(0.55 0.02 264)` | Icon foreground |
| `--search-badge-weight-border` | `oklch(0.88 0.005 264)` | Weight badge border |
| `--search-badge-weight-bg` | `oklch(0.96 0.003 264)` | Weight badge bg |
| `--search-badge-weight-text` | `oklch(0.50 0.015 264)` | Weight badge text |
| `--search-badge-mrp-border` | `oklch(0.85 0.02 70)` | MRP badge border |
| `--search-badge-mrp-bg` | `oklch(0.95 0.01 80)` | MRP badge bg |
| `--search-badge-mrp-text` | `oklch(0.48 0.04 55)` | MRP badge text |

### Invoice (print)

| Token | Value | Role |
|---|---|---|
| `--invoice-bg` | `oklch(1 0 0)` | Invoice paper |
| `--invoice-text` | `oklch(0.20 0.02 264)` | Body text |
| `--invoice-text-muted` | `oklch(0.45 0.02 264)` | Secondary text |
| `--invoice-accent` | `oklch(0.28 0.03 260)` | Accent — charcoal |
| `--invoice-border` | `oklch(0.90 0.01 264)` | Table borders |
| `--invoice-table-header-bg` | `oklch(0.96 0.01 264)` | Table header bg |

---

## Typography Scale

System fonts render slightly larger than Inter at the same `rem` value. Adjusted scale compensates with tighter sizes.

| Token | Size | Line height | Weight | Role |
|---|---|---|---|---|
| `text-xs` | 0.6875rem (11px) | 0.9375rem (15px) | 400 | Captions |
| `text-sm` | 0.75rem (12px) | 1.0625rem (17px) | 400 | Table cells |
| `text-base` | 0.8125rem (13px) | 1.1875rem (19px) | 400 | Body text |
| `text-lg` | 0.9375rem (15px) | 1.375rem (22px) | 500 | Emphasized body, nav |
| `text-xl` | 1.0625rem (17px) | 1.5rem (24px) | 600 | Section headers |
| `text-2xl` | 1.1875rem (19px) | 1.625rem (26px) | 600 | Card titles |
| `text-3xl` | 1.375rem (22px) | 1.75rem (28px) | 600 | Page titles |
| `text-4xl` | 1.75rem (28px) | 2.125rem (34px) | 700 | Metrics |
| `text-5xl` | 2.125rem (34px) | 2.5rem (40px) | 700 | Hero numbers |

System fonts also feel heavier — use `500` where Inter uses `600`, and `600` where Inter uses `700`.

---

## Shadows

Slightly harder edges — monochrome surfaces need clearer depth cues.

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.06)` |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.1), 0 1px 2px oklch(0 0 0 / 0.06)` |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.1), 0 2px 4px oklch(0 0 0 / 0.06)` |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.1), 0 4px 6px oklch(0 0 0 / 0.05)` |
| `--shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.12), 0 8px 10px oklch(0 0 0 / 0.06)` |
| `--shadow-2xl` | `0 25px 50px oklch(0 0 0 / 0.18)` |

---

## Spacing, Scrollbar, What's Removed, Migration Map

Identical to [System A: Trust & Clarity](./01-trust-clarity.md). Token names are the same across all three systems. The migration map applies universally regardless of which system you select.

## Design Principle

> "Perfect typography is invisible."

In this system, if the UI feels like "just information" rather than "styled information," it's working. The goal is for the shop operator to forget the interface exists and focus entirely on the transaction. Color appears only when it carries functional meaning — everything else is grayscale, letting data do the talking.
