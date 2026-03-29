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

## Available options

- **Framework:** **React** or **Vue** (Vite + TypeScript + `vue-ts` / `react-ts` scaffolds); the generator is structured so additional frameworks can follow the same prompt flow.
- **Architecture:** **Simple** (flat `src/`) or **FSD** (Feature-Sliced style layout).
- **HTTP client:** **Axios**, **ofetch**, or **Fetch API** (built-in `fetch` via a small `httpClient` wrapper — no extra HTTP dependency). All modes share the same API layer shape (errors, `baseService`, optional TanStack Query helpers).
- **Formatter:** **Prettier** (default ESLint stack from the Vite template + Prettier scripts and `.prettierrc`) or **Biome** (`biome.json`, `lint` / `format` scripts, ESLint devDependencies removed from the scaffold, `eslint.config.js` pruned after write).
- **Validation:** **Zod** for API/env parsing, or **none** (no Zod in generated code).
- **Styling:** **Tailwind CSS** or **plain CSS**.
- **Router:** **React Router** or **TanStack Router** (React), **Vue Router** (Vue), or **no router**.
- **Client state manager:** **Zustand** (React), **Pinia** (Vue), or **none**.
- **Async / server state:** **TanStack Query** (`QueryClient` + provider wiring), or on Vue **Pinia Colada** instead, or **none**.
- **Optional libraries** (multiselect): TanStack Table, TanStack Form, React Hook Form (see current prompt list when you run the CLI).

Generated projects use the `@/*` path alias (Vite + TypeScript) where the template applies.

## Open source

`create-voshod` is open source (MIT). If the CLI saved you time, we’d be glad for your support — **[give the repo a star on GitHub](https://github.com/ayysoawesome/create-voshod)**. It helps others find the project and keeps us motivated to improve it.

## Contributors

- **Extending the generator** (options, patches, dependencies):  
  [docs/development-workflow.en.md](docs/development-workflow.en.md) · [docs/development-workflow.ru.md](docs/development-workflow.ru.md)
- **Tests, smoke, local publish checks:**  
  [docs/testing.md](docs/testing.md) · [docs/testing.ru.md](docs/testing.ru.md)

## License

MIT
