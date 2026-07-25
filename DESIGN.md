---
name: QuickCart Desktop
description: "A compact, keyboard-first billing workspace for fast and dependable shop-counter operation."
colors:
  canvas: "#f4f3ef"
  surface-1: "#ffffff"
  surface-2: "#eceae3"
  surface-3: "#e2dfd5"
  border-standard: "#d8d5cc"
  border-frame: "#c3bfb4"
  border-strong: "#999487"
  ink: "#1d1e1b"
  ink-muted: "#4b4e46"
  ink-subtle: "#696c63"
  primary: "#292b26"
  primary-hover: "#171815"
  on-primary: "#ffffff"
  brand: "#4b6cb0"
  brand-hover: "#3b5690"
  brand-soft: "#e3e9f4"
  brand-foreground: "#21375d"
  success: "#25613c"
  warning: "#9a5a0a"
  destructive: "#b33a2e"
  info: "#3e6478"
  chart-green: "#3f7450"
  chart-terracotta: "#b86745"
  chart-steel: "#527187"
  chart-charcoal: "#42443e"
  search-highlight: "oklch(93% 0.14 95)"
  mrp-border: "#c4924c"
  mrp-background: "#f5e7d0"
  mrp-text: "#72470d"
  invoice-background: "#ffffff"
  invoice-text: "#171815"
  invoice-muted: "#4b4e46"
  invoice-accent: "#292b26"
  invoice-border: "#aaa596"
  invoice-table-header: "#eceae3"
typography:
  body:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  navigation:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "normal"
  secondary:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
  label:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.02em"
  page-title:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  financial-total:
    fontFamily: "InterVariable, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
rounded:
  control: "6px"
  panel: "8px"
spacing:
  unit: "4px"
  common: "8px"
  section: "12px"
  page: "12px"
  panel: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-compact:
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-workflow:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  compact-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  navigation-row:
    textColor: "{colors.ink-muted}"
    typography: "{typography.navigation}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "40px"
  navigation-row-active:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand-foreground}"
  table-row:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "42px"
  search-match:
    backgroundColor: "{colors.search-highlight}"
    textColor: "{colors.ink}"
---

# QuickCart Desktop Design System

## Overview

QuickCart is an offline-first point-of-sale application used repeatedly, at speed, on a desktop or shop laptop. Its design north star is **Counter Ledger**: the clarity and trust of a well-kept paper ledger, translated into a compact keyboard-and-mouse workspace. The interface should feel practical, stable, and unmistakably operational—not promotional, touch-first, or decorative.

This file is the canonical design contract for `apps/desktop`. The frontmatter is the normative token layer; the sections below explain how those tokens are applied. Runtime values live in `apps/desktop/src/renderer/src/index.css`. Any intentional token change must update both files in the same change. The machine-readable extension is `.impeccable/design.json`.

The product follows these priorities, in order:

1. **Transaction speed.** The common billing path must require minimal pointer travel and preserve a predictable keyboard sequence.
2. **Information clarity.** Users must be able to scan names, quantities, dates, states, and rupee amounts before reading supporting copy.
3. **Stable geometry.** Primary actions, totals, table columns, and navigation do not move because content changes.
4. **Operational trust.** Save, sync, loading, error, destructive, and offline-sensitive states are visible and specific.
5. **Compact comfort.** Density comes from a consistent scale, not from shrinking the root font, using CSS zoom, or making targets hard to operate.
6. **Progressive disclosure.** Frequent controls remain visible; secondary configuration belongs in menus, drawers, or detail views.

QuickCart currently has one supported light visual system. Do not introduce an isolated dark section or a second visual language without a product-level decision and a complete token set.

## Colors

The neutral system carries most of the interface. Use `canvas` for the application background, `surface-1` for working panels, and the stronger neutral surfaces only for grouping, hover, or selected regions. Use solid border tokens to establish hierarchy; avoid low-opacity hairlines for important boundaries.

Color roles are deliberately separate:

- `primary` is the dependable charcoal action color. It owns generic high-priority actions such as New Sale, Add Product, Add Row, Save Changes, and confirmations.
- `brand` is the restrained blue accent. It identifies QuickCart, active navigation, selection, and focus. It is not the default fill for every button.
- `success`, `warning`, `destructive`, and `info` communicate meaning. They must not be repurposed because they happen to look attractive in a composition.
- Sales retain a permanent `success` identity; estimates retain a permanent `info` identity. Apply that distinction consistently to billing tabs, route markers, transaction labels, and workflow-specific Save & Print actions. Always pair color with text or an icon.
- `search-highlight` is a narrow semantic exception: it marks the matching characters inside search results. It is not a brand color, active-row fill, or button hover.
- The MRP palette is reserved for MRP and price-comparison badges.
- Chart series use brand blue, green, terracotta, steel, and charcoal. Legends and direct labels are required whenever color alone would be ambiguous.

