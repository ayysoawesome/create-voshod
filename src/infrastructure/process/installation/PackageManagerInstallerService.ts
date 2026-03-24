import { execa } from 'execa';
import { IPackageInstaller, PackageManager } from '@/domain/ports/index.js';
import { PackageManagerAdapterFactory } from '../package-managers/PackageManagerAdapterFactory.js';

/**
 * Installs dependencies via selected package manager and adapter argument mapping.
 */
export class PackageManagerInstallerService implements IPackageInstaller {
  /**
   * @param packageManager Selected package manager command.
   * @param adapterFactory Adapter factory for package-manager-specific args.
   */
  constructor(
    private readonly packageManager: PackageManager,
    private readonly adapterFactory: PackageManagerAdapterFactory,
  ) {}

  /**
   * Installs production dependencies if list is non-empty.
   *
   * @param projectPath Absolute project path.
   * @param dependencies Production dependency names.
   * @returns Promise resolved after installation.
   */
  async installProd(
    projectPath: string,
    dependencies: string[],
  ): Promise<void> {
    if (dependencies.length === 0) {
      return;
    }

    const adapter = this.adapterFactory.create(this.packageManager);
    await execa(this.packageManager, adapter.installProdArgs(dependencies), {
      cwd: projectPath,
      stdio: 'inherit',
    });
  }

  /**
   * Installs development dependencies if list is non-empty.
   *
   * @param projectPath Absolute project path.
   * @param dependencies Development dependency names.
   * @returns Promise resolved after installation.
   */
  async installDev(projectPath: string, dependencies: string[]): Promise<void> {
    if (dependencies.length === 0) {
      return;
    }

    const adapter = this.adapterFactory.create(this.packageManager);
    await execa(this.packageManager, adapter.installDevArgs(dependencies), {
      cwd: projectPath,
      stdio: 'inherit',
    });
  }
}

