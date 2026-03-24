import path from "path";
import { access, mkdir, readdir, rename, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "url";
import { execa } from "execa";
import prompts from "prompts";

type PlaygroundOptions = {
  full: boolean;
};

function parseOptions(argv: string[]): PlaygroundOptions {
  let full = false;

  for (const value of argv) {
    if (value === "--full") {
      full = true;
    }
  }

  return { full };
}

async function assertExists(filePath: string): Promise<void> {
  await access(filePath, constants.F_OK);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function listDirectories(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

async function cleanupDirectory(directoryPath: string): Promise<void> {
  if (!(await pathExists(directoryPath))) {
    return;
  }

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await rm(directoryPath, {
        recursive: true,
        force: true,
        maxRetries: 2,
        retryDelay: 250,
      });
    } catch {
      // Ignore and verify via existence check below.
    }

    if (!(await pathExists(directoryPath))) {
      return;
    }

    await sleep(1000);
  }

  const parentDirectory = path.dirname(directoryPath);
  const pendingDeleteRoot = path.resolve(parentDirectory, "_pending-delete");
  await mkdir(pendingDeleteRoot, { recursive: true });

  const movedPath = path.resolve(
    pendingDeleteRoot,
    `${path.basename(directoryPath)}-${Date.now()}`,
  );

  try {
    await rename(directoryPath, movedPath);
  } catch {
    throw new Error(
      `Failed to remove playground directory: ${directoryPath} (directory is still locked)`,
    );
  }

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await rm(movedPath, {
        recursive: true,
        force: true,
        maxRetries: 2,
        retryDelay: 250,
      });
    } catch {
      // Ignore and verify via existence check below.
    }

    if (!(await pathExists(movedPath))) {
      return;
    }

    await sleep(1000);
  }

  throw new Error(
    `Failed to remove playground directory after fallback move: ${movedPath}`,
  );
}

async function resolveProjectPath(
  playgroundRoot: string,
  beforeDirectories: string[],
): Promise<string> {
  const afterDirectories = await listDirectories(playgroundRoot);
  const createdDirectories = afterDirectories.filter(
    (directoryName) => !beforeDirectories.includes(directoryName),
  );
  const defaultDirectory = createdDirectories[0];
  const initialProjectPath =
    typeof defaultDirectory === "string"
      ? path.resolve(playgroundRoot, defaultDirectory)
      : playgroundRoot;

  const answer = await prompts<"projectPath">({
    type: "text",
    name: "projectPath",
    message: "Project path for install/build:",
    initial: initialProjectPath,
    validate: (value: string) =>
      value.trim().length > 0 ? true : "Project path is required.",
  });

  return answer.projectPath;
}

async function run(): Promise<void> {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFilePath);
  const repoRoot = path.resolve(currentDirectory, "..");
  const options = parseOptions(process.argv.slice(2));

  const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const playgroundRoot = path.resolve(repoRoot, ".tmp", "cli-playground", timestamp);
  await mkdir(playgroundRoot, { recursive: true });

  const beforeDirectories = await listDirectories(playgroundRoot);

  console.log(`[playground] workspace: ${playgroundRoot}`);
  console.log("[playground] interactive CLI start");
  await execa("tsx", [path.resolve(repoRoot, "src", "cli.ts")], {
    cwd: playgroundRoot,
    stdio: "inherit",
    env: {
      VOSHOD_PROMPT_FIXTURE_JSON: "",
    },
  });

  if (options.full) {
    const projectPath = await resolveProjectPath(playgroundRoot, beforeDirectories);
    console.log(`[playground] project: ${projectPath}`);

    console.log("[playground] validating generated artifacts");
    await assertExists(path.resolve(projectPath, "package.json"));
    const entrySimple = path.resolve(projectPath, "src", "index.tsx");
    const entryFsd = path.resolve(projectPath, "src", "app", "index.tsx");
    if (!(await pathExists(entrySimple)) && !(await pathExists(entryFsd))) {
      throw new Error("Expected src/index.tsx or src/app/index.tsx as entry.");
    }

    console.log("[playground] installing dependencies");
    await execa("npm", ["install"], {
      cwd: projectPath,
      stdio: "inherit",
    });

    console.log("[playground] building generated project");
    await execa("npm", ["run", "build"], {
      cwd: projectPath,
      stdio: "inherit",
    });
  }

  const cleanupAnswer = await prompts<"cleanup">({
    type: "select",
    name: "cleanup",
    message: "Cleanup playground directory?",
    choices: [
      { title: "Remove", value: "remove" },
      { title: "Keep for debugging", value: "keep" },
    ],
    initial: 1,
  });

  if (cleanupAnswer.cleanup === "remove") {
    await cleanupDirectory(playgroundRoot);
    console.log("[playground] playground removed");
  } else {
    console.log(`[playground] playground kept: ${playgroundRoot}`);
  }

  console.log("[playground] done");
}

function finalize(exitCode: number): void {
  if (typeof process.stdin.setRawMode === "function") {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // Ignore terminal mode reset errors.
    }
  }

  if (process.stdin.readable) {
    process.stdin.pause();
  }
  process.stdin.removeAllListeners();
  process.stdin.unref();

  process.exit(exitCode);
}

run()
  .then(() => {
    finalize(0);
  })
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unknown interactive playground failure";
    console.error(`[playground] failed: ${message}`);
    finalize(1);
  });

