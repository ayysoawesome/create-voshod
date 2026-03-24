# Testing the CLI (contributors)

Commands below are for **repository development**, not for end users of the published package.

## Unit tests

```bash
npm run test
```

Typecheck (no emit):

```bash
npx tsc --noEmit
```

## Local release verification

Before publishing:

```bash
npm run test
npm run build
npm pack
```

For a **full pre-release check** of every interactive CLI combination (scaffold + `npm install` + `npm run build` per combination), run the matrix separately — it is slow (network-heavy) and is **not** part of `npm test`.

With the current prompt set (React-only, Axios-only HTTP), the full **build** matrix is **48** combinations (architecture × validation × styling × router × TanStack Query). The multiselect for extra npm packages is **not** expanded: those choices only affect `package.json` dependencies, not generated source, so separate installs/builds per subset are skipped.

```bash
npm run test:cli:matrix
```

Behavior:

- Runs **all** planned combinations even if some fail; does not stop on the first error.
- At startup, **clears** `.tmp/cli-matrix` so leftover generated projects from interrupted runs are removed, then creates a fresh workspace for this run. Each delete is **time-capped** (~10s): if a file stays locked (common with native `*.node` addons on Windows), the script **continues** and may leave some folders on disk.
- Prints per-combination `ok` / `FAIL` lines, then a **summary** (passed / failed counts, wall time).
- Writes a **JSON Lines** log file (first line is `{"type":"meta",...}`, then one `{"type":"result",...}` per combination). Default path: `logs/matrix-<runId>.log` at the repo root (directory `logs/` is created as needed), or `logs/matrix-<runId>-shard-i-of-n.log` when using `--shard`.
- **Exit code `1`** if any combination failed (for CI); `0` if all passed.

Useful flags:

- `--max=N` — run only the first N combinations (quick sanity check).
- `--shard=i/n` — run subset `index % n === i` for parallel CI jobs (example: four jobs with `--shard=0/4` … `--shard=3/4`).
- `--concurrency=k` — run up to `k` combinations in parallel (default `1`). Higher values stress CPU and network.
- `--log-file=<path>` — write the JSONL log to an explicit path (parent directories are created).
- `--verbose` — stream child process output (very noisy).

Example GitHub Actions matrix job `shard` strategy: `0,1,2,3` with `npm run test:cli:matrix -- --shard=${{ matrix.shard }}/4`.

## Smoke CLI check

Verifies that the CLI (from `src/cli.ts`) can scaffold a project and that the generated app builds:

```bash
npm run test:cli:smoke
```

Behavior:

- Runs the CLI from `src/cli.ts` (no separate `tsup` step for the CLI during this script).
- Creates a temporary project under `.tmp/cli-smoke`.
- Answers prompts via an injected fixture (`VOSHOD_PROMPT_FIXTURE_JSON`).
- Installs dependencies in the generated project and runs its build.
- Removes the temp project on success.

Optional flags:

- Keep the generated project: `npm run test:cli:smoke -- --keep`
- Fixed directory name: `npm run test:cli:smoke -- --name my-smoke-project`

## Interactive CLI playground

Fully interactive run (you answer all prompts):

```bash
npm run test:cli:play
```

Same, then **install + build** for the generated project:

```bash
npm run test:cli:play:full
```

Behavior:

- Workspace under `.tmp/cli-playground/<timestamp>`.
- CLI from `src/cli.ts`.
- After the run, the script asks whether to delete or keep the playground directory.

## Prompt fixtures (automation)

Non-interactive runs can inject answers with the environment variable `VOSHOD_PROMPT_FIXTURE_JSON` (JSON array matching the prompt order in `PromptService.askOptions`).

Single source of truth for building that array from typed options: `src/test-support/promptFixture.ts` (`cliOptionsToInjectedFixtureJson`). `scripts/cli-smoke.ts` and `scripts/cli-combination-matrix.ts` use it so prompt order changes stay in sync.
