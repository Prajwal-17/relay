# Desktop refinement and mobile handoff

## Plan and scope

Relay is an operational workspace for a biller serving waiting customers. Refine the existing
Counter Ledger identity: coordinated warm neutrals, white working surfaces, deep charcoal actions,
and terracotta focus. Success means the active field, selected result, amounts, and next action
are immediately recognizable, with the same familiar keyboard sequence and compact geometry.

1. Coordinate canvas, grouping surfaces, and borders; separate dividers from control boundaries.
2. Define distinct hover, pressed, selected, and focus treatments. Keep readable supporting text.
3. Apply the reusable contract to buttons, inputs, selects, tabs, checkboxes, switches, and overlays.
4. Preserve dimensions, virtualized row estimates, product search highlights, checked-row status,
   labels, routing, persistence, and isolated receipt/invoice colors.
5. Validate with static palette checks, desktop lint, and typecheck. Per the user’s latest
   instruction, do not run desktop builds or E2E tests. Record actual results at handoff.

This is a shared styling refinement, not a replacement of every route's layout. No glass, grain,
animated totals, palette editor, or new UI framework. Existing feature overrides remain intentional
where they represent billing status or a specialized control; new overrides should use semantic roles.

## What is global now?

`DESIGN.md` is the normative desktop contract. Desktop `index.css` contains its runtime values.
Color roles are global within desktop; component classes reference those roles instead of hex values.
The input role deliberately differs from the divider role. Shadows and pressed feedback are also
centralized. Shared primitive changes apply to every consumer, not one screen.

## Mobile: same identity, separate interaction design

Use the same **semantic palette** for desktop and mobile: canvas, surface, ink, supporting text,
control boundary, selection, charcoal action, terracotta focus, and genuine status colors. A user
should recognize Relay when moving from the counter to their phone. Do not share desktop CSS or
assume identical pixels look identical on every phone; inspect real devices in daylight and indoors.

The separate mobile development branch uses its own `global.css` and native palette resolver. They are intentionally
unchanged in this desktop-only pass. When adopting the new palette, extract the approved color roles
into a platform-neutral token source (for example `packages/design-tokens/colors.json`) and generate
or map both desktop OKLCH CSS variables and native-safe sRGB values from it. Keep the generator simple and
check that outputs match the source. Do not import renderer CSS into React Native or build a runtime
palette engine for one theme. OKLCH is the desktop authoring and runtime format; native consumers can receive derived hex values.

Share color meaning, typeface, restrained corner shapes, and terminology. Keep platform-specific:

- Desktop: 32–40px controls, compact rows, keyboard focus, pointer hover, stable totals and print.
- Mobile: comfortable platform touch targets (at least the existing 44-unit contract), generous
  separation, readable text that supports system scaling, and visible pressed feedback.
- Mobile Money: date and received/paid context first, easy numeric amount entry, reachable actions,
  and form actions that stay accessible above the software keyboard and device safe area.
- Connectivity: the mobile Money workflow is server-backed. Show saving, saved, failed, and retry
  explicitly; preserve in-progress input and do not imply an offline write has been committed.
- Use native shadows/elevation sparingly on sheets and dialogs. Keep working forms opaque. A desktop
  inset button highlight is optional on mobile; it is not a requirement for brand consistency.
- Use text/icons with status colors. Avoid hover-only help, clipped large amounts, and hidden
  essential labels. Do not compress desktop billing tables into a phone-width grid.

Validate the mobile adoption separately: small phones, keyboard open, larger system text, long names,
large Indian-formatted amounts, light/dark OS chrome around the supported light theme, interrupted
entry, and slow/failed requests. Dark mode requires a full separately validated palette.

## Detailed decisions

