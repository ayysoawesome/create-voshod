import { PackageManager } from '@/domain/ports/index.js';
import { BunAdapter } from './BunAdapter.js';
import { NpmAdapter } from './NpmAdapter.js';
import { PackageManagerAdapter } from './PackageManagerAdapter.js';
import { PnpmAdapter } from './PnpmAdapter.js';
import { YarnAdapter } from './YarnAdapter.js';

/**
 * Factory for package-manager-specific command adapters.
 */
export class PackageManagerAdapterFactory {
  /**
   * @param packageManager Selected package manager.
   * @returns Adapter implementation for selected manager.
   */
  create(packageManager: PackageManager): PackageManagerAdapter {
    switch (packageManager) {
      case 'pnpm':
        return new PnpmAdapter();
      case 'yarn':
        return new YarnAdapter();
      case 'bun':
        return new BunAdapter();
      case 'npm':
      default:
        return new NpmAdapter();
    }
  }
}
