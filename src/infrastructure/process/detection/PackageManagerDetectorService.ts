import { PackageManager } from "@/domain/ports/index.js";

/**
 * Detects package manager from npm-compatible user-agent environment variable.
 */
export class PackageManagerDetectorService {
  /**
   * @returns Detected package manager, defaults to `npm`.
   */
  detect(): PackageManager {
    const userAgent = process.env.npm_config_user_agent;

    if (userAgent?.startsWith('pnpm/')) {
      return 'pnpm';
    }

    if (userAgent?.startsWith('yarn/')) {
      return 'yarn';
    }

    if (userAgent?.startsWith('bun/')) {
      return 'bun';
    }

    return 'npm';
  }
}

