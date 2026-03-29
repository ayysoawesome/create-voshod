/**
 * Supported project framework targets.
 */
export type Framework = 'react' | 'vue' | 'nextjs' | 'tanstack-start';
/**
 * High-level project architecture mode.
 */
export type Architecture = 'simple' | 'fsd';
/**
 * Supported styling presets for generated project.
 */
export type Styling = 'tailwind' | 'css';
/**
 * Supported code formatter options.
 */
export type Formatter = 'prettier' | 'biome';

/**
 * Supported HTTP client options.
 */
export type HttpClient = 'axios' | 'ofetch' | null;
/**
 * Supported router options (npm package id when a library is selected).
 */
export type RouterLibrary =
  | '@tanstack/react-router'
  | 'react-router-dom'
  | 'vue-router'
  | null;
/**
 * Runtime validation for API responses and env; `null` means no validation library.
 */
export type ValidationLibrary = 'zod' | null;
/**
 * Client-side global state library; `null` means none. Valid values depend on {@link Framework}.
 */
export type ClientState = 'zustand' | 'pinia' | null;
/**
 * Async / server-state layer for data fetching; `null` means none. Valid values depend on {@link Framework}.
 */
export type AsyncState = 'tanstack-query' | 'pinia-colada' | null;
/**
 * Logical ids for optional multiselect libraries; npm package per framework via capability catalog.
 */
export type AdditionalLibrary =
  | 'tanstack-table'
  | 'tanstack-react-form'
  | 'react-hook-form';

/**
 * User-facing options collected from CLI prompts.
 */
export interface ProjectOptions {
  /** Target directory name for the generated project. */
  projectName: string;
  /** Selected frontend framework target. */
  framework: Framework;
  /** Structural layout preset for generated sources. */
  architecture: Architecture;
  /** Styling stack applied to the generated app. */
  styling: Styling;
  /** Code formatter preset for generated project config and dev tooling. */
  formatter: Formatter;
  /** `axios` adds Axios; `ofetch` adds ofetch; `null` generates the Fetch-based `httpClient` wrapper (no extra dependency). */
  httpClient: HttpClient;
  /** Response/env validation stack; `null` means none (no Zod in generated API). */
  validationLibrary: ValidationLibrary;
  /** Router library to wire in; `null` means no router. */
  router: RouterLibrary;
  /** Global client state (Zustand on React, Pinia on Vue); `null` means none. */
  clientState: ClientState;
  /** Async data layer (TanStack Query, or Pinia Colada on Vue); `null` means none. */
  asyncState: AsyncState;
  /** Extra npm packages selected in the multiselect prompt. */
  libs: AdditionalLibrary[];
}

/**
 * Backward-compatible alias for options payload.
 */
export type CLIOptions = ProjectOptions;
/**
 * Backward-compatible alias for HTTP client type.
 */
export type HTTPclient = HttpClient;
/**
 * Backward-compatible alias for router type.
 */
export type Routers = RouterLibrary;
/**
 * Backward-compatible alias for validation library type.
 */
export type ValidationStack = ValidationLibrary;
/**
 * Backward-compatible alias for additional library type.
 */
export type Libs = AdditionalLibrary;
