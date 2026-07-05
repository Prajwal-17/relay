# QuickCart Design System — AI Reference

> **"Bloomberg Terminal meets Linear."** A calm, expensive, dense, desktop-first
> design system for operators issuing hundreds of invoices a day on 1366×768
> 100 PPI TN panel workstations under fluorescent shop lighting. Light mode only.

---

## 1. Elevation Model (E0–E6)

Separation comes from **surface luminance delta + shadow + hairline border** moving together.
Borders whisper; surfaces do the heavy lifting. Never use color to separate surfaces.

| Level | Name    | Surface         | Shadow      | Border            | Use for                                               |
| ----- | ------- | --------------- | ----------- | ----------------- | ----------------------------------------------------- |
| E0    | Canvas  | `bg-background` | _none_      | _none_            | Page background — the "desk"                          |
| E1    | Inline  | transparent     | _none_      | optional hairline | Content sitting directly on canvas                    |
| E2    | Card    | `bg-card`       | `shadow-xs` | `border-border`   | Default container (panels, table wrappers, sections)  |
| E3    | Inset   | `bg-muted`      | _none_      | _none_            | Table headers, skeletons, code blocks, recessed bands |
| E4    | Popover | `bg-popover`    | `shadow-md` | `border-border`   | Dropdown menus, tooltips, search results              |
| E5    | Dialog  | `bg-card`       | `shadow-lg` | `border-border`   | Modal sheets, confirm dialogs                         |
| E6    | Overlay | `bg-popover`    | `shadow-xl` | `border-border`   | Command palette, full-screen overlays                 |

**Rule:** Every elevated container gets exactly ONE surface class, ONE shadow class, and ONE border
class. Never mix surface tokens on the same element (e.g., `bg-card bg-muted` is wrong).

---

## 2. Color Token Reference

All tokens live in `:root` of `apps/desktop/src/renderer/src/index.css`. Never add colors outside
this file. Every token is available as a Tailwind utility (e.g., `bg-primary`, `text-ink`,
`border-hairline-strong`) via the `@theme inline` wiring block.

### 2.1 Surfaces

| Token        | Value                    | Use for                                                             | Do NOT use for                     |
| ------------ | ------------------------ | ------------------------------------------------------------------- | ---------------------------------- |
| `background` | `oklch(0.965 0.003 255)` | Page canvas (E0). Cool, calm, slightly recessed.                    | Cards, popovers, elevated surfaces |
| `card`       | `oklch(0.992 0.002 255)` | Elevated sheets (E2/E5). Cards, dialog bodies.                      | Page background, inset bands       |
| `popover`    | `oklch(0.992 0.002 255)` | Dropdowns, tooltips (E4/E6). Same as card by value, semantic alias. | Page background                    |
| `secondary`  | `oklch(0.94 0.004 255)`  | Neutral fills: secondary buttons, active nav, chip backgrounds.     | Card surfaces                      |
| `muted`      | `oklch(0.955 0.003 255)` | Recessed/inset bands (E3). Table heads, skeletons, code.            | Card surfaces                      |

### 2.2 Text (Ink)

| Token              | Value                   | Use for                                                                           |
| ------------------ | ----------------------- | --------------------------------------------------------------------------------- |
| `foreground`       | `oklch(0.21 0.02 255)`  | Primary text — body, labels, values. **Default ink.**                             |
| `muted-foreground` | `oklch(0.42 0.018 255)` | Secondary text — meta, timestamps, descriptions.                                  |
| — (ink-subtle)     | `oklch(0.52 0.014 255)` | Placeholder, disabled, deselected. Use `text-muted-foreground/60` to approximate. |
| — (ink-tertiary)   | `oklch(0.62 0.012 255)` | Decorative, far-background. Use sparingly.                                        |

**Note:** `ink-subtle` and `ink-tertiary` are defined in `:root` but not wired to Tailwind
utilities. Apply via `text-muted-foreground/60` or a one-off inline token reference if truly needed.

### 2.3 Borders

