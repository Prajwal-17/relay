# Design System B: Warm Retail

**Saffron + Roboto · Warm, approachable, built for everyday retail.**

Designed for independent shop counters where the operator spends 8+ hours with the screen. The warm amber/saffron primary feels familiar (think: Indian retail signage), reduces eye fatigue under fluorescent shop lighting, and reads as friendly rather than corporate. Roboto's rounded letterforms reinforce the approachable feel.

## Font: Roboto

Roboto has a geometric, open structure with generous apertures — easier to read at a glance on a busy shop counter. Already loaded in the codebase. Variable weight (100-900) gives full expression range. Switch `--font-sans` from `"Inter"` to `"Roboto"`.

---

## Core Palette

### Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--background` | `oklch(0.99 0.004 95)` | `bg-background` | Page — warm off-white |
| `--foreground` | `oklch(0.25 0.025 100)` | `text-foreground` | Body text — warm dark |
| `--card` | `oklch(1 0 0)` | `bg-card` | Card — pure white |
| `--card-foreground` | `oklch(0.25 0.025 100)` | `text-card-foreground` | Text on cards |
| `--popover` | `oklch(1 0 0)` | `bg-popover` | Popover surface |
| `--popover-foreground` | `oklch(0.25 0.025 100)` | `text-popover-foreground` | Text in popovers |

### Primary / Actions

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--primary` | `oklch(0.68 0.17 85)` | `bg-primary` | Buttons, links — rich saffron |
| `--primary-foreground` | `oklch(1 0 0)` | `text-primary-foreground` | Text on primary — white |

### Secondary / Surfaces

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--secondary` | `oklch(0.95 0.008 90)` | `bg-secondary` | Subtle surface |
| `--secondary-foreground` | `oklch(0.35 0.018 100)` | `text-secondary-foreground` | Text on secondary |
| `--accent` | `oklch(0.56 0.19 40)` | `bg-accent` | Highlight — terracotta |
| `--accent-foreground` | `oklch(1 0 0)` | `text-accent-foreground` | Text on accent |
| `--muted` | `oklch(0.97 0.004 100)` | `bg-muted` | De-emphasized surface |
| `--muted-foreground` | `oklch(0.52 0.02 100)` | `text-muted-foreground` | Secondary text |

### Semantic States

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--success` | `oklch(0.56 0.19 145)` | `bg-success` | Synced, paid, completed |
| `--success-foreground` | `oklch(1 0 0)` | `text-success-foreground` | Text on success |
| `--warning` | `oklch(0.68 0.19 65)` | `bg-warning` | Unsaved, pending — deep orange |
| `--warning-foreground` | `oklch(0.25 0.025 100)` | `text-warning-foreground` | Dark text on warning |
| `--destructive` | `oklch(0.56 0.23 25)` | `bg-destructive` | Error, delete — warm red |
| `--destructive-foreground` | `oklch(1 0 0)` | `text-destructive-foreground` | Text on destructive |
| `--info` | `oklch(0.56 0.15 200)` | `bg-info` | Saving, processing — teal |
| `--info-foreground` | `oklch(1 0 0)` | `text-info-foreground` | Text on info |

### Borders & Inputs

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--border` | `oklch(0.88 0.01 95)` | `border-border` | Default borders |
| `--input` | `oklch(0.91 0.008 95)` | `border-input` | Form input border |
| `--ring` | `oklch(0.68 0.17 85)` | `ring-ring` | Focus ring — matches primary |

### Sidebar

| Token | Value | Tailwind class | Role |
|---|---|---|---|
| `--sidebar` | `oklch(0.26 0.03 95)` | `bg-sidebar` | Sidebar — warm dark |
| `--sidebar-foreground` | `oklch(0.90 0.01 95)` | `text-sidebar-foreground` | Sidebar text — warm light |
| `--sidebar-primary` | `oklch(0.68 0.17 85)` | `bg-sidebar-primary` | Active nav — saffron |
| `--sidebar-primary-foreground` | `oklch(1 0 0)` | `text-sidebar-primary-foreground` | Text on active nav |
| `--sidebar-accent` | `oklch(0.31 0.03 95)` | `bg-sidebar-accent` | Nav hover |
| `--sidebar-accent-foreground` | `oklch(0.94 0.005 95)` | `text-sidebar-accent-foreground` | Text on hover |

