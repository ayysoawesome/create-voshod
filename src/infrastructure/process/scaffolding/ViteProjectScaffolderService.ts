import { execa } from "execa";
import { IProjectScaffolder, PackageManager } from "@/domain/ports/index.js";
import { GenerationContext } from "@/domain/generation/index.js";
import { PackageManagerAdapterFactory } from "../package-managers/PackageManagerAdapterFactory.js";

/**
 * Scaffolds base project using Vite create command through selected package manager.
 */
export class ViteProjectScaffolderService implements IProjectScaffolder {
  /**
   * @param packageManager Selected package manager command.
   * @param adapterFactory Adapter factory for package-manager-specific args.
   */
  constructor(
    private readonly packageManager: PackageManager,
    private readonly adapterFactory: PackageManagerAdapterFactory,
  ) {}

  /**
   * Executes project scaffold command (`react-ts` or `vue-ts` from Vite).
   *
   * @param context Runtime generation context.
   * @returns Promise resolved when scaffold command completes.
   */
  async scaffold(context: GenerationContext): Promise<void> {
    const adapter = this.adapterFactory.create(this.packageManager);
    const template = context.framework === "vue" ? "vue-ts" : "react-ts";
    await execa(
      this.packageManager,
      adapter.createProjectArgs(context.options.value.projectName, template),
      {
        stdio: "inherit",
      },
    );
  }
}

