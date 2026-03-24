export function validationSource(): string {
  return `import type { ZodType } from "zod";
import { ZodError } from "zod";
import { ApiError } from "./errors";

export const validationErrorFromZod = (error: ZodError<unknown>): ApiError =>
  new ApiError({
    message: "Response validation failed",
    kind: "validation",
    details: error.flatten(),
  });

export const validateResponse = <T>(schema: ZodType<T>, data: unknown): T => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw validationErrorFromZod(parsed.error);
  }
  return parsed.data;
};
`;
}
