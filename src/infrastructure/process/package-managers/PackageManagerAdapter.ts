/**
 * Normalizes package-manager-specific CLI arguments for common operations.
 */
export interface PackageManagerAdapter {
  /**
   * @param dependencies Production dependency names.
   * @returns CLI args for production install.
   */
  installProdArgs(dependencies: string[]): string[];
  /**
   * @param dependencies Development dependency names.
   * @returns CLI args for development install.
   */
  installDevArgs(dependencies: string[]): string[];
  /**
   * @param projectName Target project directory name.
   * @param template Vite template name.
   * @returns CLI args for project scaffolding command.
   */
  createProjectArgs(projectName: string, template: string): string[];
}
