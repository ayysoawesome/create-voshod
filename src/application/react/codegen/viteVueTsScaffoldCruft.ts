import type { Architecture } from "@/domain/generation/ProjectOptions.js";

/**
 * Files left on disk by official `create-vite` `vue-ts` that our layout replaces or drops.
 */
export function getViteVueTsTemplateCruftPaths(
  architecture: Architecture,
): readonly string[] {
  if (architecture === "fsd") {
    return [
      "src/App.vue",
      "src/style.css",
      "src/main.ts",
      "src/components/HelloWorld.vue",
      "src/assets/vue.svg",
      "src/assets/vite.svg",
      "public/vite.svg",
    ];
  }
  return [
    "src/components/HelloWorld.vue",
    "src/assets/vue.svg",
    "public/vite.svg",
  ];
}
