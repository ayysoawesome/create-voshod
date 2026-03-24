import path from "node:path";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import {
  CLI_MATRIX_COMBINATION_COUNT,
  cliOptionsToInjectedFixtureJson,
  enumerateCliMatrixOptionBundles,
  mergeCliMatrixBundle,
  type CliMatrixOptionBundle,
} from "../src/test-support/promptFixture.js";

const LOG_MESSAGE_MAX = 4000;

/** Wall-clock cap for recursive deletes so locked native binaries (e.g. Tailwind oxide `*.node` on Windows) cannot hang the runner. */
const MATRIX_RM_TIMEOUT_MS = 10_000;

type FailPhase = "scaffold" | "install" | "build" | "assert";

type MatrixCliOptions = {
  shardIndex: number | null;
  shardTotal: number | null;
  concurrency: number;
  maxRuns: number | null;
  logFile: string | null;
};

type BundleLogShape = {
  architecture: CliMatrixOptionBundle["architecture"];
  validationLibrary: CliMatrixOptionBundle["validationLibrary"];
  styling: CliMatrixOptionBundle["styling"];
  router: CliMatrixOptionBundle["router"];
  tanstackQuery: boolean;
  libs: CliMatrixOptionBundle["libs"];
};

type CombinationLogRow = {
  type: "result";
  timestamp: string;
  globalIndex: number;
  status: "ok" | "fail";
  durationMs: number;
  bundle: BundleLogShape;
  phase?: FailPhase;
  message?: string;
};

type MatrixMetaLine = {
  type: "meta";
  timestamp: string;
  runId: string;
  shard: { index: number; total: number } | null;
  concurrency: number;
  repoRoot: string;
  plannedCount: number;
  matrixWorkspace: string;
  logFile: string;
};

function parseMatrixCli(argv: string[]): MatrixCliOptions {
  let shardIndex: number | null = null;
  let shardTotal: number | null = null;
  let concurrency = 1;
  let maxRuns: number | null = null;
  let logFile: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--shard" || arg.startsWith("--shard=")) {
      const raw =
        arg === "--shard" ? argv[i + 1] : arg.slice("--shard=".length);
      if (arg === "--shard") {
        i += 1;
      }
      if (!raw) {
        throw new Error("--shard requires value i/n (e.g. 0/4).");
      }
      const match = /^(\d+)\/(\d+)$/.exec(raw.trim());
      if (!match) {
        throw new Error(`Invalid --shard value "${raw}". Expected i/n with 0 <= i < n.`);
      }
      shardIndex = Number(match[1]);
      shardTotal = Number(match[2]);
      if (
        !Number.isInteger(shardTotal) ||
        shardTotal < 1 ||
        !Number.isInteger(shardIndex) ||
        shardIndex < 0 ||
        shardIndex >= shardTotal
      ) {
        throw new Error(`Invalid --shard range: need 0 <= i < n, got ${raw}.`);
      }
      continue;
    }

    if (arg === "--concurrency" || arg.startsWith("--concurrency=")) {
      const raw =
        arg === "--concurrency" ? argv[i + 1] : arg.slice("--concurrency=".length);
      if (arg === "--concurrency") {
        i += 1;
      }
      const n = Number(raw);
      if (!raw || !Number.isInteger(n) || n < 1) {
        throw new Error("--concurrency must be a positive integer.");
      }
      concurrency = n;
      continue;
    }

    if (arg === "--max" || arg.startsWith("--max=")) {
      const raw = arg === "--max" ? argv[i + 1] : arg.slice("--max=".length);
      if (arg === "--max") {
        i += 1;
      }
      const n = Number(raw);
      if (!raw || !Number.isInteger(n) || n < 1) {
        throw new Error("--max must be a positive integer.");
      }
      maxRuns = n;
      continue;
    }

    if (arg === "--log-file" || arg.startsWith("--log-file=")) {
      const raw =
        arg === "--log-file" ? argv[i + 1] : arg.slice("--log-file=".length);
      if (arg === "--log-file") {
        i += 1;
      }
      if (!raw || raw.startsWith("--")) {
        throw new Error("--log-file requires a path.");
      }
      logFile = path.resolve(raw);
      continue;
    }
  }

  return { shardIndex, shardTotal, concurrency, maxRuns, logFile };
}

