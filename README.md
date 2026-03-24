# create-voshod

Scaffold **Vite** + **TypeScript** projects through an interactive CLI (similar UX to `create-vite`). **React** is supported today; other framework targets are planned for the same flow.

**Requirements:** Node.js 18.18+

## Quick start

Published as **`create-voshod`**. With npm, `create` maps to the `create-*` package name:

```bash
npm create voshod@latest
```

Other package managers:

```bash
pnpm create voshod@latest
yarn create voshod@latest
bun create voshod@latest
```

You can also run the binary directly: `npx create-voshod@latest`.

Follow the prompts: project name, stack options, and optional libraries. A new directory is created with the generated project.

## What you get

- **Framework:** **React** (Vite + TypeScript) in the current CLI; the generator is structured so additional frameworks can be added to the same prompt flow.
- **Architecture:** **Simple** (flat `src/`) or **FSD** (Feature-Sliced style layout).
- **HTTP client:** Axios with a small shared API layer (errors, base service, optional TanStack Query integration).
- **Validation:** **Zod** for API/env parsing, or **none** (no Zod in generated code).
- **Styling:** **Tailwind CSS** or **plain CSS**.
- **Router:** **React Router**, **TanStack Router**, or **no router**.
- **TanStack Query:** optional (`QueryClient` + provider wiring when enabled).
- **Optional libraries** (multiselect): Zustand, TanStack Table, React Hook Form (see current prompt list when you run the CLI).

Generated projects use the `@/*` path alias (Vite + TypeScript) where the template applies.

## Contributors

- **Extending the generator** (options, patches, dependencies):  
  [docs/development-workflow.en.md](docs/development-workflow.en.md) · [docs/development-workflow.ru.md](docs/development-workflow.ru.md)
- **Tests, smoke, local publish checks:**  
  [docs/testing.md](docs/testing.md) · [docs/testing.ru.md](docs/testing.ru.md)

## License

MIT