Invoice colors are isolated from the screen theme. Receipt and A4 output may reference only the `invoice-*` tokens for paper, text, rules, headers, and accents. A screen-theme change must never silently alter print legibility.

Text and interactive contrast must meet WCAG AA: at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for component boundaries and meaningful icons. Muted color is for supporting information, not required instructions, totals, or row identifiers. Do not use alpha variants such as `/40` or `/50` for critical text or borders.

## Typography

Inter Variable is the application typeface. System sans-serif is the fallback. Monospace is reserved for identifiers or diagnostic values; it is not a decorative counterpoint.

Use the frontmatter roles instead of choosing a size by eye:

- `page-title` names the current workspace or major section.
- `body` is the default for controls, tables, forms, and descriptions.
- `navigation` is the 15px label role for expanded sidebar destinations.
- `secondary` supports timestamps, hints, metadata, and secondary labels.
- `label` is for compact field labels, table headings, and short section kickers.
- `financial-total` is reserved for the most important total in the current task.

Application headings are compact and use slightly tightened tracking. Avoid marketing-scale display text inside routed workspaces. Use sentence case for actions and headings. Uppercase is limited to short table headings and category kickers; never use it for paragraphs or primary actions.

All monetary columns, quantities, dates, times, invoice numbers, and summary values use tabular numerals. Right-align comparable numeric columns. Format money through the shared rupee utilities; never assemble currency strings in a component. Large values must remain readable without changing card height: allow the value region to grow horizontally, use a safe minimum width, and avoid truncating the significant digits. Supporting labels may truncate before the amount does.

Product and customer names should normally occupy one line in dense lists. Use truncation with an accessible full-value affordance where space is constrained. Wrap only in a detail view designed for variable height; virtualized rows must not become taller because a name wraps.

## Layout

The release baseline is an effective **1280×650 CSS viewport at 100% Electron zoom**. The supported fallback is **1024×600**. Also verify 1366×700, 1600×900, and 1920×1080 so compactness does not become crowding or uncontrolled expansion. User zoom is a preference from 85% to 125%; 100% is the design reference, never a substitute for responsive layout.

The shared density contract is:

| Element                              |                                     Contract |
| ------------------------------------ | -------------------------------------------: |
| Application header                   |                                         48px |
| Standard sidebar                     | 232px default; resizable from 216px to 280px |
| Billing navigation rail              |                                         56px |
| Navigation row                       |                                         40px |
| Default / compact / workflow control |                           36px / 32px / 40px |
| Billing and standard table row       |                                         42px |
| Product list row                     |                                         60px |
| Page and panel inset                 |                                         12px |
| Common / section gap                 |                                   8px / 12px |

At a viewport height of 680px or less, page inset, panel inset, and section gap may reduce to 10px. Text and control heights do not shrink. At widths below 1120px, the standard sidebar becomes an overlay. Billing always uses the 56px icon rail with persistent tooltips. The receipt preview opens by default, remembers the operator’s preference, docks at 1280px and above, and becomes a right-side overlay below that width.

Every route must have one intentional scroll owner per region. The application root does not scroll. A page may have a scrolling content region, while a table or preview may own an internal scroll region; avoid nested scroll containers that compete for the wheel. Page-level horizontal scrolling is not allowed. A genuinely wide data grid may scroll inside its framed region while its page header and primary actions remain stable.

Use CSS Grid for aligned data and forms, Flexbox for one-dimensional command bars, and semantic `minmax()` columns for variable content. Billing columns are named by meaning—row actions, product, quantity, price, amount, checked, and optional count fields—not divided into arbitrary equal fractions. The product column expands; numeric controls keep practical fixed minimums.

Virtualized dimensions are part of the layout contract and must change with the visible row CSS:

- Product page rows: 60px.
- Billing product search rows: 54px.
- Customer rows: 44px.
- Sales and estimate transaction rows: 44px.

Use these route compositions:

| Surface                | Required composition                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Home                   | Compact metric region followed by operational charts or summaries; chart height yields on short viewports.                                |
| Products and Customers | One command bar, optional active-filter strip only when needed, then a framed dense list.                                                 |
| Sales and Estimates    | Quick statistics, sort/filter command bar, then the transaction table. Preserve this order until the planned dashboard redesign.          |
| Customer detail        | Compact identity/action header, tabs, then the selected operational workspace.                                                            |
| Settings               | 200px section navigation and a flexible content column with a 300–420px control region.                                                   |
| Reports                | A compact “Coming soon” state; do not imply unavailable reporting functions.                                                              |
| Onboarding             | Two-panel presentation on wide screens and a single readable form column when space is constrained; every step fits the supported height. |
| Product dialog         | Fixed header and footer, scrollable tab body, and no content behind the footer.                                                           |

