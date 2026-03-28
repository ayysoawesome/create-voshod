# Development Workflow (EN)

This document explains how to extend `create-voshod` safely and predictably.

## 1) Architecture map

- `domain`: core types and contracts.
- `application`: orchestration, strategies, generation steps, patch contracts.
- `infrastructure`: process/fs/codegen adapters.
- `presentation`: CLI prompts and app wiring.

Main extension points:

- Options model: `src/domain/generation/ProjectOptions.ts`
- Prompt choices/questions: `src/presentation/cli/prompts/promptChoices.ts`, `src/presentation/cli/prompts/PromptService.ts`
- React strategy and generation flow: `src/application/strategy/ReactFrameworkStrategy.ts`, `src/application/usecases/GenerateProjectUseCase.ts`
- React dependency planning: `src/application/react/dependency-planning/ReactDependencyPlanner.ts`
- Patch contract: `src/application/patches/IReactPatchService.ts`
- FSD vs simple path profile: `src/domain/generation/ReactLayoutProfile.ts`
- Zonal mutation policy + scaffold ingest: `src/application/react/codegen/FileMutationPolicy.ts`, `scaffoldIngestPaths.ts`
- Toolchain editors (Vite via ts-morph, tsconfig merge, HTML): `src/infrastructure/codegen/editors/`, Vite contributions: `src/infrastructure/codegen/vite/`
- Formatter (Prettier vs Biome): `src/application/react/patches/toolchain/FormatterPatchService.ts`, post-install `src/application/steps/FormatGeneratedProjectStep.ts`, deps in `ReactDependencyPlanner`
- Generated API transport: `src/application/react/patches/http/SharedApiPatchService.ts` and templates under `src/application/react/patches/http/codegen/`

## 2) Add a new option

Example: add a new option axis like `stateManager`.

1. Update domain types in `src/domain/generation/ProjectOptions.ts`.
2. Add prompt choices in `src/presentation/cli/prompts/promptChoices.ts`.
3. Add prompt question in `src/presentation/cli/prompts/PromptService.ts`.
4. Use option in generation logic:
   - dependency-only logic -> `ReactDependencyPlanner`;
   - file/code changes -> implement/update patch service(s).
5. Register any new patch service in CLI wiring (`src/presentation/cli/app/CliApplication.ts`).
6. Add/update tests.
7. Run validation pipeline (`npm run test`, `npm run build`). For CLI smoke tests and playground scripts, see [testing.md](./testing.md).

### Validation library (`validationLibrary`)

`validationLibrary: "zod" | null` controls runtime validation for API responses and env (`SharedApiPatchService`, `SharedConfigPatchService`). The `zod` package is added only when Zod is selected. Zod is **not** chosen via the `libs` multiselect—only via this option.

### HTTP client (`httpClient`)

`httpClient: "axios" | "ofetch" | null` selects the transport for the generated stack under `resolveReactLayoutProfile()`’s `apiRoot` (`SharedApiPatchService`):

- **`axios`** — `axios.ts` instance + `baseService.ts`; `errorAdapter` uses Axios error shapes.
- **`ofetch`** — `baseService.ts` built on ofetch (no separate client module); prod dependency `ofetch`.
- **`null` (Fetch API)** — `httpClient.ts` (thin wrapper around `fetch`) + `baseService.ts`; no extra HTTP package.

`index.ts` re-exports the right entry points per mode (including optional TanStack Query and validation files). Dependency wiring: `ReactDependencyPlanner` adds a prod dependency only for `"axios"` or `"ofetch"`.

Prompt labels: `promptChoices.ts` (`HTTP_CLIENT_CHOICES`).

### Formatter (`formatter`)

`formatter: "prettier" | "biome"` configures formatting and related scripts in the generated app (`FormatterPatchService`, registered right after `ToolchainPatchService` in `CliApplication`):

