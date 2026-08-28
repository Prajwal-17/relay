# AGENTS.md

Instructions for coding agents working in the QuickCart repository.

## Sources of truth

- [README.md](README.md): repository setup and entry points
- [apps/desktop/README.md](apps/desktop/README.md): desktop runtime and operations
- [DESIGN.md](DESIGN.md): canonical UI, density, accessibility, and viewport contract
- Source code and package scripts override stale prose when they disagree

Keep documentation concise. Update the relevant source-of-truth document when a change alters a
public command, architectural invariant, runtime assumption, or design token.

## Working agreement

1. Inspect the target code and nearby tests before editing.
2. Check `git status` and preserve unrelated or user-authored changes.
3. Prefer the smallest change that fits the existing architecture.
4. Use `rg`/`rg --files` for discovery and existing utilities before creating new ones.
5. Do not perform destructive Git or filesystem operations without explicit authorization.
6. Validate in proportion to risk and report what was actually run.

Run app-specific commands from `apps/desktop`, or use `pnpm --dir apps/desktop <command>` from the
root. Do not run a repository-wide formatter over an unrelated dirty worktree; format only the
files you changed.

## Repository map

```text
apps/desktop/src/
  main/       Electron lifecycle, Hono API, SQLite, native handlers
  preload/    contextBridge APIs for the renderer
  renderer/   React application
  shared/     Cross-process types, schemas, constants, utilities
packages/
  eslint-config/
  typescript-config/
```

TypeScript aliases:

- `@/*` → `apps/desktop/src/renderer/src/*`
- `@shared/*` → `apps/desktop/src/shared/*`

## Runtime invariants

- Electron configures the development `userData` path before importing modules that call
  `app.getPath()`. Keep those modules lazily imported after path setup.
- The main process initializes SQLite, then forks `src/main/server.ts`.
- The renderer calls the local Hono API through `src/renderer/src/lib/apiClient.ts`.
- Development uses `QuickCart-Dev` and port `4723`; production uses `QuickCart` and port `4722`.
- Renderer routing must use `createHashRouter`; `BrowserRouter` breaks packaged `file://` loads.
- The preload bridge is for native capabilities only. Do not bypass context isolation or enable
  renderer Node integration.
- Packaged migrations are read from `process.resourcesPath/drizzle`; keep `drizzle/` included in
  Electron Builder resources.

## Backend conventions

Every API feature under `src/main/modules/<feature>/` follows:

```text
*.controller.ts  HTTP routes and validated transport input
*.service.ts     Business rules and orchestration
*.repository.ts  Drizzle queries and persistence
*.schema.ts      Feature-specific Zod input schemas when needed
*.types.ts       Feature-specific types when needed
```

- Validate request input at the controller boundary with the existing Zod middleware.
- Keep database queries out of controllers and business decisions out of repositories.
- Return endpoint result objects directly. Successful responses do not have a global wrapper.
  Errors use `{ "error": { "message": "..." } }`, with an optional error code.
- Use `AppError` or `HTTPException` for expected failures; let the server error handler map them.
- Pagination uses `pageNo`, `pageSize`, and nullable `nextPageNo`. Preserve the established shape.

### Data rules

- Store money as integer **paisa**. Use `paisaToRupees`, `rupeesToPaisa`, `formatRupee`, or
  `paisaToRupeeString` from `src/shared/utils/utils.ts`; do not store floating-point rupees.
- Store fractional quantities as integer milli-units through `src/shared/utils/milliUnits.ts`.
- Regenerate a product's `productSnapshot` with `generateProductSnapshot()` when its identifying
  fields change. Historical sale and estimate items retain their stored snapshot.
- Products use soft delete for normal user flows. Hard delete is an explicit, separate operation.
- SQLite uses WAL mode. Schema changes require a Drizzle migration and migration-path verification
  in both development and packaged builds.

## Renderer conventions

- TanStack Query owns server state; Zustand owns client-only workflow state. Do not mirror query
  data into a global store without a specific need.
- Use `apiClient` for renderer HTTP calls and preserve its `ApiError` behavior.
- Billing uses incremental row sync with an 800 ms debounce. Maintain row sync states and call
  `flushSync()` before navigation, printing, or export where pending changes would matter.
- When visible virtualized row heights change, update the corresponding virtualizer estimate in
  the same change.
- Preserve keyboard flow, focus visibility, loading, empty, error, long-name, and large-amount
  states in operational screens.

### UI system

- Read `DESIGN.md` before UI work. Runtime tokens live in
  `src/renderer/src/index.css`; intentional token changes must update both files.
- Use shared semantic tokens and density variants instead of page-level hard-coded color and size
  overrides.
- Shadcn components under `src/renderer/src/components/ui/` are vendored source, but edits must
  represent a reusable primitive contract. Prefer composition, a wrapper, or a CVA variant for
  feature-specific behavior. Do not modify a base primitive to fix only one screen.
- Use `cn()` from `@/lib/utils` for class merging.
- Keep invoice and receipt styles isolated from the screen theme.
- Baseline verification is 1280×650 at 100% zoom; 1024×600 is the supported fallback.

## Testing and handoff

Minimum checks for renderer or shared TypeScript changes:

```bash
cd apps/desktop
pnpm lint
pnpm typecheck
```

Also run:

- `pnpm test --run` for business logic, repositories, schemas, utilities, or regression fixes
- `pnpm build` for Electron configuration, preload/main boundaries, routing, or packaging-sensitive
  changes
- Targeted viewport, keyboard, print, and dialog checks for UI work as defined in `DESIGN.md`

Integration tests use in-memory SQLite and helpers from `src/main/tests/helpers/index.ts`. Add or
update tests with behavior changes; do not weaken assertions merely to make a change pass.

## Common pitfalls

- `better-sqlite3` has separate Node and Electron ABIs. Use `pnpm rebuild:node` for Node scripts
  and `pnpm rebuild:electron` for Electron.
- Development and production deliberately use separate app names, data directories, and ports.
- A product row's displayed height and virtualizer estimate must agree.
- Existing invoice records depend on stored snapshots; do not rebuild their labels from the
  current product record.
- App zoom is a user preference, not a layout mechanism.