| Token           | Value                   | Use for                                                  |
| --------------- | ----------------------- | -------------------------------------------------------- |
| `border`        | `oklch(0.87 0.004 255)` | Card edges, table rows, popover boundaries. **Default.** |
| `frame`         | `oklch(0.82 0.005 255)` | Structural edges: sidebar↔content, topbar↔content.       |
| `input`         | `oklch(0.78 0.005 255)` | Input affordances, focused structure. Strongest border.  |
| `borderprimary` | `var(--primary)`        | Primary-tinted border for emphasis (rare).               |

**Rule:** `frame` is for app-chrome separators. `border` is for content-level separators. `input`
is for interactive control edges. Never use `border` on app-chrome or `frame` on a card.

### 2.4 Primary / Brand

| Token                | Value                    | Use for                                          |
| -------------------- | ------------------------ | ------------------------------------------------ |
| `primary`            | `oklch(0.43 0.08 258)`   | CTAs, links, focus rings, active indicators      |
| `primary-foreground` | `#ffffff`                | Text/icons on `bg-primary` surfaces              |
| `primary-hover`      | `oklch(0.37 0.08 258)`   | Hovered/pressed CTA state                        |
| `ring`               | `var(--primary)`         | Focus ring color (solid for keyboard visibility) |
| `accent`             | `oklch(0.958 0.006 258)` | Hover/selected wash — faint primary tint.        |
| `accent-foreground`  | `var(--ink-muted)`       | Text on accent backgrounds                       |

**Key:** `accent` is barely-tinted for hover states that feel "engaged" without screaming
primary. Use `bg-accent` + `text-accent-foreground` for subtle selected rows and hover feedback.

### 2.5 Semantic States

| Token                                    | Value                                | Use for                              |
| ---------------------------------------- | ------------------------------------ | ------------------------------------ |
| `success` / `success-foreground`         | `oklch(0.55 0.12 150)` / `#fff`      | Saved, completed, paid, synced       |
| `warning` / `warning-foreground`         | `oklch(0.72 0.13 70)` / `var(--ink)` | Pending, attention needed            |
| `destructive` / `destructive-foreground` | `oklch(0.52 0.18 25)` / `#fff`       | Failed, deleted, void                |
| `info` / `info-foreground`               | `oklch(0.5 0.13 250)` / `#fff`       | Processing, uploading, informational |

**State badge/indicator pattern:** `bg-<state>/15 text-<state> border-<state>/25` for pills.
`bg-<state> text-<state>-foreground` for solid buttons.

### 2.6 Charts

| Token     | Value                   | Role                                                 |
| --------- | ----------------------- | ---------------------------------------------------- |
| `chart-1` | `oklch(0.48 0.085 258)` | **Lead** — primary slate-indigo. Sales, main metric. |
| `chart-2` | `oklch(0.55 0.09 195)`  | **Contrast** — teal. Estimates, comparison.          |
| `chart-3` | `oklch(0.62 0.085 70)`  | **Warm counter** — amber. Expenses.                  |
| `chart-4` | `oklch(0.55 0.07 150)`  | **Support** — sage. Profit, growth.                  |
| `chart-5` | `oklch(0.5 0.06 230)`   | **Support** — slate-blue. Projections.               |

**Rule:** Charts use ONLY these 5 tokens. No ad-hoc colors. chart-1 is always the primary series.
For multi-series beyond 5, rotate through the list (never add chart-6/7/8 — those were
intentionally removed as dead tokens).

### 2.7 Domain Tokens

Domain tokens are scoped to specific features. They re-wire to the same primitives so they
auto-swap when primitives change. **Never reference primitives directly in a domain component;
use the domain token.**

| Domain     | Tokens                                                                                                                          | Maps to                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Sidebar    | `sidebar`, `sidebar-foreground`, `sidebar-accent`, `sidebar-accent-foreground`, `sidebar-primary`, `sidebar-primary-foreground` | Recessed surface-3 panel       |
| Onboarding | `onboarding-gradient-*`, `onboarding-text-*`, `onboarding-icon-*`                                                               | Dark rail, navy-leaning        |
| Product    | `product-label`, `product-value`, `product-surface`, `product-surface-hover`, `product-divider`, `product-badge-*`              | surface-1/3 + primary tint     |
| Search     | `search-highlight`, `search-icon-*`, `badge-mrp-*` (shared)                                                                     | Primary tint + amber highlight |
| Invoice    | `invoice-bg`, `invoice-text`, `invoice-accent`, `invoice-border`, `invoice-table-header-bg`                                     | surface/semantic re-wiring     |