- **Prettier** — ensures `package.json` scripts `format` and `format:write` run `prettier --write .`; writes `.prettierrc`. `ReactDependencyPlanner` adds dev dependency `prettier`. The default Vite `react-ts` ESLint setup is left as-is.
- **Biome** — writes `biome.json`, sets scripts `lint` (`biome check .`), `format` / `format:write` (`biome format` / `biome format --write .`), strips ESLint-related `devDependencies` from the scaffolded `package.json`, and adds `@biomejs/biome`. `PruneViteReactTsScaffoldStep` removes `eslint.config.js` when Biome is selected.

After `InstallDependenciesStep`, `FormatGeneratedProjectStep` runs `packageManager run format:write` in the new project so the tree is formatted with whichever tool was configured.

### Generated tree layout (`architecture`)

`architecture: "simple" | "fsd"` is resolved via `resolveReactLayoutProfile()` and drives entry, styles, API, and routing:

- **`fsd`**: entry `src/app/index.tsx`, styles `src/app/styles`, API `src/shared/api`, config `src/shared/config`, TanStack uses `src/app/router/*`, pages under `src/pages/...`, generated app code uses `@/*` (Vite + tsconfig patched by `ToolchainPatchService`).
- **`simple`**: flat `src/` — entry `src/index.tsx`, styles `src/styles`, API `src/api`, config `src/config`, providers `src/providers`, TanStack uses colocated `src/router.tsx`, pages still under `src/pages/...`; empty `assets`, `components`, `hooks`, and `utils` dirs are seeded with `.gitkeep` in `BaseReactFilesFactory`.

React strategy step order: scaffold → compose (ingest + patches) → plan dependencies → write files → **`PruneViteReactTsScaffoldStep`** (removes unused on-disk `react-ts` template files; also drops `eslint.config.js` when Biome is selected) → install dependencies → **`FormatGeneratedProjectStep`** (`format:write` in the generated project).

Patch order in `CliApplication`: toolchain → **`FormatterPatchService`** → styling → `SharedConfig` → `SharedApi` → `AppProviders` → router patches.

Router patches must **not** change the HTML entry or import global styles.

After `ScaffoldBaseProjectStep`, `ComposeCodeStep` uses `IScaffoldFileReader` to load `vite.config.ts`, `tsconfig.app.json`, and `index.html` from disk so zonal patches extend the official Vite template instead of replacing it blindly.

### File mutation policy (zonal vs full)

- `vite.config.ts` — **zonal** policy; owners: `ViteConfigEditor` and `applyViteContributions` in `ToolchainPatchService`.
- `tsconfig.app.json` — **zonal (paths)**; `mergeTsConfigAppPaths` in `ToolchainPatchService` (JSONC parse, same as Vite template).
- `index.html` — **zonal**; scaffold ingest and `IndexHtmlScriptWriter` in `ToolchainPatchService`.
- Root App entry: `App.tsx` (simple) or `src/app/App.tsx` (FSD) — **zonal (router)**; `AppProvidersPatchService` owns the shell; router patches use `morphAppForTanstackRouter` and `morphAppForReactRouterDom`.

See `ZONAL_ONLY_RELATIVE_PATHS` and `zonalAppComponentPath()` in `FileMutationPolicy.ts`. Do **not** full-replace these from feature patches without an explicit decision.

### Full-replace registry

Paths where codegen **intentionally** uses a whole-file `upsertFile` (one owning patch per path for the current layout):

- **`FULL_REPLACE_OK_PREFIXES`** — e.g. `src/pages/`, `src/shared/api/`, `src/shared/config/`, `src/api/`, `src/config/`, `src/app/router/`, `src/app/layouts/`, `src/providers/`, `src/app/providers/`, `src/styles/`, `src/app/styles/`, plus simple-layout dirs `src/assets/`, `src/components/`, `src/hooks/`, `src/utils/` (`.gitkeep` today; same roots for future files).
- **`FULL_REPLACE_OK_EXACT_PATHS`** — `src/router.tsx`, `src/shared/index.ts`, `src/index.tsx`, `src/app/index.tsx`.

Use `isFullReplaceOkPath(relativePath, profile?)`: returns `false` for zonal paths and for `profile.appComponentPath`. Paths outside the registry return `false` — when you add a new fully generated file, **extend** the prefix or exact list in `FileMutationPolicy.ts` and note the owner in the constant’s comment.

