import type {
  AdditionalLibrary,
  AsyncState,
  ClientState,
  Framework,
  RouterLibrary,
} from "./ProjectOptions.js";

/**
 * @returns True when `clientState` is allowed for the given framework.
 */
export function isClientStateValidForFramework(
  clientState: ClientState,
  framework: Framework,
): boolean {
  if (framework === "react") {
    return clientState === null || clientState === "zustand";
  }
  if (framework === "vue") {
    return clientState === null || clientState === "pinia";
  }
  return clientState === null;
}

/**
 * @returns True when `asyncState` is allowed for the given framework.
 */
export function isAsyncStateValidForFramework(
  asyncState: AsyncState,
  framework: Framework,
): boolean {
  if (framework === "react") {
    return asyncState === null || asyncState === "tanstack-query";
  }
  if (framework === "vue") {
    return (
      asyncState === null ||
      asyncState === "tanstack-query" ||
      asyncState === "pinia-colada"
    );
  }
  return asyncState === null;
}

/** Stable iteration order for multiselect ids (prompts + matrix helpers). */
export const ALL_ADDITIONAL_LIBRARY_IDS: readonly AdditionalLibrary[] = [
  "tanstack-table",
  "tanstack-react-form",
  "react-hook-form",
] as const;

/**
 * Maps optional multiselect library ids to npm package names per framework.
 * Absent framework key means the capability is not offered for that stack.
 */
const ADDITIONAL_LIB_NPM: Record<
  AdditionalLibrary,
  Partial<Record<Framework, string>>
> = {
  "tanstack-table": {
    react: "@tanstack/react-table",
    vue: "@tanstack/vue-table",
  },
  "tanstack-react-form": { react: "@tanstack/react-form" },
  "react-hook-form": { react: "react-hook-form" },
};

/**
 * @param framework Selected UI framework.
 * @returns TanStack Query package name for that stack.
 */
export function tanstackQueryNpmPackage(framework: Framework): string {
  if (framework === "vue") {
    return "@tanstack/vue-query";
  }
  return "@tanstack/react-query";
}

/**
 * @param lib Logical additional-library id.
 * @param framework Selected UI framework.
 * @returns npm package to install, or null if unsupported.
 */
export function resolveAdditionalLibNpm(
  lib: AdditionalLibrary,
  framework: Framework,
): string | null {
  const entry = ADDITIONAL_LIB_NPM[lib];
  const pkg = entry[framework];
  return typeof pkg === "string" && pkg.length > 0 ? pkg : null;
}

/**
 * @param lib Logical additional-library id.
 * @param framework Selected UI framework.
 */
export function isAdditionalLibSupportedForFramework(
  lib: AdditionalLibrary,
  framework: Framework,
): boolean {
  return resolveAdditionalLibNpm(lib, framework) !== null;
}

/**
 * @param router Selected router option.
 * @param framework Selected UI framework.
 */
export function isRouterValidForFramework(
  router: RouterLibrary,
  framework: Framework,
): boolean {
  if (router === null) {
    return true;
  }
  if (framework === "react") {
    return router === "react-router-dom" || router === "@tanstack/react-router";
  }
  if (framework === "vue") {
    return router === "vue-router";
  }
  return false;
}

/**
 * @param router Router choice.
 * @returns npm package name when a library router is selected.
 */
export function routerNpmPackage(router: RouterLibrary): string | null {
  if (router === null) {
    return null;
  }
  return router;
}