### 2.8 Badges (MRP vs Weight)

The two badge types MUST be visually distinct — a shop operator scanning a product list needs to
instantly tell "size" from "price":

| Badge  | Shape          | Color                                                      | Font                    |
| ------ | -------------- | ---------------------------------------------------------- | ----------------------- |
| Weight | `rounded-md`   | `border-hairline/60 bg-secondary/50 text-muted-foreground` | `text-xs font-medium`   |
| MRP    | `rounded-full` | `border-primary/30 bg-primary/8 text-primary`              | `text-sm font-semibold` |

Weight = compact gray rectangle (recedes). MRP = primary-tinted pill (stands out). Never swap
these shapes or use the same visual treatment for both.

---

## 3. Typography

### 3.1 Font Stack

```css
font-family: "InterVariable", system-ui, sans-serif;
```

Single variable font file (`InterVariable.woff2`) with weight axis 100–900. No separate
italic/roman files needed. The variable font enables optical sizing; all weights render
cleanly down to ~11px text at 100 PPI.

### 3.2 Weight Strata

```
h1–h4:  font-semibold (600)  ← tightened tracking -0.02em
body:   400                  ← regular weight for long-shift readability
small:  500                  ← absolute floor for legibility on 100 PPI TN
```

**Rationale:** Blanket-medium (weight 500 everything) flattens hierarchy and causes visual
fatigue on long shifts. Regular body (400) lets semibold headings breathe. Small text gets
bumped to 500 because Inter below 500 anti-aliases to mush at 100 PPI.

### 3.3 Typographic Features

| Feature                   | Where                  | Why                                    |
| ------------------------- | ---------------------- | -------------------------------------- |
| `tabular-nums`            | ALL `<table>` elements | Aligns price columns, quantity grids   |
| `font-feature: "cv05" 1`  | Body (global)          | Disambiguates lowercase-L from digit-1 |
| `letter-spacing: -0.02em` | h1–h4                  | Refined "designed" feel                |
| `letter-spacing: 0`       | Body, tables           | Protects dense-table legibility        |

### 3.4 Font Size Scale

Base: `14px` (set on `body`). Derived sizes:

| Utility     | Use for                                  |
| ----------- | ---------------------------------------- |
| `text-xs`   | Captions, badges, fine print             |
| `text-sm`   | Descriptions, meta, secondary labels     |
| `text-base` | Body, nav items, button labels (default) |
| `text-lg`   | Emphasized values, subtotals             |
| `text-xl`   | Page titles, section headers             |
| `text-2xl`  | Prominent totals, hero numbers           |
| `text-3xl`  | Very large display values (rare)         |

Button text default: `text-base` (not `text-sm`). Input text default: `text-base`.

---

## 4. Shadows

Tight, slate-tinted (`rgb(15 23 42)`), negative-spread. Layered pairs give crisp edges —
this reads as a "desktop window," not a floating web card.

| Token        | Value                                                                          | Use for              |
| ------------ | ------------------------------------------------------------------------------ | -------------------- |
| `shadow-xs`  | `0 1px 0 0 rgb(15 23 42 / 0.05)`                                               | Light card lift (E2) |
| `shadow-sm`  | `0 1px 2px 0 rgb(15 23 42 / 0.05), 0 1px 1px 0 rgb(15 23 42 / 0.04)`           | Hovered card         |
| `shadow-md`  | `0 4px 8px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)`     | Popover (E4)         |
| `shadow-lg`  | `0 12px 24px -6px rgb(15 23 42 / 0.1), 0 4px 8px -4px rgb(15 23 42 / 0.06)`    | Dialog (E5)          |
| `shadow-xl`  | `0 20px 40px -8px rgb(15 23 42 / 0.14), 0 8px 16px -6px rgb(15 23 42 / 0.08)`  | Overlay (E6)         |
| `shadow-2xl` | `0 32px 64px -12px rgb(15 23 42 / 0.18), 0 12px 24px -8px rgb(15 23 42 / 0.1)` | Extreme overlay      |

