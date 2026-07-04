# Linear Light Product — Billing Migration Guide

## Overview

Migrate QuickCart from the current amber/saffron design system to a **Linear.app product light mode** aesthetic, tuned for a desktop billing workstation at 1366×768.

### Why Linear for Billing

| Property | Rationale |
|---|---|
| Warm canvas (`#F6F5F3`) | Reduces eye fatigue under fluorescent shop lighting, less sterile than pure white |
| Single accent (lavender `#5E6AD2`) | Visual calm — the operator's attention goes to prices and status, not chrome color |
| Dim sidebar | Content area dominates; navigation recedes — correct for bill creation where the table is primary |
| Dense, information-rich layout | Matches billing's need to show many line items at once on 768px vertical |
| Content-first philosophy | Chrome is minimal; the data is the protagonist |

### What Stays vs What Changes

| Layer | Stays (current) | Changes (new) |
|---|---|---|
| Sizing/spacing | 1366×768 baseline, 4px grid | None — already correct |
| Font (Inter) | Already loaded, weights 100–900 | Add Inter Display for headings (optional subset), bump body weight to 500 |
| Color palette | Amber primary, cool-gray surfaces | Warm canvas, lavender accent, warm-gray surface ladder |
| Shadows | Layered `rgba()` system | Keep structure, tune values slightly |
| Typography scale | Standardized tokens | Minor adjustment: 14px body, 12px captions |
| Dark mode | Removed | Stays removed |
| Semantic tokens | `--success`, `--warning`, `--info`, `--destructive` | Tuned for warmer background but same functional roles |
| Component className | All already using semantic tokens | **Zero className changes in components** — this is a pure CSS variable swap |

---

## Token Migration: `index.css` `:root` Block

### Complete Replacement

Replace the entire `:root { ... }` block in `apps/desktop/src/renderer/src/index.css` with:

```css
:root {
  --font-sans: "Inter", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-roboto: "Roboto", sans-serif;

  /* ── Surface Ladder ── */
  --canvas: #F6F5F3;                    /* warm off-white page background */
  --surface-1: #EEECEA;                 /* cards, content panels */
  --surface-2: #E5E3E0;                 /* elevated cards, hover rows, selected nav */
  --surface-3: #DCDAD7;                 /* sub-nav, dropdowns, sidebar */
  --surface-4: #D0CECB;                 /* deepest elevated surface */

  /* ── Hairline Borders ── */
  --hairline: #E2E0DD;                  /* default card/divider borders */
  --hairline-strong: #CBC9C5;           /* input outlines, selected card borders */
  --hairline-tertiary: #F0EFED;         /* nested surface borders */

  /* ── Text ── */
  --ink: #1A1C1E;                       /* headlines, body text — dark charcoal */
  --ink-muted: #4D5055;                 /* secondary text, meta, timestamps */
  --ink-subtle: #71747A;                /* placeholder, disabled, deselected */
  --ink-tertiary: #9B9EA4;              /* disabled controls, decorative */

  /* ── Brand & Accent ── */
  --primary: #5E6AD2;                   /* lavender-blue — CTAs, focus, links, brand */
  --primary-hover: #4C58B8;             /* darker lavender — hovered CTAs */
  --primary-focus: #5E69D1;             /* focus ring tint */
  --on-primary: #FFFFFF;                /* text on primary background */

  /* ── Semantic States ── */
  --success: #27A644;                   /* synced, paid, completed */
  --success-foreground: #FFFFFF;
  --warning: #D4A017;                   /* unsaved, pending, attention */
  --warning-foreground: #1A1C1E;
  --destructive: #D32F2F;               /* error, delete, void */
  --destructive-foreground: #FFFFFF;
  --info: #1565C0;                      /* saving, processing, neutral */
  --info-foreground: #FFFFFF;

  /* ── Charts ── */
  --chart-1: #5E6AD2;                   /* primary data series */
  --chart-2: #27A644;                   /* secondary data series */
  --chart-3: hsl(190, 45%, 45%);        /* deep teal */
  --chart-4: hsl(220, 30%, 55%);        /* slate blue */
  --chart-5: hsl(30, 40%, 65%);         /* muted orange */

  /* ── Semantic Token Mapping (backward compat) ── */
  --background: var(--canvas);
  --background-secondary: var(--surface-1);
  --foreground: var(--ink);

  --card: var(--surface-1);
  --card-foreground: var(--ink);

  --popover: var(--surface-1);
  --popover-foreground: var(--ink);

  --secondary: var(--surface-2);
  --secondary-foreground: var(--ink);

  --accent: var(--surface-2);
  --accent-foreground: var(--ink-muted);

  --muted: var(--surface-1);
  --muted-foreground: var(--ink-muted);

  --border: var(--hairline);
  --borderprimary: var(--primary);
  --input: var(--hairline-strong);

  --sidebar: var(--surface-3);
  --sidebar-foreground: var(--ink-muted);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--on-primary);
  --sidebar-accent: var(--surface-2);
  --sidebar-accent-foreground: var(--ink);

  --ring: var(--primary-focus);

  /* ── Domain-Specific Tokens ── */

  /* Onboarding */
  --onboarding-gradient-start: oklch(25% 0.04 264);
  --onboarding-gradient-mid: oklch(18% 0.03 264);
  --onboarding-gradient-end: oklch(12% 0.02 255);
  --onboarding-text-muted: oklch(70% 0.01 264);
  --onboarding-text-footer: oklch(45% 0.01 264);
  --onboarding-icon-bg: color-mix(in oklch, var(--primary) 15%, transparent);
  --onboarding-feature-text: oklch(80% 0.01 264);
  --onboarding-icon-dark: var(--primary-hover);

  /* Product Dialog */
  --product-label: var(--ink-muted);
  --product-value: var(--ink);
  --product-surface: var(--surface-1);
  --product-surface-hover: var(--surface-2);
  --product-divider: var(--hairline);
  --product-badge-bg: color-mix(in oklch, var(--primary) 8%, var(--canvas));
  --product-badge-text: var(--primary);

  /* Search Dropdown */
  --search-highlight: color-mix(in oklch, var(--primary) 15%, var(--canvas));
  --search-icon-bg-from: var(--surface-1);
  --search-icon-bg-to: var(--surface-2);
  --search-icon-fg: var(--primary);
  --search-badge-weight-border: var(--hairline);
  --search-badge-weight-bg: var(--surface-1);
  --search-badge-weight-text: var(--ink-muted);
  --search-badge-mrp-border: var(--hairline-strong);
  --search-badge-mrp-bg: var(--warning);
  --search-badge-mrp-text: var(--warning-foreground);

  /* Invoice */
  --invoice-bg: var(--canvas);
  --invoice-text: var(--ink);
  --invoice-text-muted: var(--ink-muted);
  --invoice-accent: var(--primary);
  --invoice-border: var(--hairline);
  --invoice-table-header-bg: var(--surface-1);

  /* ── Shadows (unchanged structure, tuned lightness) ── */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 16px 40px rgba(0, 0, 0, 0.10), 0 6px 12px rgba(0, 0, 0, 0.05);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.12);

  --radius: 0.5rem;
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}
```

