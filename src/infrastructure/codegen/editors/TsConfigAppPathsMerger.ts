import type { Architecture } from "@/domain/generation/ProjectOptions.js";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";

export class TsConfigJsonParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TsConfigJsonParseError";
  }
}

type TsConfigJson = {
  compilerOptions?: {
    paths?: Record<string, string[]>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function pathsToMergeForArchitecture(architecture: Architecture): Record<string, string[]> {
  const base = {
    "@/*": ["./src/*"],
  };
  if (architecture === "fsd") {
    return {
      ...base,
      "@icons/*": ["./src/shared/assets/icons/*"],
      "@images/*": ["./src/shared/assets/images/*"],
    };
  }
  return {
    ...base,
    "@icons/*": ["./src/assets/icons/*"],
    "@images/*": ["./src/assets/images/*"],
  };
}

function parseTsConfigDocument(raw: string): TsConfigJson {
  const errors: ParseError[] = [];
  const parsed = parse(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const first = errors[0];
    const detail =
      first !== undefined
        ? `offset ${first.offset} (${printParseErrorCode(first.error)})`
        : "unknown position";
    throw new TsConfigJsonParseError(`tsconfig.app.json: invalid JSON/JSONC (${detail}).`);
  }

  if (parsed === undefined || typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TsConfigJsonParseError("tsconfig.app.json must contain a root JSON object.");
  }

  return parsed as TsConfigJson;
}

/**
 * Merges `compilerOptions.paths` into an existing `tsconfig.app.json` body without dropping other keys.
 * Accepts JSONC as produced by current Vite templates (comments, trailing commas).
 */
export function mergeTsConfigAppPaths(
  rawJson: string,
  profile: { architecture: Architecture },
): string {
  const parsed = parseTsConfigDocument(rawJson);
  const nextPaths = {
    ...(parsed.compilerOptions?.paths ?? {}),
    ...pathsToMergeForArchitecture(profile.architecture),
  };
  const compilerOptions = {
    ...(parsed.compilerOptions ?? {}),
    paths: nextPaths,
  };
  const out: TsConfigJson = {
    ...parsed,
    compilerOptions,
  };
  return `${JSON.stringify(out, null, 2)}\n`;
}