**Rule:** Never write custom `box-shadow` or `shadow-[...]` or `drop-shadow`. Use the token.
Never try to make shadows "pop" — the whole point is they're quiet.

---

## 5. Radius

Single anchor `0.5rem` (8px), stepped offsets compressed at the top to kill "rounded startup" look:

| Token         | Value | Use for                           |
| ------------- | ----- | --------------------------------- |
| `rounded-sm`  | 4px   | Tight containers, inline elements |
| `rounded-md`  | 6px   | Inputs, small badges              |
| `rounded-lg`  | 8px   | Buttons, form controls            |
| `rounded-xl`  | 10px  | Cards, rows, panels               |
| `rounded-2xl` | 12px  | Large cards, modal bodies         |
| `rounded-3xl` | 16px  | Very large containers (rare)      |

**Rule:** Cards and table rows use `rounded-xl` (10px) as default. Inputs use `rounded-lg` (8px).
MRP badges use `rounded-full`. Weight badges use `rounded-md` (4px).

---

## 6. Component Patterns

### 6.1 Shadcn Variants (do NOT edit `components/ui/` files)

| Component | Variant       | Tokens Used                                    | Use for                   |
| --------- | ------------- | ---------------------------------------------- | ------------------------- |
| Button    | `default`     | `bg-primary text-primary-foreground`           | Primary CTAs              |
| Button    | `secondary`   | `bg-secondary text-secondary-foreground`       | Neutral actions           |
| Button    | `outline`     | `border bg-background shadow-xs`               | Peripheral actions        |
| Button    | `ghost`       | `hover:bg-accent hover:text-accent-foreground` | Navigation, icon buttons  |
| Button    | `destructive` | `bg-destructive text-destructive-foreground`   | Delete, void              |
| Badge     | `outline`     | `border text-foreground` (then override)       | Weight badges, MRP badges |

**Sizes:** `default` (h-9), `sm` (h-8), `lg` (h-10). In billing/fast workflows, prefer `default`
or `sm` to preserve row density.

### 6.2 Opacity Modulation Pattern

For inset controls, read-only fields, and disabled states, modulate opacity on the existing
surface tokens rather than introducing new colors:

```
bg-muted/60    → input controls inside a card (qty stepper, date picker)
bg-muted/40    → read-only displays inside a card (calculated amounts)
bg-muted/70    → unchecked toggle buttons
border-border/70 → row-level separators inside a table
border-border/80 → input field borders (slightly stronger than rows)
text-sidebar-foreground/70 → inactive sidebar nav items
text-sidebar-foreground/55 → sidebar meta text
```

**Rule:** Use Tailwind's opacity suffix (`/NN`). Do NOT use `opacity-70` (it affects the whole
element including children). Do NOT use `bg-muted/30` — below 40% is invisible on TN panels.

### 6.3 Billing Table Row Pattern

```tsx
// Row container: grid + card token + subtle border
<div className="grid grid-cols-23 items-center rounded-xl border border-border/70
                bg-card transition-[background-color,border-color,box-shadow] duration-200
                hover:shadow-sm">

// Input: elevated slightly via background, stronger border
<input className="bg-background border-input/80 focus:border-ring focus:ring-ring
                    h-10 rounded-lg border px-3 text-base font-bold
                    shadow-none transition-all focus:ring-2 focus:ring-offset-0" />

// Read-only amount: inset/recessed via muted
<div className="bg-muted/40 border-border/70 rounded-lg border px-3
                text-right text-base font-semibold tabular-nums" />

// Quantity control wrapper: inset
<div className="bg-muted/60 border-border/70 rounded-lg border font-bold" />
```

### 6.4 State Feedback Pattern

```tsx
// Pills / status indicators
<span className="bg-<state>/15 text-<state> border-<state>/25 rounded-full border px-2.5 py-0.5 text-xs font-medium">
  {label}
</span>

// Solid state buttons (check button pattern)
// Checked:   bg-success text-background border-success
// Unchecked: bg-muted/70 text-muted-foreground border-border
```