### @theme inline Block

**No changes needed.** The `@theme inline` block already maps `--color-*` tokens to `:root` variables. Since we're keeping the same variable names (just changing their values), the inline block requires zero edits.

### @layer base Block

**No changes needed.** Scrollbar colors reference `var(--muted)` and `var(--border)` which are now mapped to the warmer surface palette. The base body already uses `bg-background text-foreground`.

### @font-face Block

**No changes needed.** Inter and Roboto (with italics) are already declared with `font-display: swap`.

---

## Type Scale Adjustment

### Why

The current base body is 14px (`text-sm`). For a billing workstation viewed from 24-36" under fluorescent lights, minimum readable size is 13px. The type scale holds. One change: bump base to 14px via `body { font-size: 14px; }`.

Add to `@layer base` after `body`:

```css
body {
  @apply bg-background text-foreground;
  font-size: 14px;
  font-weight: 500;
}
```

This sets Inter at weight 500 across the app — critical for low-DPI readability. The `font-size: 14px` gives a 14px base without touching the `text-sm`/`text-base` scale.

### No Arbitrary Type Scale Tokens

We do **not** add `--text-*` CSS variables. Tailwind's text scale suffices:

| Class | Size | Use |
|---|---|---|
| `text-xs` | 12px | Captions, status pills, footer columns |
| `text-sm` | 14px | Body, table cells, secondary info |
| `text-base` | 16px | Emphasized body, nav items, button labels |
| `text-lg` | 18px | Prices, section headers, totals |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | Dashboard metrics, primary header titles |
| `text-3xl` | 30px | Product detail title |
| `text-4xl` | 36px | Hero (onboarding) |

---

## Component Migration: File-by-File Order

**Critical: zero className changes in 95% of components.** Since all component classes already use semantic token names (`text-foreground`, `bg-muted`, `border-border`, etc.), changing the token VALUES is sufficient. Only a few files need class-level adjustments.

### Phase 1: CSS Variable Swap (1 file, 5 minutes)

**File:** `apps/desktop/src/renderer/src/index.css`

Replace the entire `:root { ... }` block with the token block above. Add `font-size: 14px; font-weight: 500;` to the `body` rule in `@layer base`.

**Verification:** Reload the app. Every surface, text, border, and button should now use the Linear palette. The sidebar is dimmer. Primary buttons are lavender. The canvas is warm. If colors look wrong, the token mappings in `@theme inline` are incorrect — not the component className.

### Phase 2: Component-Specific Adjustments (~8 files, 30 minutes)

