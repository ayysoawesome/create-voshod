import {
  resolveAdditionalLibNpm,
  routerNpmPackage,
  tanstackQueryNpmPackage,
} from "@/domain/generation/frameworkCapabilityCatalog.js";
import { GenerationContext } from "@/domain/generation/index.js";

/**
 * Plans production and dev dependencies for generated projects from CLI options.
 */
export class ReactDependencyPlanner {
  /**
   * Mutates runtime dependency sets based on selected options.
   *
   * @param context Runtime generation context.
   */
  plan(context: GenerationContext): void {
    if (context.options.value.formatter === "prettier") {
      context.runtime.addDevDependency("prettier");
    }

    if (context.options.value.formatter === "biome") {
      context.runtime.addDevDependency("@biomejs/biome");
    }

    if (context.options.value.asyncState === "tanstack-query") {
      context.runtime.addProdDependency(
        tanstackQueryNpmPackage(context.options.value.framework),
      );
    }

    if (context.options.value.clientState === "zustand") {
      context.runtime.addProdDependency("zustand");
    }

    if (context.options.value.clientState === "pinia") {
      context.runtime.addProdDependency("pinia");
    }

    if (context.options.value.asyncState === "pinia-colada") {
      context.runtime.addProdDependency("@pinia/colada");
      if (context.options.value.clientState !== "pinia") {
        context.runtime.addProdDependency("pinia");
      }
    }

    if (context.options.value.validationLibrary === "zod") {
      context.runtime.addProdDependency("zod");
    }

    const fw = context.options.value.framework;
    for (const lib of context.options.value.libs) {
      const pkg = resolveAdditionalLibNpm(lib, fw);
      if (pkg !== null) {
        context.runtime.addProdDependency(pkg);
      }
    }

    const routerPkg = routerNpmPackage(context.options.value.router);
    if (routerPkg !== null) {
      context.runtime.addProdDependency(routerPkg);
    }

    if (context.options.value.httpClient) {
      context.runtime.addProdDependency(context.options.value.httpClient);
    }

    if (context.options.value.styling === "tailwind") {
      context.runtime.addProdDependency("tailwindcss");
      context.runtime.addProdDependency("@tailwindcss/vite");
    }
  }
}
