/**
 * Represents current and latest package versions for update notifications.
 */
export interface UpdateInfo {
  readonly currentVersion: string;
  readonly latestVersion: string | null;
}

/**
 * Abstraction for remote package-version lookup.
 */
export interface IUpdateChecker {
  /**
   * Resolves latest available version for a package.
   *
   * @param packageName npm package name.
   * @param currentVersion Currently running package version.
   * @returns Update metadata used for notification logic.
   */
  check(packageName: string, currentVersion: string): Promise<UpdateInfo>;
}

