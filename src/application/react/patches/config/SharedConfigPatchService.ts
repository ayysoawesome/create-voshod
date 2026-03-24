import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

/**
 * Adds `env` config under the layout profile (`src/shared/config` or `src/config`).
 */
export class SharedConfigPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const useZod = context.options.value.validationLibrary === "zod";
    const root = profile.configRoot;

    if (useZod) {
      composer.upsertFile(
        `${root}/env.ts`,
        `import { object, string, type infer as zInfer } from "zod";

export const envConfigSchema = object({
  MODE: string(),
  VITE_API_BASE_URL: string().min(1),
});

type EnvConfig = zInfer<typeof envConfigSchema>;

const readEnv = (): EnvConfig => {
  const raw = {
    MODE: import.meta.env.MODE,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  };
  const parsed = envConfigSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(\`Invalid environment: \${parsed.error.message}\`);
  }
  return parsed.data;
};

const env = readEnv();

export const envConfig = {
  mode: env.MODE,
  apiBaseUrl: env.VITE_API_BASE_URL,
  isDev: env.MODE === "development",
  isTest: env.MODE === "test",
  isProd: env.MODE === "production",
} as const;
`,
      );
    } else {
      composer.upsertFile(
        `${root}/env.ts`,
        `type Mode = "development" | "test" | "production";

const mode = import.meta.env.MODE as Mode;

const required = (key: "VITE_API_BASE_URL"): string => {
  const value = import.meta.env[key];
  if (value === undefined || value === "") {
    throw new Error(\`Missing environment variable: \${key}\`);
  }
  return value;
};

export const envConfig = {
  mode,
  apiBaseUrl: required("VITE_API_BASE_URL"),
  isDev: mode === "development",
  isTest: mode === "test",
  isProd: mode === "production",
} as const;
`,
      );
    }

    composer.upsertFile(`${root}/index.ts`, `export { envConfig } from "./env";
`);
  }
}