---

## Billing-Specific Tokens

### Sync Status

| Token | Maps to | Status |
|---|---|---|
| `--billing-synced` | `--success` | SYNCED |
| `--billing-saving` | `--info` | SAVING |
| `--billing-dirty` | `--warning` | IS_DIRTY |
| `--billing-error` | `--destructive` | ERROR |

(Plus `-foreground` variants for each)

### Customer Type Badges

| Token | Value | Customer role |
|---|---|---|
| `--customer-cash` | `oklch(0.56 0.19 145)` | Cash — leaf green |
| `--customer-cash-foreground` | `oklch(0.28 0.10 145)` | |
| `--customer-account` | `oklch(0.56 0.15 200)` | Account — teal |
| `--customer-account-foreground` | `oklch(0.28 0.08 200)` | |
| `--customer-hotel` | `oklch(0.55 0.16 300)` | Hotel — warm purple |
| `--customer-hotel-foreground` | `oklch(0.28 0.08 300)` | |

### Product States

| Token | Value | State |
|---|---|---|
| `--product-active` | `oklch(0.56 0.19 145)` | Active |
| `--product-inactive` | `oklch(0.52 0.04 80)` | Disabled |
| `--product-low-stock` | `oklch(0.68 0.19 65)` | Low stock |

### Transaction Types

| Token | Maps to | Type |
|---|---|---|
| `--txn-sale` | `--primary` | Sale |
| `--txn-estimate` | `--accent` | Estimate |

---

## Chart Palette

| Token | Value | Hex approx | Use |
|---|---|---|---|
| `--chart-1` | `oklch(0.68 0.17 85)` | `#d4950a` | Sales bars, slice 1 — saffron |
| `--chart-2` | `oklch(0.56 0.19 145)` | `#0e8a4a` | Estimates bars, slice 2 — leaf |
| `--chart-3` | `oklch(0.56 0.19 40)` | `#c95a30` | Slice 3 — terracotta |
| `--chart-4` | `oklch(0.56 0.15 200)` | `#18807a` | Slice 4 — teal |
| `--chart-5` | `oklch(0.55 0.16 300)` | `#7c3eb0` | Slice 5 — plum |
| `--chart-6` | `oklch(0.60 0.08 120)` | `#7a8a30` | Slice 6 — olive |

---

## Domain Tokens

### Onboarding (dark flow)

| Token | Value | Role |
|---|---|---|
| `--onboarding-bg-start` | `oklch(0.25 0.04 85)` | Gradient start — warm dark |
| `--onboarding-bg-mid` | `oklch(0.18 0.03 85)` | Gradient mid |
| `--onboarding-bg-end` | `oklch(0.12 0.02 70)` | Gradient end — darkest |
| `--onboarding-text` | `oklch(0.90 0.01 95)` | Primary text on dark |
| `--onboarding-text-muted` | `oklch(0.65 0.01 95)` | Muted text on dark |
| `--onboarding-icon` | `oklch(0.68 0.17 85)` | Icon accent — saffron |

### Product Dialog

| Token | Value | Role |
|---|---|---|
| `--product-label` | `oklch(0.48 0.015 100)` | Field labels |
| `--product-value` | `oklch(0.25 0.025 100)` | Field values |
| `--product-surface` | `oklch(0.97 0.005 100)` | Info block bg |
| `--product-surface-hover` | `oklch(0.95 0.007 100)` | Info block hover |
| `--product-divider` | `oklch(0.90 0.006 100)` | Section divider |
| `--product-badge-bg` | `oklch(0.94 0.02 90)` | Badge bg — warm tint |
| `--product-badge-text` | `oklch(0.45 0.12 80)` | Badge text |

