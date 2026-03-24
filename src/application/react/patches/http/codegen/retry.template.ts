import type { ValidationCodegenKind } from "./validationProfile.js";

export function retrySource(validationKind: ValidationCodegenKind): string {
  const validationRetryBlock =
    validationKind === "zod"
      ? `
  if (apiError.kind === "validation") {
    return false;
  }

`
      : "";

  return `import type { ApiError } from "./errors";
import { isApiError } from "./errors";
import { toApiError } from "./errorAdapter";

export const shouldRetryApiError = (
  failureCount: number,
  error: unknown,
  maxRetries: number = 3,
): boolean => {
  const apiError: ApiError = isApiError(error) ? error : toApiError(error);

  if (failureCount >= maxRetries) {
    return false;
  }
${validationRetryBlock}  if (
    apiError.kind === "http" &&
    apiError.status !== undefined &&
    apiError.status >= 400 &&
    apiError.status < 500
  ) {
    return false;
  }

  return true;
};
`;
}
