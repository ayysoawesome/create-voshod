import { GenerationContext } from '@/domain/generation/index.js';
import { IPackageInstaller } from '@/domain/ports/index.js';
import { GenerationStep } from './GenerationStep.js';

/**
 * Pipeline step that installs planned production and development dependencies.
 */
export class InstallDependenciesStep implements GenerationStep {
  /**
   * @param packageInstaller Dependency installer implementation.
   */
  constructor(private readonly packageInstaller: IPackageInstaller) {}

  /**
   * @param context Runtime generation context.
   * @returns Promise resolved after all installations complete.
   */
  async execute(context: GenerationContext): Promise<void> {
    await this.packageInstaller.installProd(
      context.projectPath,
      context.runtime.getProdDependencies(),
    );
    await this.packageInstaller.installDev(
      context.projectPath,
      context.runtime.getDevDependencies(),
    );
  }
}
