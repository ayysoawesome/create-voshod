import type { ValidationLibrary } from "@/domain/generation/index.js";

/** User-facing validation choice today; extend when adding e.g. valibot. */
export type ValidationCodegenKind = "zod" | "none";

/**
 * Resolves how API files should be generated for validation.
 * Central place to plug in new validators without scattering `if (useZod)` across templates.
 */
export function validationCodegenKind(
  validationLibrary: ValidationLibrary,
): ValidationCodegenKind {
  if (validationLibrary === "zod") {
    return "zod";
  }
  return "none";
}

export function withApiValidation(
  validationLibrary: ValidationLibrary,
): boolean {
  return validationCodegenKind(validationLibrary) !== "none";
}
