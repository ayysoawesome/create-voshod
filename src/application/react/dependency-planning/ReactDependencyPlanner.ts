import { GenerationContext } from "@/domain/generation/index.js";

/**
 * Plans production dependencies for generated React projects.
 */
export class ReactDependencyPlanner {
  /**
   * Mutates runtime dependency sets based on selected options.
   *
   * @param context Runtime generation context.
   */
  plan(context: GenerationContext): void {
    if (context.options.value.tanstackQuery) {
      context.runtime.addProdDependency("@tanstack/react-query");
    }

    if (context.options.value.validationLibrary === "zod") {
      context.runtime.addProdDependency("zod");
    }

    for (const lib of context.options.value.libs) {
      context.runtime.addProdDependency(lib);
    }

    if (context.options.value.router) {
      context.runtime.addProdDependency(context.options.value.router);
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

