import { execa } from "execa";
import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "./GenerationStep.js";

/**
 * Runs formatter in generated project after dependencies are installed.
 */
export class FormatGeneratedProjectStep implements GenerationStep {
  async execute(context: GenerationContext): Promise<void> {
    await execa(context.packageManager, ["run", "format:write"], {
      cwd: context.projectPath,
      stdio: "inherit",
    });
  }
}

