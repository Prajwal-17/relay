## Overview

Linear's product light mode is a warm, neutral canvas system — `{colors.canvas}` is #F6F5F3, a slightly warm off-white that avoids the sterile feel of pure white. On top sits a four-step surface ladder (`{colors.surface-1}` through `{colors.surface-4}`) for cards, panels, and lifted tiles, with softened hairline borders running from `{colors.hairline}` (#E2E0DD) up through `{colors.hairline-strong}` and `{colors.hairline-tertiary}`. Deep charcoal text (`{colors.ink}` #1A1C1E) carries the body and headlines.

The single chromatic accent is **Linear lavender-blue** `{colors.primary}` (#5E6AD2) — used on the brand mark, focus rings, and the primary CTA button. A darker hover state (`{colors.primary-hover}` #4C58B8) and a focus-tinted variant (`{colors.primary-focus}` #5E69D1) extend the same hue. Linear avoids saturated greens, oranges, reds, etc. on the chrome — the only semantic color is `{colors.semantic-success}` (#27A644) for status pills and the rare success indicator.

Display type runs **Inter Display** (weight 600) for headings with aggressive negative letter-spacing, while body text uses **Inter** at weight 400. A monospace stack (JetBrains Mono / Geist Mono) is reserved for code and ID tokens.

The page rhythm is **dense, information-rich views** — issue lists, project boards, dashboards. The chrome is intentionally minimal so content takes precedence. This reflects Linear's product UI, not their dark-only marketing site.

**Key Characteristics:**

- **Light-canvas product system** — `{colors.canvas}` (#F6F5F3) is a warm, crisp near-white canvas. Purple-blue cool tint intentionally removed (2026 refresh).
- **Lavender-blue brand accent** (`{colors.primary}` #5E6AD2) — used scarcely on brand mark, focus, and the primary CTA.
- Four-step surface ladder (canvas → surface-1 → surface-2 → surface-3 → surface-4) descends darker with subtle shadowed lifts.
- Display tracking pulls aggressively negative (-3.0px at 80px); body holds at -0.05px.
- Cards use `{rounded.lg}` 12px corners with 1px hairline borders and subtle box shadows — never pill, rarely 16px.
- **Content is the protagonist.** Chrome recedes — sidebar is dimmed, borders are softened, fewer separators.
- No second chromatic color. Reduced blue chrome tint across all surface calculations.
- **Theme generated programmatically** from 3 LCH parameters (base, accent, contrast) into ~98 CSS custom properties.

## Colors

> Sources: linear.app/brand (brand colors), linear.app/now/how-we-redesigned-the-linear-ui (LCH theme system), linear.app/now/behind-the-latest-design-refresh (2026 refresh direction). Hex values are triangulated from brand guidelines, CSS variable analysis, and perceptual matching against published screenshots.

### Brand & Accent

- **Lavender-Blue** ({colors.primary}): The signature Linear accent — #5E6AD2. Primary CTA, brand mark, link emphasis, focus rings. Identical to the dark variant.
- **Lavender Hover** ({colors.primary-hover}): Deeper lavender (#4C58B8) — hovered state of the primary CTA. On light canvas the hover darkens (inverse of the dark-mode hover which lightens).
- **Lavender Focus** ({colors.primary-focus}): Focus-ring tint (#5E69D1) — focused inputs, focused buttons.
- **On-Primary** ({colors.on-primary}): White (#FFFFFF) — text rendered on the primary button background.

### Surface

- **Canvas** ({colors.canvas}): Default page background — #F6F5F3, a warm off-white. Intentionally warmer and less saturated than the pre-2026 cool blue-tinted canvas. Derived near Mercury White (#F4F5F8) from linear.app/brand.
- **Surface 1** ({colors.surface-1}): One step darker than canvas — #EEECEA. Feature cards, view panels, content containers.
- **Surface 2** ({colors.surface-2}): Two steps darker — #E5E3E0. Featured cards, hovered rows, selected nav items.
- **Surface 3** ({colors.surface-3}): Three steps darker — #DCDAD7. Sub-navigation bars, dropdown menus, sidebar background.
- **Surface 4** ({colors.surface-4}): Four steps darker — #D0CECB. Deepest lifted surface, modal backdrops.
- **Hairline** ({colors.hairline}): 1px borders on cards and dividers — #E2E0DD. Softer contrast than the dark system's hairlines (2026: "softening the contrast, fewer separators").
- **Hairline Strong** ({colors.hairline-strong}): Stronger 1px borders — #CBC9C5. Input outlines, selected card borders.
- **Hairline Tertiary** ({colors.hairline-tertiary}): Subtle borders for nested surfaces — #F0EFED.
- **Inverse Canvas** ({colors.inverse-canvas}): Deep charcoal #1A1C1E — surface of inverse pill CTA buttons. Anchored near Nordic Gray (#222326).
- **Inverse Surface 1** ({colors.inverse-surface-1}): One step lighter than inverse canvas — #2D3035.
- **Inverse Surface 2** ({colors.inverse-surface-2}): Two steps lighter — #3E4148.

### Text

- **Ink** ({colors.ink}): All headlines and emphasized body type — #1A1C1E. Darker than pre-2024 light mode text (2024: "making our text and neutral icons darker in light mode"). Near Nordic Gray (#222326) but slightly softened.
- **Ink Muted** ({colors.ink-muted}): Secondary type at #4D5055 — meta info, timestamps, secondary labels.
- **Ink Subtle** ({colors.ink-subtle}): Tertiary type at #71747A — placeholder text, disabled tabs, footer columns.
- **Ink Tertiary** ({colors.ink-tertiary}): Quaternary at #9B9EA4 — disabled controls, decorative text.

### Semantic

- **Success Green** ({colors.semantic-success}): Status pills, success indicators — #27A644. Works on both light and dark canvases.
- **Overlay** ({colors.semantic-overlay}): Modal scrim — rgba(0,0,0,0.5). Semi-transparent dark overlay.

> **Note on the color palette:** Linear's product light mode uses an LCH-based theme generation system. Three parameters — base color, accent color, and contrast — programmatically produce ~98 CSS custom properties at runtime. The hex values above are perceptual approximations of the resulting computed colors at default contrast (~75). See Known Gaps for more detail.

## Typography

### Font Family

- **Inter Display** — Used for headings (display-xl through headline). A display-optimized cut of Inter with tighter spacing and refined letterforms. Fallback: `SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto`.
- **Inter** — Used for body text, button labels, captions, and eyebrow. Fallback: `-apple-system, system-ui, Segoe UI, Roboto, sans-serif`.
- **JetBrains Mono** — Used for code snippets, ID tokens, and status identifiers. Fallback: `Geist Mono, ui-monospace, SF Mono, Menlo, Consolas`.

Linear's product UI uses Inter Display for headings to "add more expression... while maintaining readability" (2024 redesign post). Body text stays on regular Inter.

### Hierarchy

| Token                     | Size | Weight | Line Height | Letter Spacing | Use                                        |
| ------------------------- | ---- | ------ | ----------- | -------------- | ------------------------------------------ |
| `{typography.display-xl}` | 80px | 600    | 1.05        | -3.0px         | Largest hero headline                      |
| `{typography.display-lg}` | 56px | 600    | 1.10        | -1.8px         | Section opener headlines                   |
| `{typography.display-md}` | 40px | 600    | 1.15        | -1.0px         | Sub-section headlines                      |
| `{typography.headline}`   | 28px | 600    | 1.20        | -0.6px         | Pricing tier titles, CTA banner heading    |
| `{typography.card-title}` | 22px | 500    | 1.25        | -0.4px         | Feature card title                         |
| `{typography.subhead}`    | 20px | 400    | 1.40        | -0.2px         | Lead body, intro paragraphs                |
| `{typography.body-lg}`    | 18px | 400    | 1.50        | -0.1px         | Hero subhead, lead paragraphs              |
| `{typography.body}`       | 16px | 400    | 1.50        | -0.05px        | Default body                               |
| `{typography.body-sm}`    | 14px | 400    | 1.50        | 0              | Card body, footer columns                  |
| `{typography.caption}`    | 12px | 400    | 1.40        | 0              | Captions, meta, status                     |
| `{typography.button}`     | 14px | 500    | 1.20        | 0              | All button labels                          |
| `{typography.eyebrow}`    | 13px | 500    | 1.30        | 0.4px          | Section eyebrow (slight positive tracking) |
| `{typography.mono}`       | 13px | 400    | 1.50        | 0              | JetBrains Mono for code, IDs               |

### Principles

- **Aggressive negative tracking on display** (-3.0px at 80px ≈ 4% of size). Same as the dark system — the tight tracking reads well on both dark and light.
- **Single voice from display to body.** Display-xl at 600 → body at 400 — same typeface family, narrower weights.
- **Eyebrow uses positive tracking** (+0.4px) — contrast against the negative-tracked display marks the eyebrow as taxonomy.
- **Mono only in code/ID contexts.** JetBrains Mono lives inside product views — not on marketing chrome.
- **Text darker than typical light UIs.** Linear's 2024 redesign deliberately increased contrast by making "text and neutral icons darker in light mode."

### Note on Font Substitutes

Inter + Inter Display are freely available on Google Fonts and are Linear's documented choice since 2024. For environments where Inter can't be loaded, the system stack (`SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto`) is a strong fallback. For mono, **JetBrains Mono** at weight 400 is the recommended free choice; **Geist Mono** is also viable.

## Layout

### Spacing System

- **Base unit**: 4px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- Card interior padding: `{spacing.lg}` 24px on feature/pricing cards; `{spacing.xl}` 32px on testimonial cards; `{spacing.xxl}` 48px on CTA banners.
- Pill button padding: 8px vertical · 14px horizontal — Linear's compact button spec.
- Form input padding: 8px vertical · 12px horizontal.

### Grid & Container

- Max content width sits around 1280px.
- Card grids are 3-up at desktop, 2-up at tablet, 1-up at mobile.
- Pricing tier grid is 3-up; comparison strip below shows checkmarks per tier.
- Content panels span full content width — they're the protagonist.

### Whitespace Philosophy

The light canvas uses generous negative space paired with subtle surface lifts and soft shadows. Sections separate by lift onto surface-1 panels with visible hairline borders and box shadows, creating clear visual hierarchy against the bright canvas. The sidebar is "a few notches dimmer" (2026 refresh) — it recedes so the content area takes visual precedence. Within a panel, `{spacing.lg}` 24px gaps between content blocks; `{spacing.section}` 96px between sections.

### Sidebar Treatment

- Sidebar background: `{colors.surface-3}` (#DCDAD7) — dimmer than the canvas so it visually recedes.
- Sidebar text: `{colors.ink-muted}` (#4D5055) for inactive items; `{colors.ink}` (#1A1C1E) for active.
- Sidebar borders: 1px `{colors.hairline}` (#E2E0DD) right edge for subtle separation from content.

## Elevation & Depth

| Level              | Treatment                                                                      | Use                                              |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------ |
| 0 (flat)           | No shadow, no border                                                           | Default for body type, hero text, footer         |
| 1 (surface-1 lift) | `{colors.surface-1}` background, 1px `{colors.hairline}`, `{shadow.sm}`        | Default cards, content panels                    |
| 2 (surface-2 lift) | `{colors.surface-2}` background, 1px `{colors.hairline-strong}`, `{shadow.md}` | Featured cards, hovered rows, selected nav items |
| 3 (surface-3 lift) | `{colors.surface-3}` background, `{shadow.lg}`                                 | Sub-nav, dropdown menus, sidebar                 |
| 4 (focus ring)     | 2px `{colors.primary-focus}` outline at 50% opacity                            | Focused input, focused button                    |

On light canvas, depth is carried by the surface ladder, hairline borders, and a layered shadow system. Shadows are crisp and visible on white — they replace the "white edge highlight" trick that dark-mode panels rely on. Borders are intentionally softer than typical light UIs (2026: "softening the contrast, fewer separators").

### Shadow Scale

| Token         | Value                                                       | Use                                             |
| ------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `{shadow.xs}` | `0 1px 2px rgba(0,0,0,0.04)`                                | Subtle lift on small elements, button-secondary |
| `{shadow.sm}` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`    | Default card shadow                             |
| `{shadow.md}` | `0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)`   | Featured card, hovered card                     |
| `{shadow.lg}` | `0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)`   | Dropdowns, sub-nav panels                       |
| `{shadow.xl}` | `0 16px 40px rgba(0,0,0,0.10), 0 6px 12px rgba(0,0,0,0.05)` | Modals, oversized overlays                      |

All shadows use `rgba(0,0,0,...)` with layered stops for dimensional depth. Shadows stay subtle — never exceed 0.10 alpha on the deepest stop.

### Decorative Depth

- **Content views** dominate as decorative depth — issue lists, boards, project views framed in surface-1 cards with `{shadow.sm}` lifts.
- **Atmospheric gradients are permitted sparingly** — soft radial gradients from `{colors.primary}` at low opacity (3–8%) can add warmth to hero sections and CTA banners.
- **Spotlight cards** — feature cards can optionally carry a subtle gradient overlay from `{colors.primary}` to `{colors.canvas}` at 3–5 percent opacity.
- **Subtle border-edge highlight** — a faint `{colors.hairline-tertiary}` border on the light-facing edge of lifted panels gives light surfaces a presence (the inverse of the dark-mode top-edge white highlight).
- **No aggressive drop shadows.** Linear's light depth stays refined; shadows should feel like the card is resting on the surface, not floating above it.

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                                                   |
| ---------------- | ------ | --------------------------------------------------------------------- |
| `{rounded.xs}`   | 4px    | Small chips, status badges                                            |
| `{rounded.sm}`   | 6px    | Inline tags, compact tabs                                             |
| `{rounded.md}`   | 8px    | All buttons, form inputs, tab pills (2026: "rounded corners" on tabs) |
| `{rounded.lg}`   | 12px   | Feature cards, content panels                                         |
| `{rounded.xl}`   | 16px   | Oversized content panels                                              |
| `{rounded.xxl}`  | 24px   | Oversized CTA banners (rare)                                          |
| `{rounded.pill}` | 9999px | Status pills, filter chips                                            |
| `{rounded.full}` | 9999px | Avatar circles                                                        |

Borders and corners are rounded and softened relative to pre-2026 Linear (2026: "rounding out their edges and softening the contrast").

### Photography & Illustration Geometry

- App content screenshots dominate; they sit in `{rounded.lg}` 12px tiles with `{spacing.lg}` 24px outer padding.
- Avatar circles use `{rounded.full}` at 24–32px sizes for team members, 32–40px for testimonial cards.
- Icon-only buttons and tab pills use `{rounded.md}` 8px corners — compact and rounded per the 2026 refresh.

## Components

### Buttons

**`button-primary`** — Lavender CTA. The default primary CTA across all pages.

- Background `{colors.primary}`, text `{colors.on-primary}` (white), type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`. `{shadow.xs}` lift.
- Pressed state: background shifts to `{colors.primary-focus}`.
- Hover state: background shifts to `{colors.primary-hover}` (darker lavender on light canvas).

**`button-secondary`** — Light surface button. Used for secondary CTAs.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`. 1px `{colors.hairline}` border. `{shadow.xs}` lift.

**`button-tertiary`** — Plain text button.

- Background transparent, text `{colors.ink}`, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px. Hover: background shifts to `{colors.surface-1}`.

**`button-inverse`** — Dark-on-light inverse CTA.

- Background `{colors.inverse-canvas}`, text white, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px. `{shadow.xs}` lift.

### Tabs & Navigation Pills

**`tab-default`** + **`tab-selected`** — Inline tabs on views.

- Default: transparent background, `{colors.ink-subtle}` text, rounded `{rounded.md}`, padding 6px 12px.
- Selected: `{colors.surface-2}` background, `{colors.ink}` text, `{shadow.xs}` lift. Compact sizing per 2026 refresh ("smaller icon and text sizing").

### Cards & Containers

**`content-card`** — Default content panel for issue lists, boards, views.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px. 1px `{colors.hairline}` border. `{shadow.sm}`.

**`content-card-featured`** — Elevated/selected content panel.

- Background `{colors.surface-2}`, `{shadow.md}`, 1px `{colors.hairline-strong}` border. Otherwise identical.

**`feature-card`** — Generic feature highlight tile.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px. 1px `{colors.hairline}` border. `{shadow.sm}`. May optionally carry a subtle spotlight gradient.

**`testimonial-card`** — Customer quote with avatar + name + role.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body-lg}`, rounded `{rounded.lg}`, padding 32px. 1px `{colors.hairline}` border. `{shadow.sm}`.

**`customer-logo-tile`** — Small tile in a logo marquee.

- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, rounded `{rounded.xs}`, padding 16px. 1px `{colors.hairline}` border.

**`cta-banner`** — Closing CTA panel near page bottom.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.headline}`, rounded `{rounded.lg}`, padding 48px. 1px `{colors.hairline}` border. `{shadow.md}`. Optional atmospheric gradient overlay from `{colors.primary}` at 5% opacity.

### Inputs & Forms

**`text-input`** + **`text-input-focused`** — Form fields.

- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.md}`, padding 8px 12px. 1px `{colors.hairline}` border.
- Focused state: border changes to `{colors.hairline-strong}`; focus ring is a 2px `{colors.primary-focus}` outline at 50% opacity.

### Status & Metadata

**`list-row`** — Each row in issue lists, changelogs, and content views.

- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.xs}`, padding 16px. 1px `{colors.hairline}` bottom rule. Hover: background shifts to `{colors.surface-2}`.

**`status-badge`** — Small status pill.

- Background `{colors.surface-2}`, text `{colors.ink-muted}`, type `{typography.caption}`, rounded `{rounded.pill}`, padding 2px 8px.

### Navigation

**`top-nav`** — Sticky header bar with navigation controls left, view tabs center, and action buttons right.

- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-sm}`, height 48px (more compact per 2026 refresh). 1px `{colors.hairline}` bottom rule.

**`sidebar`** — Persistent left navigation panel.

- Background `{colors.surface-3}` (#DCDAD7) — intentionally dimmer than canvas so the content area dominates visually ("a few notches dimmer" — 2026 refresh).
- Active item: `{colors.surface-2}` background, `{colors.ink}` text, `{rounded.md}` corners.
- Inactive item: transparent background, `{colors.ink-muted}` text.
- Width: ~220–240px default, collapsible.
- Right edge: 1px `{colors.hairline}` border.

### Footer

**`footer`** — Link grid on `{colors.canvas}`.

- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, padding 64px 32px. 1px `{colors.hairline}` top rule.

## Do's and Don'ts

### Do

- Anchor the system on `{colors.canvas}` (#F6F5F3) — the warm tint keeps the canvas from feeling sterile, and the warmth is intentional per the 2026 refresh direction.
- Use `{colors.primary}` lavender ONLY for: brand mark, primary CTA, focus ring, link emphasis.
- Use the four-step surface ladder for hierarchy. Avoid skipping levels.
- Apply shadows on every lifted surface — `{shadow.sm}` on cards, `{shadow.md}` on featured cards, `{shadow.lg}` on dropdowns.
- Pair Inter Display weight 600 with Inter body weight 400 — Linear resists 700+ display weights.
- Apply negative letter-spacing aggressively on display.
- Keep the sidebar dimmer than the canvas — it should recede visually.
- Compose CTAs as `{rounded.md}` 8px corners.
- Use hairline borders at `{colors.hairline}` — softer contrast than typical light UIs.
- Reduce separator usage — let spacing and surface lifts carry structure (2026: "fewer separators").

### Don't

- Don't ship a dark-mode marketing page (this system is for the product UI, not marketing).
- Don't use lavender as a section background or card fill.
- Don't introduce a second chromatic accent (orange, pink, green for chrome).
- Don't rely on borders alone for depth — shadows are essential on a light canvas.
- Don't pill-round CTAs — `{rounded.md}` 8px is the ceiling for buttons.
- Don't use `#FFFFFF` pure white or `#000000` pure black — the warm tint and dark charcoal matter.
- Don't ship cards without shadows — flat cards disappear against the light background.
- Don't fill the sidebar with the same brightness as the canvas — the dim treatment is deliberate.
- Don't add excessive blue tint to surface calculations — the 2024 redesign intentionally reduced chrome accent in derived colors.

## Responsive Behavior

### Breakpoints

| Name       | Width  | Key Changes                                   |
| ---------- | ------ | --------------------------------------------- |
| Desktop-XL | 1440px | Default desktop layout                        |
| Desktop    | 1280px | Card grid 3-up maintained                     |
| Tablet     | 1024px | Card grid 3-up → 2-up; sidebar collapses      |
| Mobile-Lg  | 768px  | Single-column; nav hamburger; sidebar overlay |
| Mobile     | 480px  | Single-column; display-xl scales 80px → ~36px |

### Touch Targets

- CTAs hold ≥40px tap height across viewports.
- Tab pills hold ≥36px tap height; touch viewports grow to ≥44px.
- Form inputs hold ≥44px tap target on touch.

### Collapsing Strategy

- **Top nav**: links collapse to hamburger below 768px.
- **Sidebar**: collapses to icon-only or overlay drawer below 1024px.
- **Card grids**: 3-up → 2-up at 1024px → 1-up below 768px.
- **Display type**: `{typography.display-xl}` 80px scales toward `{typography.display-md}` 40px on mobile.

### Image Behavior

- App screenshots maintain aspect ratio and never crop.
- Avatar circles scale proportionally: 32px desktop → 24px mobile.

## Iteration Guide

1. Focus on ONE component at a time and reference it by its token name.
2. When introducing a section, decide first which surface lift it lives on AND which shadow level it carries.
3. Default body to `{typography.body}` at weight 400 (Inter).
4. Every lifted surface gets a border AND a shadow — not one or the other. On light canvas, both are needed.
5. Add new variants as separate component entries.
6. Treat lavender as scarce: brand mark, primary CTA, focus, link emphasis.
7. The sidebar is always `{colors.surface-3}` — dimmer than the canvas. Don't lighten it.
8. Reduce separators when possible. Let surface lifts and spacing create structure.
9. Run `npx @google/design.md lint DESIGN.md` after edits.

## Known Gaps

- **Exact hex values are perceptual approximations.** Linear's product light mode generates ~98 CSS custom properties at runtime from 3 LCH parameters (base color, accent color, contrast). There are no hardcoded hex values to extract. The values in this document have been triangulated from brand guidelines (Mercury White #F4F5F8, Nordic Gray #222326), CSS variable naming conventions found in deployed assets, qualitative descriptions from the 2024 and 2026 redesign blog posts, and perceptual matching against published screenshots.
- **Contrast parameter affects all tokens.** Linear ships with a default contrast of ~75 (on a scale of 0–100). Changing this value shifts the entire surface and text ladder. The values here represent the default contrast setting.
- **Sidebar color may vary.** The 2026 refresh describes the sidebar as "a few notches dimmer" than before, but the exact `surface-3` value may differ from the values used here. Adjust `surface-3` based on side-by-side perceptual matching with the actual Linear app.
- **Shadow values are approximate.** The layered shadow scale should be calibrated against real product screenshots on the light canvas for optimal perceptual depth.
- **Form-field error and validation styling** is not visible on publicly accessible Linear pages. Error states should follow the same pattern as the dark system but with light-appropriate contrast.
- **The 2026 refresh is ongoing.** As of mid-2026, Linear is still rolling out the refreshed light mode. Some details (exact sidebar shade, border rounding radius, tab sizing) may be tuned further.
- **This system documents the product light mode, not a marketing site.** Linear's marketing site ships dark-only. The tokens here target a product UI — issue tracker, project views, dashboards — not a landing page.
- **In-product color tags (red, orange, yellow, green, blue, purple)** for issue priorities and project labels use a richer palette that is not covered here. Those colors are part of Linear's functional UI, not the design system chrome.
- **Inter Display may not render identically to Linear's custom typeface.** Inter Display is the confirmed substitute; minor kerning and tracking differences compared to Linear's proprietary display face should be expected.