## Elevation & Depth

QuickCart uses borders before shadows. Depth communicates stacking, not importance.

- **Level 0 — canvas and inline regions:** no shadow.
- **Level 1 — working panels and compact cards:** standard or frame border; normally no shadow, with `shadow-xs` allowed for a small detached summary.
- **Level 2 — dropdowns, popovers, menus, and hover previews:** strong border with `shadow-md`.
- **Level 3 — dialogs, drawers, and modal overlays:** strong frame, `shadow-lg`, and a clear backdrop.

Do not stack multiple shadowed cards inside another shadowed card. Do not use elevation to compensate for weak spacing or unclear grouping. Receipt preview docking is separated by a frame border; it receives a shadow only while behaving as an overlay.

Most interaction feedback is a color or border transition. Use the shared easing tokens and keep routine state changes between 150ms and 200ms. Movement should explain entry, exit, or reordering; it should not animate every row or total update. Avoid bouncy motion in billing entry, save, and destructive flows. Respect `prefers-reduced-motion` and keep the resulting interface fully understandable.

## Shapes

Controls use the `control` radius; panels, cards, menus, and dialogs use the `panel` radius. This restrained geometry is part of the ledger character. Do not drift toward large 16–24px radii for ordinary application surfaces.

Pills and full circles are semantic exceptions for statuses, avatars, radio-like markers, and switches. A rectangular action does not become a pill merely to appear friendly. Adjacent controls in a segmented group should share a continuous outer silhouette and visible internal separators.

Interactive targets use the density contract: 32px for compact secondary or icon actions, 36px by default, and 40px for exceptional workflow actions. An icon-only control requires an accessible name and a tooltip when its meaning is not universally obvious. Focus rings must follow the actual silhouette, remain visible against adjacent surfaces, and never be removed without an equivalent replacement.

## Components

### Ownership and extension

`components/ui` contains the Shadcn/Radix baseline. It is source-owned, but it is not the place for route-specific styling. Use components as generated whenever possible, apply semantic tokens through `index.css`, and compose application variants under `components/app-ui`—for example `CompactCard`. Edit a baseline primitive only when accessibility, behavior, or a visual contract must change for every consumer. Such a change requires a repository-wide usage review.

Do not copy a primitive into a feature folder to avoid understanding it. Do not scatter repeated `h-*`, `p-*`, arbitrary color, or radius overrides across pages. When a pattern appears three times, promote it to a token, a named variant, or an application wrapper.

### Shared primitives

- **Buttons:** Default actions are charcoal. Outline is the standard secondary action. Destructive is used only for irreversible or materially harmful operations. Compact buttons are 32px; default buttons are 36px; 40px is reserved for the primary workflow action. A button label states the outcome, such as “Save & Print,” not a vague “Continue.”
- **Inputs and selects:** Default to 36px with body text. Labels remain visible outside the field; placeholders show format or example, never the only label. Invalid state includes specific inline text and `aria-invalid`, not color alone.
- **Cards:** Use `CompactCard` for dense application panels. Card padding does not create page layout; the parent owns inter-panel spacing. Avoid nested cards when a divider or section heading is sufficient.
- **Dialogs:** Header and footer stay visible; the body owns vertical scrolling. Content must fit within the 650px baseline with viewport-safe maximum height. Focus is trapped, Escape closes when safe, and focus returns to the trigger. Destructive confirmations name the object and consequence.
- **Tabs:** Use tabs only for peer views of the same object. The shared tab list uses the control radius, a standard border, compact internal padding and spacing, muted inactive labels, and a brand-soft active surface. Sale and estimate tabs may replace only the active color with their semantic success or info treatment. Tab bars remain one compact row; overflow scrolls horizontally without widening the page.
- **Tooltips:** Support unfamiliar icon-only controls and billing-rail navigation. They never contain essential instructions and never replace accessible names.
- **Badges and statuses:** Use short nouns or past-participle states. Preserve the semantic color mapping and include readable text. Avoid using badges as decoration.

### Data and financial components

Tables have a distinct header, aligned columns, 42–44px rows, and a stable action region. Row hover is subtle; keyboard focus and selected state must be equally clear. Actions appear on hover **and** focus/selection so keyboard users do not lose functionality. Loading, empty, error, and end-of-results states occupy the table frame without shifting surrounding controls.

