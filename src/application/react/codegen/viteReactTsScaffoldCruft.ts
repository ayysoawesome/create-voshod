import type { Architecture } from "@/domain/generation/ProjectOptions.js";

/**
 * Files left on disk by official `create-vite` `react-ts` that our layout replaces or drops.
 * Removed after generated files are written so the tree matches FSD / simple profiles only.
 */
export function getViteReactTsTemplateCruftPaths(
  architecture: Architecture,
): readonly string[] {
  if (architecture === "fsd") {
    return [
      "src/App.tsx",
      "src/App.css",
      "src/index.css",
      "src/main.tsx",
      "src/assets/react.svg",
      "src/assets/vite.svg",
      "public/vite.svg",
    ];
  }
  return [
    "src/main.tsx",
    "src/index.css",
    "src/App.css",
    "src/assets/react.svg",
    "src/assets/vite.svg",
    "public/vite.svg",
  ];
}
