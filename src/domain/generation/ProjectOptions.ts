/**
 * Supported project framework targets.
 */
export type Framework = "react" | "vue" | "nextjs" | "tanstack-start";
/**
 * High-level project architecture mode.
 */
export type Architecture = "simple" | "fsd";
/**
 * Supported styling presets for generated project.
 */
export type Styling = "tailwind" | "css";

/**
 * Supported HTTP client options.
 */
export type HttpClient = "axios" | null;
/**
 * Supported router options.
 */
export type RouterLibrary = "@tanstack/react-router" | "react-router-dom" | null;
/**
 * Runtime validation for API responses and env; `null` means no validation library.
 */
export type ValidationLibrary = "zod" | null;
/**
 * Optional additional libraries selectable in prompt flow.
 */
export type AdditionalLibrary =
  | "zustand"
  | "@tanstack/react-table"
  | "@tanstack/react-form"
  | "react-hook-form";

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
  /** Optional HTTP client integration; `null` means none. */
  httpClient: HttpClient;
  /** Response/env validation stack; `null` means none (no Zod in generated API). */
  validationLibrary: ValidationLibrary;
  /** Router library to wire in; `null` means no router. */
  router: RouterLibrary;
  /** When true, adds `@tanstack/react-query`, `queryClient`, and `QueryClientProvider` in providers. */
  tanstackQuery: boolean;
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