### Adding a new Vite contribution

1. Implement `IViteConfigContribution` under `src/infrastructure/codegen/vite/contributions/`.
2. Register an instance in `ORDERED_CONTRIBUTIONS` inside `applyViteContributions.ts` (order: `defineConfig` import → React → Tailwind (when enabled) → aliases).
3. Touch `vite.config.ts` only through `ViteConfigEditor` idempotent `ensure*` APIs — no monolithic templates from unrelated patches.
4. Add a before/after unit test (see `ViteConfigEditor.test.ts`).

When extending generated UI, cover both branches (`RouterPatches.architecture.test.ts`, `PatchServices.test.ts`). For router tests, apply `AppProvidersPatchService` before the router patch to mirror `CliApplication` ordering.

## 3) Add a new library

Example: add `react-i18next`.

1. Add library value to `AdditionalLibrary` in `src/domain/generation/ProjectOptions.ts`.
2. Add it to `ADDITIONAL_LIBRARY_CHOICES` in `src/presentation/cli/prompts/promptChoices.ts`.
3. Ensure dependency planning:
   - if library can be installed directly from selected `libs`, planner already covers it;
   - if extra paired dependencies are needed, add conditional logic in `ReactDependencyPlanner`.
4. If runtime code/files are needed, implement a dedicated patch service (usually under `src/application/react/patches/libs`).
5. Export it through local `index.ts` barrels and wire it in `CliApplication`.
6. Add focused tests and run validation.

## 4) Add new generated code (patch service workflow)

Use `IReactPatchService` contract:

- `supports(context)`: whether patch should run for selected options.
- `apply(context, composer)`: apply file/code changes.

Recommended sequence:

1. Create service in proper domain group (`toolchain`, `config`, `providers`, `router`, `styling`, `http`, `libs`, `core`).
2. Keep `supports` narrow and deterministic.
3. Keep `apply` idempotent where possible.
4. Export via local `index.ts`.
5. Register service in `CliApplication` patch list.
6. Add unit tests in `src/application/react/patches/PatchServices.test.ts`, in `src/application/react/patches/router/RouterPatches.architecture.test.ts` (for `architecture` branches), or nearby targeted tests.

## 5) Add a new framework

1. Ensure framework value exists in `Framework` type in `ProjectOptions.ts`.
2. Implement `XFrameworkStrategy` in `src/application/strategy`.
3. Add framework-specific base files/dependency planning/patches.
4. Register strategy in wiring (`src/presentation/cli/app/CliApplication.ts`).
5. Validate with tests and at least one smoke/playground run.

## 6) Do / Don't

Do:

- Keep types in `domain` as source of truth.
- Prefer small, composable patch services.
- Preserve existing runtime step order in strategy/use case.
- Keep import style consistent with project (`@/.../index.js` barrels and explicit `.js` in ESM imports).

Don't:

- Do not place feature logic in `domain`.
- Do not bypass strategy/step orchestration with ad-hoc mutations.
- Do not introduce large refactors unrelated to requested behavior.

## 7) Validation pipeline

Minimum checks for every feature change:

```bash
npm run test
npm run build
```

Manual CLI checks:

```bash
npm run test:cli:smoke
npm run test:cli:play
```

## 8) PR checklists

### A) New option

- [ ] Updated `ProjectOptions` types.
- [ ] Added prompt choices/question.
- [ ] Added planner and/or patch logic.
- [ ] Wired changes in strategy/CLI composition.
- [ ] Added/updated tests.
- [ ] Ran test + build (+ smoke/playground if needed).

### B) New library

- [ ] Added value to `AdditionalLibrary`.
- [ ] Added choice in prompt options.
- [ ] Added dependency planning logic (including paired deps, if needed).
- [ ] Added patch service if runtime files/code are required.
- [ ] Updated exports and DI wiring.
- [ ] Ran validation pipeline.

### C) New framework

- [ ] Added/confirmed framework type and prompt value.
- [ ] Implemented new framework strategy.
- [ ] Added framework-specific factories/planners/patches.
- [ ] Registered strategy in app wiring.
- [ ] Added tests and verified CLI flow.

