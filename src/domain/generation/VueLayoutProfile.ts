import type { Architecture } from "./ProjectOptions.js";

/**
 * Resolved filesystem layout for generated Vue apps (FSD vs simple).
 */
export interface VueLayoutProfile {
  readonly architecture: Architecture;
  /** `index.html` script `src` attribute value, e.g. `/src/app/main.ts`. */
  readonly htmlScriptSrc: string;
  /** Application bootstrap (`createApp`). */
  readonly entryRelativePath: string;
  /** Directory containing `index.css` and style partials (no trailing slash). */
  readonly stylesDirectory: string;
  /** Import path from entry file to global stylesheet. */
  readonly stylesIndexImport: string;
  /** `src/app` for FSD; `null` for simple (flat `src`). */
  readonly appDirectory: string | null;
  /** Composables / small shared runtime helpers (optional wiring). */
  readonly providersDirectory: string;
  /** Root Vue SFC path. */
  readonly appComponentPath: string;
  /** HTTP / API layer root directory. */
  readonly apiRoot: string;
  /** Environment config root directory. */
  readonly configRoot: string;
  /** Home page slice directory. */
  readonly pagesHomeDir: string;
  /** Vue Router config file (FSD tree vs simple colocated). */
  readonly vueRouterLayout: "fsd_tree" | "simple_colocated";
}

/**
 * @param architecture Selected project architecture from CLI options.
 * @returns Immutable layout profile for Vue code generation.
 */
export function resolveVueLayoutProfile(architecture: Architecture): VueLayoutProfile {
  if (architecture === "fsd") {
    return {
      architecture: "fsd",
      htmlScriptSrc: "/src/app/main.ts",
      entryRelativePath: "src/app/main.ts",
      stylesDirectory: "src/app/styles",
      stylesIndexImport: "./styles/index.css",
      appDirectory: "src/app",
      providersDirectory: "src/app/providers",
      appComponentPath: "src/app/App.vue",
      apiRoot: "src/shared/api",
      configRoot: "src/shared/config",
      pagesHomeDir: "src/pages/home",
      vueRouterLayout: "fsd_tree",
    };
  }

  return {
    architecture: "simple",
    htmlScriptSrc: "/src/main.ts",
    entryRelativePath: "src/main.ts",
    stylesDirectory: "src/styles",
    stylesIndexImport: "./styles/index.css",
    appDirectory: null,
    providersDirectory: "src/providers",
    appComponentPath: "src/App.vue",
    apiRoot: "src/api",
    configRoot: "src/config",
    pagesHomeDir: "src/pages/home",
    vueRouterLayout: "simple_colocated",
  };
}

/**
 * @param profile Layout profile.
 * @returns Import path usable in TS/Vue sources (`@/*` → `src/*`).
 */
export function vueApiImportBase(profile: VueLayoutProfile): string {
  return profile.architecture === "fsd" ? "@/shared/api" : "@/api";
}

/**
 * @param profile Layout profile.
 * @returns Import path for public config barrel.
 */
export function vueConfigImportBase(profile: VueLayoutProfile): string {
  return profile.architecture === "fsd" ? "@/shared/config" : "@/config";
}

/**
 * @param _profile Layout profile (reserved for future path variants).
 * @returns Import path for the home page slice barrel.
 */
export function vuePagesHomeImport(_profile: VueLayoutProfile): string {
  return "@/pages/home";
}
