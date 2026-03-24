import { PackageManagerAdapter } from './PackageManagerAdapter.js';

/**
 * npm argument mapping for installation and scaffolding commands.
 */
export class NpmAdapter implements PackageManagerAdapter {
  /**
   * @param dependencies Production dependency names.
   * @returns npm arguments for production install.
   */
  installProdArgs(dependencies: string[]): string[] {
    return ['install', ...dependencies];
  }

  /**
   * @param dependencies Development dependency names.
   * @returns npm arguments for development install.
   */
  installDevArgs(dependencies: string[]): string[] {
    return ['install', '--save-dev', ...dependencies];
  }

  /**
   * @param projectName Target project directory name.
   * @param template Vite template name.
   * @returns npm arguments for Vite scaffolding.
   */
  createProjectArgs(projectName: string, template: string): string[] {
    return [
      'create',
      'vite@latest',
      projectName,
      '--',
      '--template',
      template,
      '--no-interactive',
    ];
  }
}
