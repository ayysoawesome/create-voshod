import type {
  AdditionalLibrary,
  Architecture,
  CLIOptions,
  Framework,
  HttpClient,
  RouterLibrary,
  Styling,
  ValidationLibrary,
} from "@/domain/generation/index.js";
import { ADDITIONAL_LIBRARY_CHOICES } from "@/presentation/cli/prompts/promptChoices.js";

/**
 * Ordered list of additional-library prompt values (used by {@link iterateLibPowerset};
 * the build matrix uses {@link CLI_MATRIX_LIBS_FOR_BUILD} instead of expanding subsets).
 */
export const CLI_MATRIX_LIB_ORDER: readonly AdditionalLibrary[] =
  ADDITIONAL_LIBRARY_CHOICES.map((choice) => choice.value);

/**
 * All prompt answers except `projectName`, matching current interactive CLI domains.
 */
export type CliMatrixOptionBundle = Omit<CLIOptions, "projectName">;

/**
 * Builds the JSON array passed to `prompts.inject`, in the same order as
 * {@link PromptService.askOptions} in `PromptService.ts`.
 *
 * @param options Full CLI options including `projectName`.
 * @returns Serializable array for `VOSHOD_PROMPT_FIXTURE_JSON`.
 */
export function cliOptionsToInjectedAnswers(options: CLIOptions): unknown[] {
  return [
    options.projectName,
    options.framework,
    options.architecture,
    options.httpClient,
    options.validationLibrary,
    options.styling,
    options.router,
    options.tanstackQuery,
    options.libs,
  ];
}

/**
 * @param options Full CLI options including `projectName`.
 * @returns JSON string for `VOSHOD_PROMPT_FIXTURE_JSON`.
 */
export function cliOptionsToInjectedFixtureJson(options: CLIOptions): string {
  return JSON.stringify(cliOptionsToInjectedAnswers(options));
}

/**
 * Powerset of `CLI_MATRIX_LIB_ORDER` in deterministic order (by bitmask), each subset sorted lexicographically.
 */
export function iterateLibPowerset(): AdditionalLibrary[][] {
  const order = [...CLI_MATRIX_LIB_ORDER];
  const n = order.length;
  const result: AdditionalLibrary[][] = [];
  for (let mask = 0; mask < 1 << n; mask += 1) {
    const subset: AdditionalLibrary[] = [];
    for (let bit = 0; bit < n; bit += 1) {
      if ((mask >> bit) & 1) {
        subset.push(order[bit]);
      }
    }
    subset.sort((a, b) => a.localeCompare(b));
    result.push(subset);
  }
  return result;
}

const MATRIX_FRAMEWORK: Framework = "react";
const MATRIX_HTTP: HttpClient = "axios";

const MATRIX_ARCHITECTURES: Architecture[] = ["simple", "fsd"];
const MATRIX_VALIDATION: ValidationLibrary[] = ["zod", null];
const MATRIX_STYLING: Styling[] = ["tailwind", "css"];
const MATRIX_ROUTERS: RouterLibrary[] = [
  "react-router-dom",
  "@tanstack/react-router",
  null,
];
const MATRIX_QUERY: boolean[] = [true, false];

/**
 * `libs` value for the pre-release build matrix. Optional multiselect packages
 * do not change generated TS/TSX today (only `package.json` dependencies), so the
 * matrix does not expand the powerset of `libs`.
 */
export const CLI_MATRIX_LIBS_FOR_BUILD: readonly AdditionalLibrary[] = [];

/**
 * Count of combinations for the current CLI build matrix (excludes `projectName`;
 * does not vary `libs` — see {@link CLI_MATRIX_LIBS_FOR_BUILD}).
 */
export const CLI_MATRIX_COMBINATION_COUNT =
  MATRIX_ARCHITECTURES.length *
  MATRIX_VALIDATION.length *
  MATRIX_STYLING.length *
  MATRIX_ROUTERS.length *
  MATRIX_QUERY.length;

/**
 * Enumerates {@link CliMatrixOptionBundle} rows for the CLI build matrix: react,
 * axios, and all combinations of architecture / validation / styling / router /
 * tanstackQuery, with a fixed {@link CLI_MATRIX_LIBS_FOR_BUILD} `libs` list.
 */
export function enumerateCliMatrixOptionBundles(): CliMatrixOptionBundle[] {
  const bundles: CliMatrixOptionBundle[] = [];

  for (const architecture of MATRIX_ARCHITECTURES) {
    for (const validationLibrary of MATRIX_VALIDATION) {
      for (const styling of MATRIX_STYLING) {
        for (const router of MATRIX_ROUTERS) {
          for (const tanstackQuery of MATRIX_QUERY) {
            bundles.push({
              framework: MATRIX_FRAMEWORK,
              architecture,
              httpClient: MATRIX_HTTP,
              validationLibrary,
              styling,
              router,
              tanstackQuery,
              libs: [...CLI_MATRIX_LIBS_FOR_BUILD],
            });
          }
        }
      }
    }
  }

  return bundles;
}

/**
 * @param bundle Options without `projectName`.
 * @param projectName Directory name for the generated project.
 * @returns Full {@link CLIOptions}.
 */
export function mergeCliMatrixBundle(
  bundle: CliMatrixOptionBundle,
  projectName: string,
): CLIOptions {
  return {
    projectName,
    ...bundle,
  };
}
