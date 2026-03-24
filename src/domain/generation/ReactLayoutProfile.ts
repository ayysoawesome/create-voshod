import type { Architecture } from './ProjectOptions.js';

/**
 * Resolved filesystem layout for generated React apps (FSD vs simple).
 * Patch services should read paths from this profile instead of branching ad hoc.
 */
export interface ReactLayoutProfile {
  readonly architecture: Architecture;
  /** `index.html` script `src` attribute value, e.g. `/src/app/index.tsx`. */
  readonly htmlScriptSrc: string;
  /** Application bootstrap file (createRoot). */
  readonly entryRelativePath: string;
  /** Directory containing `index.css` and style partials (no trailing slash). */
  readonly stylesDirectory: string;
  /** Import path from entry file to global stylesheet. */
  readonly stylesIndexImport: string;
  /** `src/app` for FSD; `null` for simple (flat `src`). */
  readonly appDirectory: string | null;
  /** Where `AppProviders` and related files live. */
  readonly providersDirectory: string;
  /** Root React component path. */
  readonly appComponentPath: string;
  /** HTTP / API layer root directory. */
  readonly apiRoot: string;
  /** Environment config root directory. */
  readonly configRoot: string;
  /** Home page slice directory (both layouts use `src/pages/home`). */
  readonly pagesHomeDir: string;
  /** TanStack Router file layout. */
  readonly tanstackLayout: 'fsd_tree' | 'simple_colocated';
}

/**
 * @param architecture Selected project architecture from CLI options.
 * @returns Immutable layout profile for code generation.
 */
export function resolveReactLayoutProfile(
  architecture: Architecture,
): ReactLayoutProfile {
  if (architecture === 'fsd') {
    return {
      architecture: 'fsd',
      htmlScriptSrc: '/src/app/index.tsx',
      entryRelativePath: 'src/app/index.tsx',
      stylesDirectory: 'src/app/styles',
      stylesIndexImport: './styles/index.css',
      appDirectory: 'src/app',
      providersDirectory: 'src/app/providers',
      appComponentPath: 'src/app/App.tsx',
      apiRoot: 'src/shared/api',
      configRoot: 'src/shared/config',
      pagesHomeDir: 'src/pages/home',
      tanstackLayout: 'fsd_tree',
    };
  }

  return {
    architecture: 'simple',
    htmlScriptSrc: '/src/index.tsx',
    entryRelativePath: 'src/index.tsx',
    stylesDirectory: 'src/styles',
    stylesIndexImport: './styles/index.css',
    appDirectory: null,
    providersDirectory: 'src/providers',
    appComponentPath: 'src/App.tsx',
    apiRoot: 'src/api',
    configRoot: 'src/config',
    pagesHomeDir: 'src/pages/home',
    tanstackLayout: 'simple_colocated',
  };
}

/**
 * @param profile Layout profile.
 * @returns Import path usable in TS sources (alias `@/*` → `src/*`).
 */
export function apiImportBase(profile: ReactLayoutProfile): string {
  return profile.architecture === 'fsd' ? '@/shared/api' : '@/api';
}

/**
 * @param profile Layout profile.
 * @returns Import path for public config barrel.
 */
export function configImportBase(profile: ReactLayoutProfile): string {
  return profile.architecture === 'fsd' ? '@/shared/config' : '@/config';
}

/**
 * @param _profile Layout profile (reserved for future path variants).
 * @returns Import path for the home page slice barrel.
 */
export function pagesHomeImport(_profile: ReactLayoutProfile): string {
  return '@/pages/home';
}
