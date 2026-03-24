import { PackageManagerAdapter } from './PackageManagerAdapter.js';

/**
 * bun argument mapping for installation and scaffolding commands.
 */
export class BunAdapter implements PackageManagerAdapter {
  /**
   * @param dependencies Production dependency names.
   * @returns bun arguments for production install.
   */
  installProdArgs(dependencies: string[]): string[] {
    return ['add', ...dependencies];
  }

  /**
   * @param dependencies Development dependency names.
   * @returns bun arguments for development install.
   */
  installDevArgs(dependencies: string[]): string[] {
    return ['add', '-D', ...dependencies];
  }

  /**
   * @param projectName Target project directory name.
   * @param template Vite template name.
   * @returns bun arguments for Vite scaffolding.
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
