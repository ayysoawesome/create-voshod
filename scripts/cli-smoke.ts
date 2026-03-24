import path from "path";
import { access, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "url";
import { execa } from "execa";
import {
  cliOptionsToInjectedFixtureJson,
  mergeCliMatrixBundle,
  type CliMatrixOptionBundle,
} from "../src/test-support/promptFixture.js";

type SmokeOptions = {
  keep: boolean;
  name: string | null;
};

function parseOptions(argv: string[]): SmokeOptions {
  let keep = false;
  let name: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--keep") {
      keep = true;
      continue;
    }

    if (value === "--name") {
      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("Flag --name requires a value.");
      }
      name = next;
      index += 1;
      continue;
    }
  }

  return { keep, name };
}

function buildProjectName(explicitName: string | null): string {
  if (explicitName !== null) {
    return explicitName;
  }

  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  return `smoke-project-${timestamp}`;
}

async function assertExists(filePath: string): Promise<void> {
  await access(filePath, constants.F_OK);
}

async function cleanupProject(projectPath: string): Promise<void> {
  try {
    await rm(projectPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 });
    return;
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`[smoke] warning: cleanup skipped (${error.message})`);
      return;
    }
    console.warn("[smoke] warning: cleanup skipped (unknown error)");
  }
}

async function run(): Promise<void> {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFilePath);
  const repoRoot = path.resolve(currentDirectory, "..");
  const options = parseOptions(process.argv.slice(2));

  const smokeRoot = path.resolve(repoRoot, ".tmp", "cli-smoke");
  const projectName = buildProjectName(options.name);
  const projectPath = path.resolve(smokeRoot, projectName);

  await mkdir(smokeRoot, { recursive: true });

  const smokeBundle: CliMatrixOptionBundle = {
    framework: "react",
    architecture: "simple",
    httpClient: "axios",
    validationLibrary: "zod",
    styling: "css",
    router: "react-router-dom",
    tanstackQuery: true,
    libs: [],
  };
  const injectedFixture = cliOptionsToInjectedFixtureJson(
    mergeCliMatrixBundle(smokeBundle, projectName),
  );

  console.log(`[smoke] repoRoot: ${repoRoot}`);
  console.log(`[smoke] projectPath: ${projectPath}`);
  console.log("[smoke] running CLI from src without tsup build");

  await execa("tsx", [path.resolve(repoRoot, "src", "cli.ts")], {
    cwd: smokeRoot,
    stdio: "inherit",
    env: {
      VOSHOD_PROMPT_FIXTURE_JSON: injectedFixture,
    },
  });

  console.log("[smoke] validating generated artifacts");
  await assertExists(path.resolve(projectPath, "package.json"));
  await assertExists(path.resolve(projectPath, "src", "index.tsx"));

  console.log("[smoke] installing generated project dependencies");
  await execa("npm", ["install"], {
    cwd: projectPath,
    stdio: "inherit",
  });

  console.log("[smoke] building generated project");
  await execa("npm", ["run", "build"], {
    cwd: projectPath,
    stdio: "inherit",
  });

  if (!options.keep) {
    console.log("[smoke] cleanup temp project");
    await cleanupProject(projectPath);
  } else {
    console.log(`[smoke] keeping project for debug: ${projectPath}`);
  }

  console.log("[smoke] success");
}

run().catch(async (error) => {
  const message =
    error instanceof Error ? error.message : "Unknown smoke runner failure";
  console.error(`[smoke] failed: ${message}`);
  process.exitCode = 1;
});

