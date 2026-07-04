## Overview

Light Linear is the light-mode inversion of Linear.app's marketing canvas — a bright, airy system where `{colors.canvas}` is #fcfcfd, a near-pure white with a faint cool tint. On top sits a four-step surface ladder (`{colors.surface-1}` through `{colors.surface-4}`) for cards, panels, and lifted tiles, with hairline borders running from `{colors.hairline}` (#e2e5eb) up through `{colors.hairline-strong}` and `{colors.hairline-tertiary}`. Dark gray text (`{colors.ink}` #0c0e12) carries the body and headlines.

The single chromatic accent is **Linear lavender-blue** `{colors.primary}` (#5e6ad2) — used on the brand mark, focus rings, and the primary CTA button. A darker hover state (`{colors.primary-hover}` #4c58b8) and a focus-tinted variant (`{colors.primary-focus}` #5e69d1) extend the same hue. Linear avoids saturated greens, oranges, reds, etc. on the marketing canvas — the only semantic color is `{colors.semantic-success}` (#27a644) for status pills and the rare success indicator.

Display type runs Linear's custom sans (with `SF Pro Display` fallback) at weight 500–700 with negative letter-spacing scaling from -3.0px at 80px down to 0 at body. The body family is Linear's text cut, and a Linear Mono is reserved for code snippets in product screenshots.

The page rhythm is **dense product screenshots** — Linear's marketing leads with high-fidelity captures of the product UI (issue list, project view, dashboard) framed in `{colors.surface-1}` panels with `{rounded.xl}` 16px corners and subtle `{shadow.sm}` lifts. The chrome is intentionally minimal so the app screenshots can do the heavy lifting.

**Key Characteristics:**
- **Light-canvas marketing system** — `{colors.canvas}` (#fcfcfd) is a bright, near-pure white canvas.
- **Lavender-blue brand accent** (`{colors.primary}` #5e6ad2) — used scarcely on brand mark, focus, and the primary CTA.
- Four-step surface ladder (canvas → surface-1 → surface-2 → surface-3 → surface-4) descends darker with shadowed lifts.
- Display tracking pulls aggressively negative (-3.0px at 80px); body holds at -0.05px.
- Cards use `{rounded.lg}` 12px corners with 1px hairline borders and subtle box shadows — never pill, rarely 16px.
- **Product UI screenshots** dominate the page. The marketing chrome is a light frame for the app.
- No second chromatic color. Atmospheric gradients and spotlight cards are welcome on this light canvas.

## Colors

> Source: conceptual light-mode inversion of linear.app marketing pages.

### Brand & Accent
- **Lavender-Blue** ({colors.primary}): The signature Linear accent — primary CTA, brand mark, link emphasis. Identical to the dark variant: #5e6ad2.
- **Lavender Hover** ({colors.primary-hover}): Deeper lavender (#4c58b8) — hovered state of the primary CTA. On light canvas the hover darkens (inverse of the dark-mode hover which lightens).
- **Lavender Focus** ({colors.primary-focus}): Focus-ring tint (#5e69d1) — focused inputs, focused buttons.
- **Brand Secure** ({colors.brand-secure}): Muted lavender-gray (#6b6f9e) — used in "Linear Security" surfaces.

### Surface
- **Canvas** ({colors.canvas}): Default page background — #fcfcfd, near-pure white with a faint cool tint.
- **Surface 1** ({colors.surface-1}): One step darker than canvas — #f2f3f6. Feature cards, pricing cards, product screenshot panels.
- **Surface 2** ({colors.surface-2}): Two steps darker — #e8eaef. Featured pricing card, hovered cards.
- **Surface 3** ({colors.surface-3}): Three steps darker — #dde0e7. Sub-nav, dropdown menus.
- **Surface 4** ({colors.surface-4}): Four steps darker — #d0d4dd. Deepest lifted surface.
- **Hairline** ({colors.hairline}): 1px borders on cards and dividers — #e2e5eb.
- **Hairline Strong** ({colors.hairline-strong}): Stronger 1px borders — #cdd1d9. Input focus rings.
- **Hairline Tertiary** ({colors.hairline-tertiary}): Tertiary borders for nested surfaces — #f0f1f4.
- **Inverse Canvas** ({colors.inverse-canvas}): Near-black #0c0e12 — surface of the inverse pill CTA on a small set of section openers.
- **Inverse Surface 1** ({colors.inverse-surface-1}): One step lighter than inverse canvas — #1a1d24.
- **Inverse Surface 2** ({colors.inverse-surface-2}): Two steps lighter than inverse canvas — #2a2e38.

### Text
- **Ink** ({colors.ink}): All headlines and emphasized body type — dark gray #0c0e12.
- **Ink Muted** ({colors.ink-muted}): Secondary type at #373c47 — meta info on hero panels.
- **Ink Subtle** ({colors.ink-subtle}): Tertiary type at #656b78 — deselected pricing tabs, footer columns.
- **Ink Tertiary** ({colors.ink-tertiary}): Quaternary at #949aa8 — disabled, footnotes.

### Semantic
- **Success Green** ({colors.semantic-success}): Status pills, success indicators. The only semantic color on marketing — #27a644.
- **Overlay** ({colors.semantic-overlay}): Dark overlay scrim for modals — #0c0e12 (matches inverse canvas).

## Typography

### Font Family

- **Linear Display** — Linear's custom display sans; fallback `SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto`. Carries display-xl through subhead.
- **Linear Text** — Linear's custom text sans (a slightly different cut tuned for body sizes); same fallback stack. Carries body sizes, button labels, captions.
- **Linear Mono** — Linear's custom mono; fallback `ui-monospace, SF Mono, Menlo`. Used for code snippets in product screenshots and for status / ID tokens.

The marketing surface treats Display and Text as one continuous voice; the family change is silent.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 80px | 600 | 1.05 | -3.0px | Largest hero headline |
| `{typography.display-lg}` | 56px | 600 | 1.10 | -1.8px | Section opener headlines |
| `{typography.display-md}` | 40px | 600 | 1.15 | -1.0px | Sub-section headlines |
| `{typography.headline}` | 28px | 600 | 1.20 | -0.6px | Pricing tier titles, CTA banner heading |
| `{typography.card-title}` | 22px | 500 | 1.25 | -0.4px | Feature card title |
| `{typography.subhead}` | 20px | 400 | 1.40 | -0.2px | Lead body, intro paragraphs |
| `{typography.body-lg}` | 18px | 400 | 1.50 | -0.1px | Hero subhead, lead paragraphs |
| `{typography.body}` | 16px | 400 | 1.50 | -0.05px | Default body |
| `{typography.body-sm}` | 14px | 400 | 1.50 | 0 | Card body, footer columns |
| `{typography.caption}` | 12px | 400 | 1.40 | 0 | Captions, meta, status |
| `{typography.button}` | 14px | 500 | 1.20 | 0 | All button labels |
| `{typography.eyebrow}` | 13px | 500 | 1.30 | 0.4px | Section eyebrow (slight positive tracking) |
| `{typography.mono}` | 13px | 400 | 1.50 | 0 | Linear Mono for code in product screenshots |

### Principles

- **Aggressive negative tracking on display** (-3.0px at 80px ≈ 4% of size). Same as the dark system — the tight tracking reads well on both dark and light.
- **Single voice from display to body.** Display-xl at 600 → body at 400 — same family, narrower weights.
- **Eyebrow uses positive tracking** (+0.4px) — contrast against the negative-tracked display marks the eyebrow as taxonomy.
- **Mono only in code contexts.** Linear Mono lives inside product screenshots — not on marketing chrome.

### Note on Font Substitutes

Linear's custom typeface isn't publicly distributed; the documented fallback `SF Pro Display, -apple-system, system-ui` is the recommended substitute on macOS. For cross-platform implementation, **Inter** at weight 500 / 600 / 700 is the closest free substitute. **Geist Sans** is also viable. For mono, **JetBrains Mono** or **Geist Mono** at weight 400 closely approximates Linear Mono.

## Layout

### Spacing System

- **Base unit**: 4px.
- **Tokens (front matter)**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- Card interior padding: `{spacing.lg}` 24px on feature/pricing cards; `{spacing.xl}` 32px on testimonial cards; `{spacing.xxl}` 48px on CTA banners.
- Pill button padding: 8px vertical · 14px horizontal — Linear's compact button spec.
- Form input padding: 8px vertical · 12px horizontal.

### Grid & Container

- Max content width sits around 1280px.
- Card grids are 3-up at desktop, 2-up at tablet, 1-up at mobile.
- Pricing tier grid is 3-up; comparison strip below shows checkmarks per tier.
- Product screenshot panels span full content width — they're the protagonist.

### Whitespace Philosophy

The light canvas uses generous negative space paired with subtle surface lifts and soft shadows. Sections separate by lift onto surface-1 panels with visible borders and box shadows, creating clear visual hierarchy against the bright canvas. Within a panel, generous `{spacing.lg}` 24px gaps between content blocks; `{spacing.section}` 96px between sections.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, no border | Default for body type, hero text, footer |
| 1 (surface-1 lift) | `{colors.surface-1}` background, 1px `{colors.hairline}`, `{shadow.sm}` | Default cards, product panels |
| 2 (surface-2 lift) | `{colors.surface-2}` background, 1px `{colors.hairline-strong}`, `{shadow.md}` | Featured pricing card, hovered cards |
| 3 (surface-3 lift) | `{colors.surface-3}` background, `{shadow.lg}` | Sub-nav, dropdown menus |
| 4 (focus ring) | 2px `{colors.primary-focus}` outline at 50% opacity | Focused input, focused button |

On light canvas, depth is carried by the surface ladder, hairline borders, and a shadow system. Box shadows are crisp and visible on white — they replace the "white edge highlight" trick that dark-mode panels rely on.

### Shadow Scale

| Token | Value | Use |
|---|---|---|
| `{shadow.xs}` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle lift on small elements |
| `{shadow.sm}` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default card shadow |
| `{shadow.md}` | `0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)` | Featured card, hovered card |
| `{shadow.lg}` | `0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)` | Dropdowns, sub-nav panels |
| `{shadow.xl}` | `0 16px 40px rgba(0,0,0,0.1), 0 6px 12px rgba(0,0,0,0.05)` | Modals, oversized overlays |

### Decorative Depth

- **Product UI screenshots** dominate as decorative depth — framed in surface-1 cards with `{shadow.sm}` lifts.
- **Atmospheric gradients are welcome** — soft radial gradients from `{colors.primary}` at low opacity (5–10%) can add warmth to hero sections and CTA banners.
- **Spotlight cards** — feature cards can optionally carry a subtle gradient overlay from `{colors.primary}` to `{colors.canvas}` at 3–8 percent opacity, drawing the eye to key content.
- **Subtle dark edge highlight** on the bottom edge of lifted panels — gives light surfaces a faint "rendered" presence (the inverse of the dark-mode top-edge highlight).

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Small chips, status badges |
| `{rounded.sm}` | 6px | Inline tags |
| `{rounded.md}` | 8px | All buttons, form inputs |
| `{rounded.lg}` | 12px | Pricing cards, feature cards, testimonial cards |
| `{rounded.xl}` | 16px | Product screenshot panels |
| `{rounded.xxl}` | 24px | Oversized CTA banners (rare) |
| `{rounded.pill}` | 9999px | Pricing tab toggles, status pills |
| `{rounded.full}` | 9999px | Avatar circles |

### Photography & Illustration Geometry

- Product UI screenshots dominate; they sit in `{rounded.xl}` 16px tiles with `{spacing.lg}` 24px outer padding.
- Customer logo tiles render at small sizes (~24px logo height) on `{colors.canvas}` with a subtle `{colors.hairline}` border.
- Avatar circles in testimonial cards use `{rounded.full}` at 32–40px sizes.

## Components

### Buttons

**`button-primary`** — Lavender CTA. The default primary CTA across all pages.
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`.
- Pressed state lives in `button-primary-pressed` (background shifts to `{colors.primary-focus}`).
- Hover state lives in `button-primary-hover` (background shifts to `{colors.primary-hover}` deeper lavender).

**`button-secondary`** — Light surface button. Used for secondary CTAs ("Sign in", "Read changelog").
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.button}`, padding 8px 14px, rounded `{rounded.md}`. 1px `{colors.hairline}` border. `{shadow.xs}` lift.

**`button-tertiary`** — Plain text button.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px.

**`button-inverse`** — Dark-on-light inverse CTA.
- Background `{colors.inverse-canvas}`, text `{colors.inverse-ink}`, type `{typography.button}`, rounded `{rounded.md}`, padding 8px 14px. `{shadow.xs}` lift.

### Pricing Tabs

**`pricing-tab-default`** + **`pricing-tab-selected`** — Pill-toggle on `/pricing`.
- Default: `{colors.canvas}` background, `{colors.ink-subtle}` text, rounded `{rounded.pill}`, padding 6px 14px.
- Selected: `{colors.surface-2}` background, `{colors.ink}` text, `{shadow.xs}` lift — selected = surface lift with shadow emphasis.

### Cards & Containers

**`pricing-card`** — Each tier on `/pricing`.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px. 1px `{colors.hairline}` border. `{shadow.sm}`.

**`pricing-card-featured`** — Recommended tier — surface lift to surface-2.
- Background `{colors.surface-2}`, `{shadow.md}`, otherwise identical structure.

**`feature-card`** — Generic feature highlight tile.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.lg}`, padding 24px. 1px `{colors.hairline}` border. `{shadow.sm}`. May optionally carry a subtle spotlight gradient.

**`product-screenshot-card`** — The dominant card type — frames a high-fidelity Linear app UI screenshot.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.xl}`, padding 24px. 1px `{colors.hairline}` border. `{shadow.sm}`.

**`testimonial-card`** — Customer quote with avatar + name + role.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body-lg}`, rounded `{rounded.lg}`, padding 32px. 1px `{colors.hairline}` border. `{shadow.sm}`.

**`customer-logo-tile`** — Small tile in the customer marquee.
- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, rounded `{rounded.xs}`, padding 16px. 1px `{colors.hairline}` border.

**`cta-banner`** — Closing CTA panel near page bottom.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.headline}`, rounded `{rounded.lg}`, padding 48px. 1px `{colors.hairline}` border. `{shadow.md}`. Optional atmospheric gradient overlay from `{colors.primary}` at 5 percent opacity.

### Inputs & Forms

**`text-input`** + **`text-input-focused`** — Form fields on `/contact/sales` and signup overlays.
- Background `{colors.surface-1}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.md}`, padding 8px 12px. 1px `{colors.hairline}` border.
- Focused state retains the same surface; the focus ring is a 2px `{colors.primary-focus}` outline at 50% opacity.

### Status & Build Page

**`changelog-row`** — Each row in `/build` (changelog page) listing version, date, and changes.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body}`, rounded `{rounded.xs}`, padding 24px 0. 1px `{colors.hairline}` bottom rule.

**`status-badge`** — Small status pill.
- Background `{colors.surface-2}`, text `{colors.ink-muted}`, type `{typography.caption}`, rounded `{rounded.pill}`, padding 2px 8px.

### Navigation

**`top-nav`** — Sticky light bar with the Linear wordmark left, primary nav links centered, and a `button-secondary` ("Sign in") + `button-primary` ("Get started") pair right.
- Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-sm}`, height 56px. 1px `{colors.hairline}` bottom rule. `{shadow.xs}` for subtle separation from the page.

### Footer

**`footer`** — Dense link grid on `{colors.canvas}` with the Linear wordmark left.
- Background `{colors.canvas}`, text `{colors.ink-subtle}`, type `{typography.caption}`, padding 64px 32px. 1px `{colors.hairline}` top rule.

## Do's and Don'ts

### Do

- Anchor the system on `{colors.canvas}` (#fcfcfd) — the faint cool tint keeps the canvas from feeling sterile.
- Use `{colors.primary}` lavender ONLY for: brand mark, primary CTA, focus ring, link emphasis.
- Use the four-step surface ladder for hierarchy. Avoid skipping levels.
- Apply shadows on every lifted surface — `{shadow.sm}` on cards, `{shadow.md}` on featured cards, `{shadow.lg}` on dropdowns.
- Pair display weight 600 with body weight 400 — Linear resists 700+ display weights.
- Apply negative letter-spacing aggressively on display.
- Use product UI screenshots as the protagonist of every section.
- Compose CTAs as `{rounded.md}` 8px corners.
- Use atmospheric gradients and spotlight cards sparingly to add warmth to the light canvas.

### Don't

- Don't ship a dark-mode marketing page.
- Don't use lavender as a section background or card fill.
- Don't introduce a second chromatic accent (orange, pink, green for marketing).
- Don't rely on borders alone for depth — shadows are essential on a light canvas.
- Don't pill-round CTAs.
- Don't use `#ffffff` pure white as the canvas — the slight tint matters.
- Don't combine multiple bright accents in product screenshot mockups.
- Don't ship cards without shadows — flat cards disappear against the light background.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Desktop-XL | 1440px | Default desktop layout |
| Desktop | 1280px | Card grid 3-up maintained |
| Tablet | 1024px | Card grid 3-up → 2-up |
| Mobile-Lg | 768px | Pricing comparison becomes accordion; nav hamburger |
| Mobile | 480px | Single-column; display-xl scales 80px → ~36px |

### Touch Targets

- CTAs hold ≥40px tap height across viewports.
- Pricing tab pills hold ≥36px tap height; touch viewports grow to ≥44px.
- Form inputs hold ≥44px tap target on touch.

### Collapsing Strategy

- **Top nav**: links collapse to hamburger below 768px.
- **Card grids**: 3-up → 2-up at 1024px → 1-up below 768px.
- **Pricing comparison**: per-tier accordion below 768px.
- **Display type**: `{typography.display-xl}` 80px scales toward `{typography.display-md}` 40px on mobile.

### Image Behavior

- Product UI screenshots maintain aspect ratio and never crop.
- Customer logos in the marquee may collapse from 6-up to 3-up below 768px.

## Iteration Guide

1. Focus on ONE component at a time and reference it by its `components:` token name.
2. When introducing a section, decide first which surface lift it lives on AND which shadow level it carries.
3. Default body to `{typography.body}` at weight 400.
4. Run `npx @google/design.md lint DESIGN.md` after edits.
5. Add new variants as separate component entries.
6. Treat lavender as scarce: brand mark, primary CTA, focus, link emphasis.
7. Lead every section with a product UI screenshot.
8. Every lifted surface gets a border AND a shadow — not one or the other.

## Known Gaps

- The four-step surface ladder values are the conceptual inverse of the dark-mode ladder; exact hex values should be tuned with light-mode screenshots for perceptual matching.
- Shadow values are approximate and should be calibrated against real product screenshots on the light canvas.
- Form-field error and validation styling mirrors the dark-mode pattern with inverted colors.
- Dark mode is not documented because this system does not ship a dark theme.
- Linear's actual product UI uses a richer color-tag palette (red, orange, yellow, green, blue, purple) for issue priorities and project labels — those colors live in the in-product surfaces shown in mockups.
- The custom display, text, and mono families are proprietary; an open-source substitute is acceptable.
- Atmospheric gradient and spotlight card patterns are permitted but lack concrete token definitions — they should be authored as one-off `bg-gradient-*` utilities keyed to `{colors.primary}` at 3–10 percent opacity.
