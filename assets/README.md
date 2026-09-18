# Relay assets

This directory is the shared source of truth for the Relay app icon.

- `desktop/app-icon.svg` preserves the Continuum mark and standard geometry.
- `desktop/app-icon-small.svg` uses the heavier small-size geometry for app chrome and exports at 48px and below.
- `desktop/icon.png`, `icon.ico`, and `icon.icns` serve Electron and native launchers.
- `mobile/` contains Android adaptive foreground/background vectors and opaque square store PNGs.

The white mark sits on Relay's terracotta `counter-accent`. This is a fixed brand treatment;
icons do not inherit hover, status, or surrounding surface colors. The charcoal workspace remains
unchanged. Existing in-app imports automatically pick up the recolored SVGs.

## Regenerate

From the repository root:

```sh
python3 assets/generate-icons.py
```

Requires Python 3 with Pillow and ImageMagick's `convert`. This exports assets only; it does not
build the app. The script reads `counter-accent` and `on-primary` from the renderer's OKLCH tokens,
converts them to sRGB, and updates all SVG and native raster exports together. SVG geometry is
preserved. Native/export formats use resolved sRGB colors for reliable platform decoding.

Windows exports include 16, 20, 24, 32, 40, 48, 64, 96, 128, and 256px images. macOS exports include
16–1024px representations, including Retina sizes. Desktop PNG is 512px with transparent rounded
corners. Mobile 1024px and Play Store 512px PNGs have opaque square backgrounds; Android adaptive
foreground keeps its existing safe-zone placement. Mobile asset updates do not change mobile UI
colors or platform configuration. Native launcher appearance must be checked when packaging;
operating systems can cache installed app icons.

## Development identity

Development uses `app-icon-dev.svg` / `app-icon-dev-small.svg` and `icon-dev.png` / `.ico` / `.icns`:
charcoal (`primary`) with the white Relay mark and vector DEV lettering. Production retains terracotta.
The same export command generates both sets. Renderer imports go through `lib/appIcon.ts` and select
by Vite `MODE`; native windows use the initialized main-process `MODE`. Development packages copy
the dev icon as `relay-icon.png` and use the dev ICO/ICNS for their launcher. Restart Electron after
changing native icons; renderer hot reload cannot replace an existing window's taskbar icon.
