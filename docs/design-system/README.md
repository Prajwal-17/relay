# QuickCart Design Systems

Four complete design systems for QuickCart — an offline-first desktop billing app. Each system rethinks the entire token architecture: colors, typography, shadows, spacing, and domain-specific tokens. Select one, then implement it by replacing `apps/desktop/src/renderer/src/index.css` and migrating component classes to the new tokens.

## Comparison

| | A: Trust & Clarity | B: Warm Retail | C: Modern Monochrome | D: Thermal Print |
|---|---|---|---|---|
| **Primary** | Indigo blue | Saffron amber | Charcoal slate | Thermal black |
| **Font** | Inter | Roboto | System UI stack | Inter + System Mono |
| **Vibe** | Bank-grade, professional | Warm, approachable retail | Minimal, distraction-free | Receipt print, brutalist |
| **Color saturation** | Medium-high | Medium | Low (near-achromatic) | None (except semantic states) |
| **Sidebar** | Dark (navy) | Dark (warm charcoal) | Light (blends with page) | Dark (thermal black) |
| **Best for** | Multi-branch, formal stores | Independent shops, daily POS | High-volume, power users | Data-first, receipt-native shops |
| **Contrast ratio** | Highest (AAA body text) | High (AA+ body text) | Medium-high (AA body text) | Highest (AAA body text) |
| **Signature** | Contrasting sidebar | Saffron warmth | Color only for status | **Monospace price columns** |

## What's different from current

| Issue (from design audit) | Fixed in all 3 systems |
|---|---|
| No dark mode tokens | Dark mode removed entirely (not needed for billing) |
| Missing `--warning` / `--info` tokens | Added as first-class semantic tokens |
| Hardcoded hex/hsl/oklch in 18+ locations | Replaced with token references |
| 96 raw Tailwind color classes | Mapped to semantic tokens |
| 43 arbitrary font sizes | Consolidated to type scale |
| 10 arbitrary shadows | Standardized shadow system |
| Broken shadow duplicates (2xs=xs) | Fixed, distinct values |
| Merriweather declared, never loaded | Removed |
| Unused tokens (borderprimary, sidebar-primary-purple, background-secondary) | Consolidated or removed |
| Scrollbar hardcoded hex | Mapped to tokens |

## How to choose

1. Read each design system doc.
2. Mock up the palette in your head against the current UI screens (billing table, dashboard charts, product list).
3. Consider the primary user: a shop operator staring at this screen for hours daily.
4. Pick one. I'll implement it.

## How to apply (after selection)

1. Replace `apps/desktop/src/renderer/src/index.css` with the chosen system's token definitions.
2. Migrate component classes from raw Tailwind utilities to semantic token classes (see migration map in each doc).
3. Replace hardcoded chart colors with `--chart-*` tokens.
4. Drop all `dark:` class variants (no dark mode).
5. Run `pnpm --filter quickcart typecheck` to catch mismatches.

---

## File index

- [01 — Trust & Clarity](./01-trust-clarity.md) — Indigo + Inter, high contrast, professional
- [02 — Warm Retail](./02-warm-retail.md) — Saffron + Roboto, warm, friendly
- [03 — Modern Monochrome](./03-modern-monochrome.md) — Slate + system-ui, minimal, calm
- [04 — Thermal Print](./04-thermal-print.md) — Thermal black + Inter/Mono, receipt aesthetic, monospace prices
- [05 — Linear (Dark)](./5-linear-design.md) — Linear.app dark marketing canvas, lavender-blue accent
- [06 — Linear Light (conceptual)](./6-linear-light.md) — Theoretical light-mode inversion of the Linear dark theme
- [07 — Linear Light (product)](./7-linear-light-product.md) — Linear's actual product light mode: warm canvas, Inter Display, softer borders
