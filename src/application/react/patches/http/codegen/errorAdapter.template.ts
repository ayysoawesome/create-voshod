import type { ValidationCodegenKind } from "./validationProfile.js";

export function errorAdapterSource(
  axiosMode: boolean,
  validationKind: ValidationCodegenKind,
): string {
  const axiosImports = axiosMode
    ? `import type { AxiosError } from "axios";
import { isAxiosError } from "axios";
`
    : "";

  const zodImports =
    validationKind === "zod"
      ? `import { ZodError } from "zod";
import { validationErrorFromZod } from "./validation";
`
      : "";

  const errorsImport = axiosMode
    ? `import { ApiError, type ApiErrorKind } from "./errors";
`
    : `import { ApiError } from "./errors";
`;

  const axiosPrivateMethod = axiosMode
    ? `
  private fromAxiosError(error: AxiosError<unknown>): ApiError {
    const status = error.response?.status;
    const code = error.code;
    const details = error.response?.data;
    const kind: ApiErrorKind = typeof status === "number" ? "http" : "network";
    return new ApiError({
      message: error.message,
      kind,
      status,
      code: typeof code === "string" ? code : undefined,
      details,
    });
  }
`
    : "";

  const zodBranchInNormalize =
    validationKind === "zod"
      ? `    if (error instanceof ZodError) {
      return validationErrorFromZod(error);
    }

`
      : "";

  const axiosBranchInNormalize = axiosMode
    ? `    if (isAxiosError(error)) {
      return this.fromAxiosError(error);
    }

`
    : `    if (typeof Response !== "undefined" && error instanceof Response) {
      return new ApiError({
        message: error.statusText || "HTTP error",
        kind: "http",
        status: error.status,
      });
    }

`;

  return `${axiosImports}${zodImports}${errorsImport}

export class ApiErrorNormalizer {
  normalize(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

${axiosBranchInNormalize}${zodBranchInNormalize}    if (error instanceof Error) {
      return new ApiError({ message: error.message, kind: "unknown" });
    }

    return new ApiError({ message: "Unknown error", kind: "unknown", details: error });
  }
${axiosPrivateMethod}}

const apiErrorNormalizer = new ApiErrorNormalizer();

export const toApiError = (error: unknown): ApiError => apiErrorNormalizer.normalize(error);
`;
}