**Exact opacities per state:**

- `success`: bg/15, text/full, border/25
- `warning`: bg/15, text/full, border/30
- `destructive`: bg/10, text/full, border/25
- `info`: bg/15, text/full, border/25

### 6.5 Motion (motion/react)

| Do                                                  | Don't                             |
| --------------------------------------------------- | --------------------------------- |
| `motion.div` + `AnimatePresence` for row entry/exit | Anything over 200ms               |
| Opacity + height animations only                    | Rotation, bounce, spring effects  |
| `ease: "easeOut"`, `duration: 0.12–0.15`            | `easeInOut` or elastic curves     |
| Staggered fade-in (20ms/item) on initial page load  | Stagger on every filter change    |
| Sidebar hover: `whileHover={{ x: 2 }}` micro-lift   | Scale transforms on data elements |
| Opacity pulse 1.2s for "SAVING" sync status         | Continuous animations             |
| Respect `prefers-reduced-motion: reduce`            | Ignore accessibility preferences  |

### 6.6 Icons

Library: **lucide-react**. Size pattern: `size-4` (16px) for inline icons, `size-5` (20px)
for standalone icons, `size-6` (24px) for large icons. All icons inherit color via
`currentColor` — never set a fill/stroke color directly.

---

## 7. Decision Trees

### 7.1 "I need a container for..."

```
Is it the main page background?
  └─ YES → bg-background (E0 canvas, no border, no shadow)

Is it a standalone card/section floating above the page?
  └─ YES → bg-card border-border shadow-xs rounded-xl (E2 card)

Is it a recessed band inside a card (table header, skeleton)?
  └─ YES → bg-muted rounded-lg (E3 inset, no border, no shadow)

Is it a dropdown, tooltip, or search result popover?
  └─ YES → bg-popover border-border shadow-md rounded-xl (E4 popover)

Is it a modal dialog?
  └─ YES → bg-card border-border shadow-lg rounded-2xl (E5 dialog)

Is it a full-screen overlay / command palette?
  └─ YES → bg-popover border-border shadow-xl rounded-2xl (E6 overlay)
```

### 7.2 "I need text for..."

```
Is it primary content/body/value?
  └─ text-foreground font-normal (400)

Is it a heading?
  └─ text-foreground font-semibold tracking-[-0.02em]

Is it secondary/meta/timestamp/description?
  └─ text-muted-foreground font-normal (400)

Is it a placeholder or disabled?
  └─ text-muted-foreground/60 font-normal (400)

Is it on a dark background (sidebar, primary button)?
  └─ text-sidebar-foreground or text-primary-foreground

Is it text at text-xs size?
  └─ font-weight: 500 minimum (never 400 at xs)
```

### 7.3 "I need a separator/border for..."

```
Is it the edge of a card floating on the page?
  └─ border-border (hairline)

Is it the structural edge between app-chrome regions (sidebar↔content)?
  └─ border-frame (darker than hairline, structural)

Is it the edge of an input field?
  └─ border-input (strongest, clear affordance)

Is it a row separator inside a table?
  └─ border-border/70 (subdued hairline)

Is it a focused/active input?
  └─ border-ring ring-ring/50 ring-2 (focus ring, not just border)
```

---

## 8. Anti-Patterns (DO NOT)

