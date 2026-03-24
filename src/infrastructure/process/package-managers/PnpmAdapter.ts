import { PackageManagerAdapter } from './PackageManagerAdapter.js';

/**
 * pnpm argument mapping for installation and scaffolding commands.
 */
export class PnpmAdapter implements PackageManagerAdapter {
  /**
   * @param dependencies Production dependency names.
   * @returns pnpm arguments for production install.
   */
  installProdArgs(dependencies: string[]): string[] {
    return ['install', ...dependencies];
  }

  /**
   * @param dependencies Development dependency names.
   * @returns pnpm arguments for development install.
   */
  installDevArgs(dependencies: string[]): string[] {
    return ['install', '-D', ...dependencies];
  }

  /**
   * @param projectName Target project directory name.
   * @param template Vite template name.
   * @returns pnpm arguments for Vite scaffolding.
   */
  createProjectArgs(projectName: string, template: string): string[] {
    return [
      'dlx',
      'create-vite@latest',
      projectName,
      '--',
      '--template',
      template,
      '--no-interactive',
    ];
  }
}
