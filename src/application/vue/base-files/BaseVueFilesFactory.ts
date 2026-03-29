import {
  GenerationContext,
  GeneratedFileAsset,
  resolveVueLayoutProfile,
} from "@/domain/generation/index.js";

const SIMPLE_EMPTY_DIR_GITKEEPS = [
  "src/assets/.gitkeep",
  "src/components/.gitkeep",
  "src/hooks/.gitkeep",
  "src/utils/.gitkeep",
] as const;

const FSD_SLICE_GITKEEPS = [
  "src/pages/.gitkeep",
  "src/widgets/.gitkeep",
  "src/features/.gitkeep",
  "src/entities/.gitkeep",
  "src/shared/assets/icons/.gitkeep",
  "src/shared/assets/images/.gitkeep",
] as const;

const SHIMS_VUE = `declare module "*.vue";
`;

/**
 * Produces initial Vue SFC + entry assets before toolchain and feature patches.
 */
export class BaseVueFilesFactory {
  /**
   * @param context Runtime generation context.
   * @returns Base Vue file assets (entry + placeholder app + shims).
   */
  create(context: GenerationContext): GeneratedFileAsset[] {
    const profile = resolveVueLayoutProfile(context.options.value.architecture);
    const appPath = profile.appComponentPath;
    const entryPath = profile.entryRelativePath;

    const entryDir = entryPath.slice(0, Math.max(0, entryPath.lastIndexOf("/")));
    const appRelativeToEntry =
      entryDir === "src"
        ? `./${appPath.replace(/^src\//, "")}`
        : `./${appPath.replace(/^src\/app\//, "")}`;

    const base: GeneratedFileAsset[] = [
      {
        relativePath: "src/shims-vue.d.ts",
        content: SHIMS_VUE,
      },
      {
        relativePath: entryPath,
        content: `import { createApp } from "vue";
import App from "${appRelativeToEntry}";
import "${profile.stylesIndexImport}";

createApp(App).mount("#app");
`,
      },
      {
        relativePath: appPath,
        content: `<script setup lang="ts">
</script>

<template>
  <div>Voshod Vue App</div>
</template>
`,
      },
    ];

    if (context.options.value.architecture === "fsd") {
      base.push({
        relativePath: "src/shared/index.ts",
        content: `/**
 * FSD \`shared\` layer — re-export from \`ui\`, \`lib\`, \`api\`, \`config\` as needed.
 */
export {};
`,
      });
      base.push({
        relativePath: "src/shared/ui/index.ts",
        content: `/**
 * Shared UI primitives and layout building blocks.
 */
export {};
`,
      });
      base.push({
        relativePath: "src/shared/lib/index.ts",
        content: `/**
 * Cross-cutting helpers (formatters, small utilities).
 */
export {};
`,
      });
      for (const relativePath of FSD_SLICE_GITKEEPS) {
        base.push({ relativePath, content: "" });
      }
    } else {
      for (const relativePath of SIMPLE_EMPTY_DIR_GITKEEPS) {
        base.push({ relativePath, content: "" });
      }
    }

    return base;
  }
}
