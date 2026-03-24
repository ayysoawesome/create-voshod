import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_PACKAGE_NAME = "create-voshod";

/**
 * Finds the installed package root (directory containing this tool's package.json).
 * Walks up from this module's location so it works for both `src/**` (dev/tests) and `dist/cli.js` (published).
 */
function resolvePackageRootFromModuleUrl(): string | null {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 25; i += 1) {
    const candidate = join(dir, "package.json");
    if (existsSync(candidate)) {
      try {
        const pkg = JSON.parse(readFileSync(candidate, "utf8")) as { name?: unknown };
        if (pkg.name === EXPECTED_PACKAGE_NAME) {
          return dir;
        }
      } catch {
        // keep walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return null;
}

/**
 * Name and version of the running `create-voshod` package for update checks and display.
 * Prefers on-disk package.json (correct under npx); falls back to npm env when running `npm run` from repo root.
 */
export function readOwnPackageIdentity(): { name: string; version: string } {
  const root = resolvePackageRootFromModuleUrl();
  if (root !== null) {
    try {
      const raw = readFileSync(join(root, "package.json"), "utf8");
      const pkg = JSON.parse(raw) as { name?: unknown; version?: unknown };
      const name = typeof pkg.name === "string" ? pkg.name : EXPECTED_PACKAGE_NAME;
      const version = typeof pkg.version === "string" ? pkg.version : fallbackVersion();
      return { name, version };
    } catch {
      // fall through
    }
  }
  return {
    name: process.env.npm_package_name ?? EXPECTED_PACKAGE_NAME,
    version: fallbackVersion(),
  };
}

function fallbackVersion(): string {
  const v = process.env.npm_package_version;
  return typeof v === "string" && v.length > 0 ? v : "0.0.0";
}
