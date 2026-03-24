import {
  GenerationContext,
  GeneratedFileAsset,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";

/**
 * Produces initial React file assets before toolchain and feature patches.
 *
 * | Area     | `simple`                         | `fsd`                          |
 * |----------|----------------------------------|--------------------------------|
 * | Entry    | `src/index.tsx`                  | `src/app/index.tsx`            |
 * | App stub | `src/App.tsx`                    | `src/app/App.tsx`              |
 * | Shared   | —                                | `src/shared/index.ts`          |
 * | Empty dirs (`simple`) | `assets`, `components`, `hooks`, `utils` (`.gitkeep`) | — |
 */
const SIMPLE_EMPTY_DIR_GITKEEPS = [
  "src/assets/.gitkeep",
  "src/components/.gitkeep",
  "src/hooks/.gitkeep",
  "src/utils/.gitkeep",
] as const;

export class BaseReactFilesFactory {
  /**
   * @param context Runtime generation context.
   * @returns Base React file assets (entry + placeholder app).
   */
  create(context: GenerationContext): GeneratedFileAsset[] {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const appPath = profile.appComponentPath;
    const entryPath = profile.entryRelativePath;

    const entryDir = entryPath.slice(0, Math.max(0, entryPath.lastIndexOf("/")));
    const appRelativeToEntry =
      entryDir === "src"
        ? `./${appPath.replace(/^src\//, "")}`
        : `./${appPath.replace(/^src\/app\//, "")}`;

    const base: GeneratedFileAsset[] = [
      {
        relativePath: entryPath,
        content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "${appRelativeToEntry}";
import "${profile.stylesIndexImport}";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
      },
      {
        relativePath: appPath,
        content: `import { type FC } from "react";

export const App: FC = () => <div>Voshod React App</div>;
`,
      },
    ];

    if (context.options.value.architecture === "fsd") {
      base.push({
        relativePath: "src/shared/index.ts",
        content: `/**
 * FSD \`shared\` layer — add and re-export ui, lib, api as the project grows.
 */
export {};
`,
      });
    } else {
      for (const relativePath of SIMPLE_EMPTY_DIR_GITKEEPS) {
        base.push({ relativePath, content: "" });
      }
    }

    return base;
  }
}