| Area         | Desktop decision                                                                                                                       | Mobile consequence                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Color format | Author and ship screen colors in OKLCH. Lightness, chroma, and hue can be adjusted independently. Keep legacy print tokens isolated.   | A future shared OKLCH source produces sRGB values for native consumers; do not maintain a separately chosen mobile palette. |
| Gamut        | Keep new palette values within sRGB so ordinary shop monitors can display the intended color. Avoid relying on wide-gamut saturation.  | Validate conversion rather than clipping channels blindly; inspect physical Android and iOS displays.                       |
| Neutral ramp | Coordinate large surfaces and dividers around a restrained warm hue; increase distinction by role rather than adding arbitrary shades. | Retain surface hierarchy, but adjust spacing and elevation for a small screen.                                              |
| Typography   | Inter, existing size scale, tabular amounts; main/secondary/placeholder roles remain legible.                                          | Same family, native font scaling, no tiny desktop labels.                                                                   |
| Accent       | Terracotta identifies focus; charcoal identifies primary actions.                                                                      | Pressed feedback substitutes for hover; selected state must persist.                                                        |
| Status       | Retain existing sales/estimate identity and completed/partial/error meaning.                                                           | Labels/icons accompany color; saving and retry remain explicit.                                                             |
| Controls     | White fields, visible boundaries, solid focus, steady pressed feedback, consistent radii.                                              | Touch sizes are independent of desktop density.                                                                             |
| Depth        | Flat working surfaces; restrained button inset highlight; soft shadows on floating surfaces.                                           | Use native elevation/shadows only where layers overlap.                                                                     |
| Motion       | Short color/border transitions; no scaling of billing controls; reduced-motion support.                                                | Follow native interaction expectations without slowing amount entry.                                                        |
| Layout       | Preserve compact rows, stable footer, keyboard order, and preview behavior.                                                            | Compose Money screens for touch and the software keyboard, not desktop table parity.                                        |
| Ownership    | CSS semantic tokens and reusable primitive contracts; no page-specific hex patches.                                                    | Extract a shared platform-neutral palette during mobile adoption, not shared DOM components.                                |
| Verification | Check contrast, lint, and typecheck; do not run desktop builds or E2E tests.                                                           | Separately check small phones, system text size, daylight, interrupted entry, and failed requests.                          |

Changing color notation alone does not improve appearance. The OKLCH palette must still earn its
quality through coordinated ramps, clear information hierarchy, consistent controls, and user testing.

## Color notation reference

