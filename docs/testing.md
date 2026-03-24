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

Non-interactive runs can inject answers with the environment variable `VOSHOD_PROMPT_FIXTURE_JSON` (JSON array matching the prompt order). See `scripts/cli-smoke.ts` for an example payload.
