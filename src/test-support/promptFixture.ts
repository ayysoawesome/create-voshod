import type {
  AdditionalLibrary,
  Architecture,
  AsyncState,
  CLIOptions,
  ClientState,
  Formatter,
  Framework,
  HttpClient,
  RouterLibrary,
  Styling,
  ValidationLibrary,
} from "@/domain/generation/index.js";
import { ALL_ADDITIONAL_LIBRARY_IDS } from "@/domain/generation/frameworkCapabilityCatalog.js";

/**
 * Ordered list of additional-library prompt values (used by {@link iterateLibPowerset};
 * the build matrix uses {@link CLI_MATRIX_LIBS_FOR_BUILD} instead of expanding subsets).
 */
export const CLI_MATRIX_LIB_ORDER: readonly AdditionalLibrary[] = [
  ...ALL_ADDITIONAL_LIBRARY_IDS,
];

/**
 * All prompt answers except `projectName`, matching current interactive CLI domains.
 */
export type CliMatrixOptionBundle = Omit<CLIOptions, "projectName">;

/**
 * Builds the JSON array passed to `prompts.inject`, in the same order as
 * {@link PromptService.askOptions} in `PromptService.ts` (two sequential prompt batches).
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
    options.formatter,
    options.router,
    options.clientState,
    options.asyncState,
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

const MATRIX_FRAMEWORKS: Framework[] = ["react", "vue"];
const MATRIX_HTTP_CLIENTS: HttpClient[] = ["axios", "ofetch", null];

const MATRIX_ARCHITECTURES: Architecture[] = ["simple", "fsd"];
const MATRIX_VALIDATION: ValidationLibrary[] = ["zod", null];
const MATRIX_STYLING: Styling[] = ["tailwind", "css"];
const MATRIX_FORMATTERS: Formatter[] = ["prettier", "biome"];
const MATRIX_ROUTERS_REACT: RouterLibrary[] = [
  "react-router-dom",
  "@tanstack/react-router",
  null,
];
const MATRIX_ROUTERS_VUE: RouterLibrary[] = ["vue-router", null];

function routersForFramework(framework: Framework): readonly RouterLibrary[] {
  return framework === "vue" ? MATRIX_ROUTERS_VUE : MATRIX_ROUTERS_REACT;
}

/**
 * Cartesian product of client × async state choices per framework (matches CLI selects).
 */
function clientAsyncPairsForFramework(
  framework: Framework,
): readonly { clientState: ClientState; asyncState: AsyncState }[] {
  if (framework === "react") {
    const clients: ClientState[] = [null, "zustand"];
    const asyncs: AsyncState[] = [null, "tanstack-query"];
    const pairs: { clientState: ClientState; asyncState: AsyncState }[] = [];
    for (const clientState of clients) {
      for (const asyncState of asyncs) {
        pairs.push({ clientState, asyncState });
      }
    }
    return pairs;
  }
  const clients: ClientState[] = [null, "pinia"];
  const asyncs: AsyncState[] = [null, "tanstack-query", "pinia-colada"];
  const pairs: { clientState: ClientState; asyncState: AsyncState }[] = [];
  for (const clientState of clients) {
    for (const asyncState of asyncs) {
      pairs.push({ clientState, asyncState });
    }
  }
  return pairs;
}

/**
 * `libs` value for the pre-release build matrix. Optional multiselect packages
 * do not change generated TS/TSX today (only `package.json` dependencies), so the
 * matrix does not expand the powerset of `libs`.
 */
export const CLI_MATRIX_LIBS_FOR_BUILD: readonly AdditionalLibrary[] = [];

const MATRIX_CLIENT_ASYNC_FACTOR_REACT = clientAsyncPairsForFramework("react").length;
const MATRIX_CLIENT_ASYNC_FACTOR_VUE = clientAsyncPairsForFramework("vue").length;

/**
 * Count of combinations for the current CLI build matrix (excludes `projectName`;
 * does not vary `libs` — see {@link CLI_MATRIX_LIBS_FOR_BUILD}).
 */
export const CLI_MATRIX_COMBINATION_COUNT = MATRIX_FRAMEWORKS.reduce(
  (sum, framework) => {
    const r = routersForFramework(framework).length;
    const ca =
      framework === "vue"
        ? MATRIX_CLIENT_ASYNC_FACTOR_VUE
        : MATRIX_CLIENT_ASYNC_FACTOR_REACT;
    return (
      sum +
      MATRIX_ARCHITECTURES.length *
        MATRIX_HTTP_CLIENTS.length *
        MATRIX_VALIDATION.length *
        MATRIX_STYLING.length *
        MATRIX_FORMATTERS.length *
        r *
        ca
    );
  },
  0,
);

/**
 * Enumerates {@link CliMatrixOptionBundle} rows for the CLI build matrix: all
 * frameworks, HTTP modes, formatters, and combinations of architecture / validation /
 * styling / router (per framework) / clientState / asyncState, with a fixed
 * {@link CLI_MATRIX_LIBS_FOR_BUILD} `libs` list.
 */
export function enumerateCliMatrixOptionBundles(): CliMatrixOptionBundle[] {
  const bundles: CliMatrixOptionBundle[] = [];

  for (const framework of MATRIX_FRAMEWORKS) {
    const routers = routersForFramework(framework);
    const clientAsyncPairs = clientAsyncPairsForFramework(framework);
    for (const architecture of MATRIX_ARCHITECTURES) {
      for (const httpClient of MATRIX_HTTP_CLIENTS) {
        for (const validationLibrary of MATRIX_VALIDATION) {
          for (const styling of MATRIX_STYLING) {
            for (const formatter of MATRIX_FORMATTERS) {
              for (const router of routers) {
                for (const { clientState, asyncState } of clientAsyncPairs) {
                  bundles.push({
                    framework,
                    architecture,
                    httpClient,
                    validationLibrary,
                    styling,
                    formatter,
                    router,
                    clientState,
                    asyncState,
                    libs: [...CLI_MATRIX_LIBS_FOR_BUILD],
                  });
                }
              }
            }
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