The OKLCH syntax and conversion model follow [CSS Color 4](https://www.w3.org/TR/css-color-4/#ok-lab).
The screen palette uses a 110° neutral hue with low chroma and explicit lightness steps. Existing
brand/status hues are converted without intentionally changing their identity. The yellow search
highlight's chroma is bounded to sRGB. Print values remain independent so a screen refresh does not
change a receipt's colors.

## Validation policy

The user requested no desktop builds or E2E tests on 18 September 2026. Further validation
is limited to static checks, lint, typecheck, and focused non-E2E tests when needed.

## Earlier validation results

These checks ran before that instruction; they have not been rerun as part of recording it.

- Desktop lint: passes with 41 existing warnings (outside the edited files); no errors.
- Desktop typecheck and production build: pass.
- Billing renderer suite: 15 files, 87 tests pass.
- Palette: 45 foreground/background checks pass. All opaque OKLCH tokens fit sRGB;
  normative frontmatter values agree with runtime values (including aliases).
- Representative contrast ratios: supporting text on partial-row fill 4.64:1;
  placeholder on white control 5.98:1; control boundary on selection 3.22:1;
  terracotta focus on partial-row field 3.84:1.
- Isolated renderer smoke: 1280×650, 1024×600, 1366×700, 1600×900, 1920×1080;
  no page-level horizontal overflow and the footer stays at the viewport bottom.
  The preview is dismissed before using underlying actions at the narrow overlay breakpoint.
- Product-search keyboard selection, checked-row state, count-column toggle, and product dialog
  open/Escape dismissal checked using sample data in a temporary database.
- Invoice CSS token values are unchanged. Native print/PDF output, Electron zoom settings,
  physical shop displays, and mobile devices were not exercised in this pass.

## App-wide typography and hierarchy pass

The follow-up extends shared type roles through the application shell, dashboard cards, product
forms/details, customer sections, Sales/Estimate summaries, settings, onboarding steps, reports,
and dialogs. It retains Inter and the approved OKLCH palette. No additional accent family is needed:
terracotta supports focus, teal/berry identify workflows, and olive/gold remain contextual metadata.

- Workspace/dialog titles: 18px semibold; section/card headings: 14px semibold.
- Field labels: 14px medium; supporting metadata: 12px regular with readable line spacing.
- Keep names and important amounts strong; reduce competing bold and uppercase metadata.
- Keep placeholders regular-weight, numeric dashboard statistics tabular, and search fields white.
- Render calculated billing amounts as figures rather than editable fields; retain row geometry.
- Remove product-dialog button scaling and keep solid dashboard keyboard focus.

For mobile, these accent families are sufficient. Share their semantic roles and OKLCH source, then
resolve native-safe colors as described above. Do not copy desktop's 12px metadata scale blindly:
use the mobile platform's readable text styles, system font scaling, touch spacing, and pressed
feedback. This pass changes desktop only; mobile requires its own device validation before adopting
new tokens. No alternate font download, new color family, or theme picker is introduced.

Validation for this follow-up: `pnpm lint`, `pnpm typecheck`, and `git diff --check` passed.
No desktop build, E2E tests, or fresh visual viewport review ran for this typography update.
Earlier build and viewport results above refer to the preceding palette pass. Desktop builds
and E2E tests remain excluded by the user's instruction.

## Contextual surfaces on current master

This pass starts from `origin/master` at `4f45a52` on `feat/desktop-design-refinement`, carrying
forward the approved desktop palette and typography. The original design worktree is preserved.
Master's title bar, changelog, and other functionality remain intact.

Shared neutral controls now derive hover, pressed, selection, text, border, and focus colors from
explicit canvas, panel, overlay, selected, complete, partial, and inverse contexts. Contextual
colors recompute in CSS using OKLab mixing; palette sources remain OKLCH. Green/amber billing
fields preserve their status fills, and every shared popup resets to a readable light context.
The title bar uses the inverse context; its native actions and drag regions are unchanged.

For mobile, share these semantic context names and the source palette. Resolve each finite recipe
to native-safe sRGB at token generation time, then select the appropriate context in native
components. Do not run a background-sampling engine or copy CSS variables into native styles.
Mobile sheets/menus should establish their own context just like desktop portals. Touch feedback,
platform elevation, accessibility text scaling, and physical-device contrast still need independent
validation. No mobile implementation is included in this desktop branch.

Validation for the contextual-surface pass:

- `pnpm lint`: passes, with 41 existing warnings in unchanged files.
- `pnpm typecheck`: passes with the latest master's locked dependencies.
- `pnpm exec vitest run src/renderer/src/styles/surfaces.test.ts src/renderer/src/features/billing`:
  16 files and 108 tests pass, including 21 context/contrast/gamut checks.
- `git diff HEAD --check`: passes.
- No desktop build, E2E execution, native rebuild, or fresh visual viewport review was performed.
  The color tests validate the declared recipes; actual display rendering still needs visual review.

## Development icon correction

Development now uses a charcoal DEV icon across renderer branding, favicon, native windows, and
native development packages. Production retains terracotta. The renderer selects via Vite MODE;
main-process selection uses the initialized runtime MODE. Development packaging now invokes
`build:dev` so the compiled renderer agrees with the dev installer. macOS also sets its Dock icon.
Restart Electron to refresh native icons. Seven targeted native/renderer regression tests pass;
typecheck and lint pass (41 existing warnings). Icon decoding and packaging references were checked.
No desktop build or E2E test was run, so native launcher appearance has not been exercised here.
