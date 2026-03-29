import path from "path";
import fs from "fs-extra";
import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "./GenerationStep.js";
import { getViteVueTsTemplateCruftPaths } from "../react/codegen/viteVueTsScaffoldCruft.js";

async function tryRemoveEmptyDir(dir: string): Promise<void> {
  try {
    const exists = await fs.pathExists(dir);
    if (!exists) {
      return;
    }
    const entries = await fs.readdir(dir);
    if (entries.length === 0) {
      await fs.rmdir(dir);
    }
  } catch {
    // best-effort cleanup
  }
}

/**
 * Deletes default `vue-ts` scaffold files that are unused after our entry/App/styles layout.
 */
export class PruneViteVueTsScaffoldStep implements GenerationStep {
  async execute(context: GenerationContext): Promise<void> {
    if (context.framework !== "vue") {
      return;
    }

    const root = context.projectPath;
    const relativePaths = getViteVueTsTemplateCruftPaths(
      context.options.value.architecture,
    );

    for (const relativePath of relativePaths) {
      const absolutePath = path.join(root, ...relativePath.split("/"));
      try {
        await fs.remove(absolutePath);
      } catch {
        // ignore missing or locked files
      }
    }

    if (context.options.value.formatter === "biome") {
      try {
        await fs.remove(path.join(root, "eslint.config.js"));
      } catch {
        // ignore missing or locked files
      }
    }

    if (context.options.value.architecture === "fsd") {
      try {
        await fs.remove(path.join(root, "src", "components"));
      } catch {
        // ignore
      }
      try {
        await fs.remove(path.join(root, "src", "assets"));
      } catch {
        // ignore
      }
    } else {
      await tryRemoveEmptyDir(path.join(root, "src", "components"));
      await tryRemoveEmptyDir(path.join(root, "src", "assets"));
    }
    await tryRemoveEmptyDir(path.join(root, "public"));
  }
}
