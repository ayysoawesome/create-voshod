/**
 * Installs dependencies in generated projects via selected package manager.
 */
export interface IPackageInstaller {
  /**
   * Installs production dependencies.
   *
   * @param projectPath Absolute path to project root.
   * @param dependencies Dependency names to install.
   * @returns Promise resolved after installation.
   */
  installProd(projectPath: string, dependencies: string[]): Promise<void>;
  /**
   * Installs development dependencies.
   *
   * @param projectPath Absolute path to project root.
   * @param dependencies Dependency names to install.
   * @returns Promise resolved after installation.
   */
  installDev(projectPath: string, dependencies: string[]): Promise<void>;
}