Summary cards put the label and amount in one deliberate horizontal composition when width permits. The amount owns the flexible or right-aligned region, uses tabular numerals, and must handle large Indian-formatted values. Do not stack a small label above an amount when doing so leaves unusable horizontal space or causes the number to collide with neighboring cards.

### Billing workspace

Billing is the highest-priority interaction surface and follows a fixed hierarchy:

1. Billing tab bar with type identity, sync state, new-tab action, and close.
2. Transaction header with sale/estimate identity, number, customer, date/time, balance context, and secondary transaction actions.
3. One compact line-item toolbar; the count-column toggle remains directly visible, not hidden in an overflow menu.
4. Semantic line-item grid and product search.
5. Notes and payment information in scrolling content.
6. Stable 52px summary footer with total and Save & Print.
7. Optional preview/customer panel, open by default and remembered.

The quantity control reads `− quantity +`. Product search supports Arrow Up/Down, Enter to select, Escape to dismiss, and a predictable transition to the next empty row. Its sort/filter bar stays slimmer than a data row, the dropdown clamps to the available viewport, and matched text uses `search-highlight`. Search results keep a stable 54px virtualized height.

Sale and estimate identity is persistent, but generic creation actions remain charcoal. “Save PDF” on an unsaved bill must explain that the bill must first be saved; it must never fail silently. Sync feedback uses explicit saving, saved, and error language without changing the footer’s geometry.

### Feature compositions and states

Product dialog modes—view, edit/add, history, and transactions—share one shell. Tabs stay in the fixed header, feature content scrolls inside the body, and the footer belongs only to the active mode. The edit form may use a preview column on wide dialogs, but fields must remain usable when that column is absent.

Empty states explain what is missing and, only when useful, provide the next action. Loading states preserve the final layout’s footprint. Error states say what failed and provide a bounded recovery action. Success feedback confirms the completed result. Never display a spinner without a label when the wait can be confused with an unresponsive app.

All interactive work must be possible by keyboard. Use native elements and Radix behavior before custom event handling. Focus order follows the visual task order; Enter must not trigger an unrelated destructive or final action. Icon buttons need `aria-label`; form errors are programmatically associated; dialogs and drawers announce their titles. Color is never the only state indicator.

## Do's and Don'ts

### Do

- Start a feature from the operator’s job and the required information hierarchy, then choose the closest route composition above.
- Reuse semantic tokens and shared components; update the design contract when a genuinely new reusable role is introduced.
- Keep frequent actions visible and stable. Put rare configuration behind progressive disclosure.
- Design and test populated, empty, loading, error, disabled, long-name, large-amount, and keyboard-focus states together.
- Preserve sale-green and estimate-steel identity across every transaction surface while keeping generic primary actions charcoal.
- Keep print styles isolated and verify both 80mm receipt and A4 output after invoice changes.
- Update a virtualizer estimate whenever the corresponding row height changes.
- Use `cn()` for conditional classes and shared rupee/date utilities for display formatting.

### Don't

- Do not use app zoom, CSS `zoom`, a smaller root font, or transform scaling as a layout system.
- Do not use brand blue for generic primary actions, success green for navigation, or the search-match yellow outside matched text.
- Do not invent new surface colors, shadows, radii, or one-off heights inside a feature.
- Do not hide a common billing control in a menu merely to make a toolbar look cleaner.
- Do not truncate money, rely on hover-only actions, or let wrapped text break virtualized row geometry.
- Do not add large marketing headings, oversized empty states, glass effects, gradients, or floating capsules to routed workspaces.
- Do not modify Shadcn baseline files for one screen; prefer application wrappers or feature composition.
- Do not allow screen-theme changes to leak into invoice or receipt output.

### UI change gate

Before merging a user-facing feature or refactor:

1. Verify the actual shop `innerWidth × innerHeight`, then 1280×650, 1366×700, 1024×600, 1600×900, and 1920×1080.
2. Verify 90%, 100%, and 110% Electron zoom; 100% must be fully usable.
3. Check for unintended page-level horizontal scroll and competing nested scroll regions.
4. Exercise mouse and keyboard paths, visible focus, tooltips, dialogs, and Escape behavior.
5. Test empty, loading, error, populated, long-content, large-rupee, disabled, and destructive-confirmation states.
6. For billing, test preview open/closed, count columns on/off, multiple tabs, sync failure, new and edited bills, print, and PDF export.
7. For virtualized lists, scroll quickly in both directions and verify total height, focus, selection, and pagination.
8. Run formatting, lint, typecheck, tests, and the production build.

If an upcoming feature requires breaking one of these rules, document the user need, the affected surfaces, and the replacement contract in the same pull request. Exceptions are decisions, not local styling shortcuts.
