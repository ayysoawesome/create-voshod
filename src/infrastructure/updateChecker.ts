import https from "https";
import { IUpdateChecker, UpdateInfo } from "@/domain/ports/index.js";

/**
 * Runtime type guard for plain object values.
 *
 * @param value Unknown runtime value.
 * @returns True when value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Parses npm registry latest-package payload and returns version field.
 *
 * @param body Raw response body from npm registry endpoint.
 * @returns Latest version string or null when payload is invalid.
 */
export function parseLatestVersionFromRegistryBody(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (!isRecord(parsed)) {
      return null;
    }

    const version = parsed.version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}

/**
 * Update checker implementation backed by npm registry `latest` endpoint.
 */
export class NpmRegistryUpdateCheckerService implements IUpdateChecker {
  /**
   * @param packageName npm package name.
   * @param currentVersion Currently running package version.
   * @returns Current and latest versions for notification logic.
   */
  async check(packageName: string, currentVersion: string): Promise<UpdateInfo> {
    const url = `https://registry.npmjs.org/${packageName}/latest`;

    return new Promise((resolve) => {
      const req = https.get(url, (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });

        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            currentVersion,
            latestVersion: parseLatestVersionFromRegistryBody(body),
          });
        });
      });

      req.on("error", () => {
        resolve({ currentVersion, latestVersion: null });
      });
    });
  }
}

/**
 * Backward-compatible functional helper for update check.
 *
 * @param packageName npm package name.
 * @param currentVersion Currently running package version.
 * @returns Current and latest versions for notification logic.
 */
export function checkForUpdates(
  packageName: string,
  currentVersion: string,
): Promise<UpdateInfo> {
  return new NpmRegistryUpdateCheckerService().check(packageName, currentVersion);
}