function bundleToLogShape(bundle: CliMatrixOptionBundle): BundleLogShape {
  return {
    architecture: bundle.architecture,
    validationLibrary: bundle.validationLibrary,
    styling: bundle.styling,
    router: bundle.router,
    tanstackQuery: bundle.tanstackQuery,
    libs: bundle.libs,
  };
}

function formatBundleSummary(bundle: CliMatrixOptionBundle): string {
  return JSON.stringify(bundleToLogShape(bundle));
}

function clampMessage(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}…[truncated]`;
}

function formatExecaFailure(error: unknown): string {
  if (error && typeof error === "object") {
    const record = error as {
      shortMessage?: string;
      message?: string;
      stderr?: string;
    };
    const stderr =
      typeof record.stderr === "string" && record.stderr.trim().length > 0
        ? record.stderr.trim()
        : "";
    const short =
      typeof record.shortMessage === "string" && record.shortMessage.length > 0
        ? record.shortMessage
        : "";
    const msg =
      typeof record.message === "string" && record.message.length > 0 ? record.message : "";
    const combined = [short, stderr || msg].filter(Boolean).join("\n---\n");
    if (combined.length > 0) {
      return clampMessage(combined, LOG_MESSAGE_MAX);
    }
  }
  if (error instanceof Error) {
    return clampMessage(error.message, LOG_MESSAGE_MAX);
  }
  return "Unknown error";
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort `rm`; returns after at most {@link MATRIX_RM_TIMEOUT_MS} even if delete is still in progress.
 */
async function tryRemoveTree(targetPath: string, context: string): Promise<void> {
  let finished = false;

  const runRm = async (): Promise<void> => {
    try {
      await rm(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 1,
        retryDelay: 100,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[matrix] ${context}: remove failed (${message})`);
    } finally {
      finished = true;
    }
  };

  const rmPromise = runRm();
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, MATRIX_RM_TIMEOUT_MS);
  });

  await Promise.race([rmPromise, timeoutPromise]);

  if (!finished) {
    console.warn(
      `[matrix] ${context}: delete still in progress after ${MATRIX_RM_TIMEOUT_MS}ms; continuing without waiting. Path: ${targetPath}`,
    );
  }
}

async function assertEntryForArchitecture(
  projectPath: string,
  architecture: CliMatrixOptionBundle["architecture"],
): Promise<void> {
  const simpleEntry = path.resolve(projectPath, "src", "index.tsx");
  const fsdEntry = path.resolve(projectPath, "src", "app", "index.tsx");
  if (architecture === "fsd") {
    if (!(await pathExists(fsdEntry))) {
      throw new Error(`Missing FSD entry: ${fsdEntry}`);
    }
    return;
  }
  if (!(await pathExists(simpleEntry))) {
    throw new Error(`Missing simple entry: ${simpleEntry}`);
  }
}

async function cleanupProject(projectPath: string): Promise<void> {
  await tryRemoveTree(projectPath, "project cleanup");
}

