import { PackageManagerAdapter } from './PackageManagerAdapter.js';

/**
 * yarn argument mapping for installation and scaffolding commands.
 */
export class YarnAdapter implements PackageManagerAdapter {
  /**
   * @param dependencies Production dependency names.
   * @returns yarn arguments for production install.
   */
  installProdArgs(dependencies: string[]): string[] {
    return ['add', ...dependencies];
  }

  /**
   * @param dependencies Development dependency names.
   * @returns yarn arguments for development install.
   */
  installDevArgs(dependencies: string[]): string[] {
    return ['add', '-D', ...dependencies];
  }

  /**
   * @param projectName Target project directory name.
   * @param template Vite template name.
   * @returns yarn arguments for Vite scaffolding.
   */
  createProjectArgs(projectName: string, template: string): string[] {
    return [
      'create',
      'vite@latest',
      projectName,
      '--template',
      template,
      '--no-interactive',
    ];
  }
}
