# QuickCart Mobile

Expo/React Native application for the QuickCart mobile prototype.

## Data contract

- [QuickCart Drizzle database schema](https://github.com/Prajwal-17/pos/blob/master/apps/desktop/src/main/db/schema.ts)

## Stack

- Expo SDK 54, React Native, and Expo Router
- NativeWind 4 with Tailwind CSS 3
- CVA, `clsx`, and `tailwind-merge` for reusable component variants
- Lucide React Native icons

Theme values are defined directly in `tailwind.config.js`; CSS custom properties are not used.
The only CSS file contains the three Tailwind directives required by NativeWind.

## Commands

Run from the repository root:

```bash
pnpm --dir apps/mobile start
pnpm --dir apps/mobile android
pnpm --dir apps/mobile ios
pnpm --dir apps/mobile web
pnpm --dir apps/mobile lint
pnpm --dir apps/mobile typecheck
```

Application routes live under `src/app`. Shared component utilities live under `src/lib`.