async function runOneCombination(params: {
  repoRoot: string;
  matrixWorkspace: string;
  globalIndex: number;
  bundle: CliMatrixOptionBundle;
  verbose: boolean;
}): Promise<CombinationLogRow> {
  const { repoRoot, matrixWorkspace, globalIndex, bundle, verbose } = params;
  const projectName = `m${String(globalIndex).padStart(4, "0")}`;
  const projectPath = path.resolve(matrixWorkspace, projectName);
  const fixtureJson = cliOptionsToInjectedFixtureJson(
    mergeCliMatrixBundle(bundle, projectName),
  );

  const started = performance.now();
  const stdio = verbose ? "inherit" : "pipe";
  const ts = () => new Date().toISOString();

  const finish = (
    status: "ok" | "fail",
    phase?: FailPhase,
    message?: string,
  ): CombinationLogRow => ({
    type: "result",
    timestamp: ts(),
    globalIndex,
    status,
    durationMs: Math.round(performance.now() - started),
    bundle: bundleToLogShape(bundle),
    phase,
    message: message !== undefined ? clampMessage(message, LOG_MESSAGE_MAX) : undefined,
  });

  try {
    let phase: FailPhase = "scaffold";
    try {
      await execa("tsx", [path.resolve(repoRoot, "src", "cli.ts")], {
        cwd: matrixWorkspace,
        stdio,
        env: {
          ...process.env,
          VOSHOD_PROMPT_FIXTURE_JSON: fixtureJson,
        },
      });
    } catch (error) {
      return finish("fail", phase, formatExecaFailure(error));
    }

    phase = "assert";
    try {
      await access(path.resolve(projectPath, "package.json"), constants.F_OK);
      await assertEntryForArchitecture(projectPath, bundle.architecture);
    } catch (error) {
      const msg = error instanceof Error ? error.message : formatExecaFailure(error);
      return finish("fail", phase, msg);
    }

    phase = "install";
    try {
      await execa("npm", ["install"], { cwd: projectPath, stdio });
    } catch (error) {
      return finish("fail", phase, formatExecaFailure(error));
    }

    phase = "build";
    try {
      await execa("npm", ["run", "build"], { cwd: projectPath, stdio });
    } catch (error) {
      return finish("fail", phase, formatExecaFailure(error));
    }

    const row = finish("ok");
    console.log(
      `[matrix] ok #${globalIndex} ${row.durationMs}ms ${formatBundleSummary(bundle)}`,
    );
    return row;
  } finally {
    await cleanupProject(projectPath);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, slotIndex: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  if (items.length === 0) {
    return results;
  }
  if (concurrency < 2) {
    for (let i = 0; i < items.length; i += 1) {
      results[i] = await worker(items[i], i);
    }
    return results;
  }

  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next;
      next += 1;
      if (i >= items.length) {
        return;
      }
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

function defaultLogFilePath(params: {
  repoRoot: string;
  runId: string;
  shardIndex: number | null;
  shardTotal: number | null;
}): string {
  const logsDir = path.resolve(params.repoRoot, "logs");
  const shardSuffix =
    params.shardIndex !== null && params.shardTotal !== null
      ? `-shard-${params.shardIndex}-of-${params.shardTotal}`
      : "";
  const name = `matrix-${params.runId}${shardSuffix}.log`;
  return path.join(logsDir, name);
}

/**
 * Deletes `.tmp/cli-matrix` (previous run workspaces and any leftover generated
 * projects) and recreates an empty base directory so interrupted runs do not pile up.
 */
async function cleanupStaleMatrixWorkspaces(repoRoot: string): Promise<void> {
  const matrixTempRoot = path.resolve(repoRoot, ".tmp", "cli-matrix");
  await tryRemoveTree(matrixTempRoot, "stale matrix temp");
  await mkdir(matrixTempRoot, { recursive: true });
}

async function writeMatrixLog(params: {
  logPath: string;
  meta: MatrixMetaLine;
  rows: CombinationLogRow[];
}): Promise<void> {
  await mkdir(path.dirname(params.logPath), { recursive: true });
  const lines = [
    JSON.stringify(params.meta),
    ...params.rows
      .slice()
      .sort((a, b) => a.globalIndex - b.globalIndex)
      .map((row) => JSON.stringify(row)),
  ];
  await writeFile(params.logPath, `${lines.join("\n")}\n`, "utf8");
}

async function run(): Promise<void> {
  const argv = process.argv.slice(2);
  const flags = parseMatrixCli(argv);
  const verbose = argv.includes("--verbose");

  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirectory = path.dirname(currentFilePath);
  const repoRoot = path.resolve(currentDirectory, "..");

  const allBundles = enumerateCliMatrixOptionBundles();
  const indexed: { globalIndex: number; bundle: CliMatrixOptionBundle }[] = [];

  for (let i = 0; i < allBundles.length; i += 1) {
    if (flags.shardTotal !== null && flags.shardIndex !== null) {
      if (i % flags.shardTotal !== flags.shardIndex) {
        continue;
      }
    }
    indexed.push({ globalIndex: i, bundle: allBundles[i] });
  }

  let toRun = indexed;
  if (flags.maxRuns !== null) {
    toRun = indexed.slice(0, flags.maxRuns);
  }

  await cleanupStaleMatrixWorkspaces(repoRoot);

  const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const matrixWorkspace = path.resolve(repoRoot, ".tmp", "cli-matrix", runId);
  await mkdir(matrixWorkspace, { recursive: true });

  const logPath =
    flags.logFile ??
    defaultLogFilePath({
      repoRoot,
      runId,
      shardIndex: flags.shardIndex,
      shardTotal: flags.shardTotal,
    });

  console.log(`[matrix] repoRoot: ${repoRoot}`);
  console.log(`[matrix] workspace: ${matrixWorkspace}`);
  console.log("[matrix] cleaned stale generated projects under .tmp/cli-matrix (if any)");
  console.log(`[matrix] log file: ${logPath}`);
  console.log(`[matrix] total combinations (full matrix): ${CLI_MATRIX_COMBINATION_COUNT}`);
  console.log(`[matrix] this run: ${toRun.length} combination(s)`);
  if (flags.shardTotal !== null && flags.shardIndex !== null) {
    console.log(`[matrix] shard: ${flags.shardIndex}/${flags.shardTotal}`);
  }
  console.log(`[matrix] concurrency: ${flags.concurrency}`);

  const startedAll = performance.now();

  const rows = await mapWithConcurrency(toRun, flags.concurrency, async (entry) => {
    const row = await runOneCombination({
      repoRoot,
      matrixWorkspace,
      globalIndex: entry.globalIndex,
      bundle: entry.bundle,
      verbose,
    });
    if (row.status === "fail") {
      console.error(
        `[matrix] FAIL #${row.globalIndex} phase=${row.phase ?? "?"} ${row.durationMs}ms ${formatBundleSummary(entry.bundle)}`,
      );
      if (row.message !== undefined && row.message.length > 0) {
        console.error(`[matrix]   ${row.message.split("\n").join("\n[matrix]   ")}`);
      }
    }
    return row;
  });

  const totalMs = Math.round(performance.now() - startedAll);
  const passed = rows.filter((r) => r.status === "ok").length;
  const failed = rows.filter((r) => r.status === "fail").length;

  const meta: MatrixMetaLine = {
    type: "meta",
    timestamp: new Date().toISOString(),
    runId,
    shard:
      flags.shardIndex !== null && flags.shardTotal !== null
        ? { index: flags.shardIndex, total: flags.shardTotal }
        : null,
    concurrency: flags.concurrency,
    repoRoot,
    plannedCount: toRun.length,
    matrixWorkspace,
    logFile: logPath,
  };

  await writeMatrixLog({ logPath, meta, rows });

  console.log("");
  console.log("[matrix] ========== summary ==========");
  console.log(`[matrix] passed: ${passed}`);
  console.log(`[matrix] failed: ${failed}`);
  console.log(`[matrix] total wall time: ${totalMs}ms`);
  console.log(`[matrix] log written: ${logPath}`);
  if (failed > 0) {
    console.error("[matrix] failed combinations:");
    for (const row of rows.filter((r) => r.status === "fail").sort((a, b) => a.globalIndex - b.globalIndex)) {
      console.error(
        `[matrix]   #${row.globalIndex} phase=${row.phase ?? "?"} ${row.message?.split("\n")[0] ?? ""}`,
      );
    }
    process.exitCode = 1;
  }

  await tryRemoveTree(matrixWorkspace, "final workspace cleanup");
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown matrix failure";
  console.error(`[matrix] fatal: ${message}`);
  process.exitCode = 1;
});