These files have hardcoded values that were NOT migrated to semantic tokens in the previous pass. They need manual adjustment.

#### 2.1 Sidebar.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 198 | `bg-sidebar` | (stays) | Token now resolves to `var(--surface-3)` — dimmer than canvas |
| 306 | `bg-background/80` | `bg-surface-2/80` | Store card should use surface lift, not background |

#### 2.2 AppShell.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 68 | `bg-background/95` | (stays) | Header blends with canvas |
| 96 | `bg-muted/40` | `bg-muted/60` | Search bar needs more contrast against new canvas |

#### 2.3 LineItemsTable.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 74 | `bg-background/95` | `bg-background` | Table container is a card — full canvas background |
| 75 | `bg-background/95` | `bg-muted/60` | Toolbar strip needs subtle differentiation |

#### 2.4 LineItemRow.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 53 | `hover:border-border` | (stays) | Fine as-is |
| 96 | `bg-muted/30` | `bg-muted/60` | Qty control background needs contrast |
| 186 | `bg-muted/25` | `bg-muted/40` | Amount display background |

#### 2.5 BillingHeader.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 170 | `bg-card border-border/60` | (stays) | Header card is fine |

#### 2.6 BillingPage.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 125 | `bg-background-secondary` | (stays) | Token now resolves to `var(--surface-1)` |

#### 2.7 BillingTab.tsx

| Line | Current | Change | Reason |
|---|---|---|---|
| 47 | `bg-background-secondary` | `bg-surface-1` | Active tab uses surface lift |

#### 2.8 OnboardingStepper.tsx

Inline `animate` prop oklch values (lines 30-39, 56). These are JavaScript objects and can't reference CSS variables directly. Two options:

**Option A (recommended):** Replace with a shared constant object at the top of the file:
```tsx
const STEP_COLORS = {
  completed: "oklch(69.72% 0.209 145.47)",
  active: "#5E6AD2",
  inactive: "#EEECEA",
  activeBorder: "#5E69D1",
  inactiveBorder: "#E2E0DD",
  activeText: "#1A1C1E",
  inactiveText: "#71747A"
};
```

**Option B:** Keep current values but sync them to the new palette (replace amber with lavender).

---

## What Should NOT Be Changed

| File/Component | Reason |
|---|---|
| Print/demo pages (`DemoReceipts.tsx`, `PdfInvoicePage.tsx`) | Thermal print formatting uses its own dimensions and colors — these are output, not UI chrome |
| Shadcn-generated `components/ui/*` | Auto-generated; touch only if a specific bug appears |
| `canvasBackground` in `productImageCrop.ts` | JS canvas API constant, not a CSS reference |
| Onboarding gradient colors | Dark-themed onboarding flow, intentionally dark regardless of main UI theme |
| Invoice template tokens | Self-contained for PDF generation |

---

## Verification Checklist

After Phase 1 (CSS swap), verify:

- [ ] Page background is warm off-white (`#F6F5F3`), not the previous cool off-white
- [ ] Sidebar is visibly dimmer than the content area
- [ ] Primary buttons are lavender (`#5E6AD2`), not amber
- [ ] Text is dark charcoal (`#1A1C1E`), body appears at weight 500
- [ ] Cards have 1px hairline borders with subtle shadows
- [ ] Success (green), warning (amber-orange), destructive (red), info (blue) states are all visible
- [ ] Onboarding screens work correctly
- [ ] Billing table rows are readable at 1366×768
- [ ] Dashboard charts render with correct colors
- [ ] Search dropdown renders correctly

After Phase 2 (component adjustments):

- [ ] Toolbar strips and secondary surfaces have correct contrast
- [ ] Qty controls and amount displays are differentiated from the row background
- [ ] Store card in sidebar uses surface lift
- [ ] Active tab indicator uses surface lift

---

## Rollback Plan

The current `index.css` `:root` block is documented here. To roll back, restore the `:root` block from the git history of this file. No component className changes are destructive — they're opacity/background tweaks that work with either palette.

**Simplest rollback:** `git checkout -- apps/desktop/src/renderer/src/index.css`

---

## Notes

- **`color-mix()` usage in product/search tokens**: The `color-mix(in oklch, var(--primary) 8%, var(--canvas))` syntax is supported in Chromium 111+ (the Electron version in use). If it causes issues, replace with hardcoded hex approximations.
- **Sidebar text contrast**: Active nav items use `--ink` (`#1A1C1E`) for text. If contrast feels low against `--surface-2`, bump sidebar-accent-foreground to `--ink`.
- **Warning color on warm canvas**: The warning amber (`#D4A017`) may appear muted against the warm canvas. If "unsaved changes" indicators aren't visible enough, increase chroma or switch to a slightly more saturated orange.
- **Future dark mode**: If dark mode is ever added, define it as a separate `.dark` block in `index.css` with its own surface/text ladder. The token architecture supports it — just add the overrides.