### Search Dropdown

| Token | Value | Role |
|---|---|---|
| `--search-highlight` | `oklch(0.93 0.08 88)` | Match highlight — warm yellow |
| `--search-icon-bg-from` | `oklch(0.97 0.02 90)` | Icon gradient start |
| `--search-icon-bg-to` | `oklch(0.94 0.04 90)` | Icon gradient end |
| `--search-icon-fg` | `oklch(0.58 0.16 85)` | Icon foreground |
| `--search-badge-weight-border` | `oklch(0.88 0.006 100)` | Weight badge border |
| `--search-badge-weight-bg` | `oklch(0.96 0.004 100)` | Weight badge bg |
| `--search-badge-weight-text` | `oklch(0.50 0.015 100)` | Weight badge text |
| `--search-badge-mrp-border` | `oklch(0.85 0.06 70)` | MRP badge border |
| `--search-badge-mrp-bg` | `oklch(0.95 0.03 80)` | MRP badge bg |
| `--search-badge-mrp-text` | `oklch(0.48 0.12 55)` | MRP badge text |

### Invoice (print)

| Token | Value | Role |
|---|---|---|
| `--invoice-bg` | `oklch(1 0 0)` | Invoice paper |
| `--invoice-text` | `oklch(0.22 0.02 100)` | Body text |
| `--invoice-text-muted` | `oklch(0.45 0.02 100)` | Secondary text |
| `--invoice-accent` | `oklch(0.68 0.17 85)` | Accent — saffron |
| `--invoice-border` | `oklch(0.90 0.01 100)` | Table borders |
| `--invoice-table-header-bg` | `oklch(0.96 0.01 100)` | Table header bg |

---

## Typography Scale

Built on Roboto's rounded letterforms. Slightly looser line heights (Roboto reads better with more breathing room than Inter).

| Token | Size | Line height | Weight | Role |
|---|---|---|---|---|
| `text-xs` | 0.75rem (12px) | 1rem (16px) | 400 | Captions |
| `text-sm` | 0.8125rem (13px) | 1.1875rem (19px) | 400 | Table cells |
| `text-base` | 0.875rem (14px) | 1.375rem (22px) | 400 | Body text |
| `text-lg` | 1rem (16px) | 1.5rem (24px) | 500 | Emphasized body |
| `text-xl` | 1.125rem (18px) | 1.75rem (28px) | 600 | Section headers |
| `text-2xl` | 1.25rem (20px) | 1.75rem (28px) | 600 | Card titles |
| `text-3xl` | 1.5rem (24px) | 2rem (32px) | 600 | Page titles |
| `text-4xl` | 1.875rem (30px) | 2.25rem (36px) | 700 | Dashboard metrics |
| `text-5xl` | 2.25rem (36px) | 2.5rem (40px) | 700 | Hero numbers |

### Font Weights & Letter Spacing

Same as System A. Roboto's `700` feels slightly bolder than Inter's — use `600` where you'd use `700` in Inter for equivalent visual weight.

---

## Shadows

| Token | Value |
|---|---|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.04)` |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.07), 0 1px 2px oklch(0 0 0 / 0.05)` |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.05)` |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.07), 0 4px 6px oklch(0 0 0 / 0.04)` |
| `--shadow-xl` | `0 20px 25px oklch(0 0 0 / 0.09), 0 8px 10px oklch(0 0 0 / 0.05)` |
| `--shadow-2xl` | `0 25px 50px oklch(0 0 0 / 0.12)` |

Slightly softer than System A — matches the warm, approachable tone.

---

## Spacing, Scrollbar, What's Removed, Migration Map

Identical to [System A: Trust & Clarity](./01-trust-clarity.md) sections. The token names are the same across all three systems — only the oklch values differ. The migration map applies universally.