| Never…                                                                      | Because…                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Use raw colors (`#fff`, `rgb()`, `oklch()`) in components                   | Breaks the token contract; design changes require grep across all files            |
| Write inline `style={{ color: ... }}` or `style={{ backgroundColor: ... }}` | Same — tokens must be the single source of truth                                   |
| Use `dark:` prefix on any class                                             | Dark mode was removed. `dark:` classes are dead code.                              |
| Create a new `.css` file                                                    | All design tokens live in ONE file: `index.css`.                                   |
| Edit `components/ui/*` files                                                | Shadcn-generated. Custom variants go in your component, not in ui/.                |
| Use `shadow-[...]` or arbitrary box-shadow                                  | Use `shadow-xs` through `shadow-2xl`.                                              |
| Use arbitrary Tailwind values (`w-[...]`, `text-[...]`, `h-[...]`)          | Use the Tailwind scale or existing token. If you truly need one, justify it.       |
| Use `opacity-70` on a parent to dim children                                | Use Tailwind opacity suffixes (`text-foreground/70`, `bg-muted/60`).               |
| Use `bg-muted/30` or lower                                                  | Invisible on 100 PPI TN panels. 40% is the floor.                                  |
| Add a new chart color beyond chart-5                                        | chart-6/7/8 were intentionally removed. Rotate.                                    |
| Mix multiple surface tokens on one element                                  | `bg-card bg-muted` is a design error. Pick one elevation.                          |
| Use `text-white` or `text-black`                                            | Use `text-primary-foreground`, `text-sidebar-foreground`, or semantic foregrounds. |

---

## 9. Extension Guide

### Adding a new CSS color token

1. Define the primitive in `:root`:
   ```css
   --my-feature-surface: oklch(0.95 0.003 255);
   ```
2. Map it to a semantic name:
   ```css
   --my-feature-bg: var(--my-feature-surface);
   ```
3. Wire it in `@theme inline`:
   ```css
   --color-my-feature-bg: var(--my-feature-bg);
   ```
4. Now `bg-my-feature-bg` works as a Tailwind class.

### Adding a new shadcn component

```bash
npx shadcn@latest add <component-name>
```

It lands in `components/ui/`. Do NOT edit the generated file. If you need custom variants,
extend in your feature component using `cn()` and token classes, or create a wrapper component.

### Adding a new component (feature)

1. Create the file under `features/<name>/`.
2. Use `cn()` for all className merging.
3. Reference ONLY Tailwind token utilities (`bg-card`, `text-foreground`, `border-border`).
4. Use the elevation table (§1) to choose surface + shadow + border.
5. Use the text decision tree (§7.2) to choose ink tokens.
6. Use the motion rules (§6.5) if animating.
7. Never introduce a raw color, inline style, or arbitrary value.

### Modifying the primary accent

Change exactly 4 tokens in `:root`:

```css
--primary: oklch(L C H); /* base */
--primary-hover: oklch(L C H); /* ~6% darker */
--accent: oklch(L C H / 0.06); /* very faint tint for hover/selected */
--chart-1: oklch(L C H); /* sync lead chart color */
```

Then adjust `--sidebar-accent` if it uses a primary-tinted hue. Everything else auto-adapts
because all components reference `var(--primary)` through the token chain.

---

## 10. File Reference

| File                                           | Role                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/desktop/src/renderer/src/index.css`      | **Single source of truth.** All tokens, `@theme inline`, `@layer base`. |
| `apps/desktop/src/renderer/src/components/ui/` | Shadcn components. **Do not edit.**                                     |
| `apps/desktop/src/renderer/src/lib/utils.ts`   | `cn()` utility (clsx + twMerge).                                        |
| `apps/desktop/components.json`                 | Shadcn config (new-york, neutral, cssVariables).                        |

---

## 11. Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════╗
║  ALL VALUES IN OKLCH  |  HUE 255 (neutral) / 258 (primary)     ║
║  LIGHT MODE ONLY      |  INTERVARIABLE 100–900                 ║
║  BODY 400 / HEAD 600  |  TABULAR FIGURES IN ALL TABLES         ║
╠══════════════════════════════════════════════════════════════════╣
║  CARD     = bg-card border-border shadow-xs rounded-xl         ║
║  INSET    = bg-muted rounded-lg                                ║
║  POPOVER  = bg-popover border-border shadow-md                 ║
║  SEPARATE = border-border (hairline) / border-frame (chrome)   ║
║  PRIMARY  = bg-primary text-primary-foreground (CTAs only)     ║
║  DESTROY  = bg-destructive text-destructive-foreground         ║
║  MUTED BG = bg-muted/60 (controls) / bg-muted/40 (read-only)  ║
║  DIM TEXT = opacity suffix: text-foreground/70                 ║
╚══════════════════════════════════════════════════════════════════╝
```
