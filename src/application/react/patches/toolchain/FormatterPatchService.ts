import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import { GenerationContext } from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ESLINT_DEV_DEPENDENCIES = [
  "eslint",
  "@eslint/js",
  "eslint-plugin-react-hooks",
  "eslint-plugin-react-refresh",
  "typescript-eslint",
  "globals",
] as const;

const biomeConfig = {
  $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
  formatter: {
    enabled: true,
    indentStyle: "space",
    lineWidth: 100,
  },
  css: {
    parser: {
      tailwindDirectives: true,
    },
  },
  javascript: {
    formatter: {
      quoteStyle: "single",
      semicolons: "always",
    },
  },
  linter: {
    enabled: true,
    rules: {
      recommended: true,
    },
  },
};

const prettierConfig = {
  singleQuote: true,
  semi: true,
};

/**
 * Switches formatting/linting toolchain between default ESLint+Prettier flow and Biome-only flow.
 */
export class FormatterPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react" || context.framework === "vue";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    if (context.options.value.formatter === "prettier") {
      const rawPackageJson = composer.getFile("package.json");
      if (rawPackageJson !== null) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawPackageJson);
        } catch {
          parsed = null;
        }

        if (isJsonObject(parsed)) {
          const scripts = isJsonObject(parsed.scripts) ? { ...parsed.scripts } : {};
          scripts.format = "prettier --write .";
          scripts["format:write"] = "prettier --write .";
          parsed.scripts = scripts;
          composer.upsertFile("package.json", `${JSON.stringify(parsed, null, 2)}\n`);
        }
      }
      composer.upsertFile(".prettierrc", `${JSON.stringify(prettierConfig, null, 2)}\n`);
      return;
    }

    if (context.options.value.formatter !== "biome") {
      return;
    }

    const rawPackageJson = composer.getFile("package.json");
    if (rawPackageJson === null) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawPackageJson);
    } catch {
      return;
    }
    if (!isJsonObject(parsed)) {
      return;
    }

    const scripts = isJsonObject(parsed.scripts) ? { ...parsed.scripts } : {};
    scripts.lint = "biome check .";
    scripts.format = "biome format .";
    scripts["format:write"] = "biome format --write .";
    parsed.scripts = scripts;

    const devDependencies = isJsonObject(parsed.devDependencies)
      ? { ...parsed.devDependencies }
      : {};
    for (const dependencyName of ESLINT_DEV_DEPENDENCIES) {
      delete devDependencies[dependencyName];
    }
    parsed.devDependencies = devDependencies;

    composer.upsertFile("package.json", `${JSON.stringify(parsed, null, 2)}\n`);
    composer.upsertFile("biome.json", `${JSON.stringify(biomeConfig, null, 2)}\n`);
  }
}

