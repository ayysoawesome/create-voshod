import type { ReactLayoutProfile } from '@/domain/generation/ReactLayoutProfile.js';

/**
 * Relative paths that must be edited zonally (morph / JSON merge / targeted HTML),
 * not replaced wholesale by feature patches — after scaffold ingest they reflect the real template.
 */
export const ZONAL_ONLY_RELATIVE_PATHS = [
  'vite.config.ts',
  'tsconfig.app.json',
  'index.html',
] as const;

export type ZonalOnlyRelativePath = (typeof ZONAL_ONLY_RELATIVE_PATHS)[number];

/**
 * Prefixes under which the generator may use full-file `upsertFile` from a single owning patch
 * (pages, api, config, router tree, providers, styles, simple-layout gitkeep dirs).
 *
 * When adding a new patch that writes whole files, extend this list (or `FULL_REPLACE_OK_EXACT_PATHS`)
 * so the policy stays auditable.
 */
export const FULL_REPLACE_OK_PREFIXES = [
  'src/pages/',
  'src/shared/api/',
  'src/shared/config/',
  'src/api/',
  'src/config/',
  'src/app/router/',
  'src/app/layouts/',
  'src/providers/',
  'src/app/providers/',
  'src/styles/',
  'src/app/styles/',
  'src/assets/',
  'src/components/',
  'src/hooks/',
  'src/utils/',
] as const;

export type FullReplaceOkPrefix = (typeof FULL_REPLACE_OK_PREFIXES)[number];

/**
 * Exact paths that are fully owned by a single generator step (not covered by prefixes).
 */
export const FULL_REPLACE_OK_EXACT_PATHS = [
  'src/router.tsx',
  'src/shared/index.ts',
  'src/index.tsx',
  'src/app/index.tsx',
] as const;

export type FullReplaceOkExactPath = (typeof FULL_REPLACE_OK_EXACT_PATHS)[number];

/**
 * App shell uses zonal router JSX replacement inside a stable `AppProviders` wrapper.
 *
 * @param profile Resolved layout profile.
 * @returns `App.tsx` path for the selected architecture.
 */
export function zonalAppComponentPath(profile: ReactLayoutProfile): string {
  return profile.appComponentPath;
}

/**
 * @param relativePath Path relative to project root.
 * @returns True when this path is always zonal-only (static list).
 */
export function isZonalOnlyPath(
  relativePath: string,
): relativePath is ZonalOnlyRelativePath {
  return (ZONAL_ONLY_RELATIVE_PATHS as readonly string[]).includes(
    relativePath,
  );
}

/**
 * @param relativePath Path relative to project root.
 * @param profile When set, the app component path is excluded from full-replace (router morph zone).
 * @returns True when the path is registered as safe for whole-file upsert by its owner patch.
 *
 * Zonal paths and the app shell component never return true. Paths outside the registry return false
 * (undeclared — add an entry when introducing a new fully-generated file).
 */
export function isFullReplaceOkPath(
  relativePath: string,
  profile?: ReactLayoutProfile,
): boolean {
  if (isZonalOnlyPath(relativePath)) {
    return false;
  }
  if (profile !== undefined && relativePath === profile.appComponentPath) {
    return false;
  }
  if ((FULL_REPLACE_OK_EXACT_PATHS as readonly string[]).includes(relativePath)) {
    return true;
  }
  return FULL_REPLACE_OK_PREFIXES.some((prefix) =>
    relativePath.startsWith(prefix),
  );
}
