import path from "path";
import fs from "fs-extra";
import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "./GenerationStep.js";
import { getViteReactTsTemplateCruftPaths } from "../react/codegen/viteReactTsScaffoldCruft.js";

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
 * Deletes default `react-ts` scaffold files that are unused after our entry/App/styles layout.
 * Runs after {@link WriteFilesStep} so composed files are already on disk.
 */
export class PruneViteReactTsScaffoldStep implements GenerationStep {
  async execute(context: GenerationContext): Promise<void> {
    if (context.framework !== "react") {
      return;
    }

    const root = context.projectPath;
    const relativePaths = getViteReactTsTemplateCruftPaths(
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

    if (context.options.value.architecture === "fsd") {
      try {
        await fs.remove(path.join(root, "src", "assets"));
      } catch {
        // ignore missing or locked tree
      }
    } else {
      await tryRemoveEmptyDir(path.join(root, "src", "assets"));
    }
    await tryRemoveEmptyDir(path.join(root, "public"));
  }
}
