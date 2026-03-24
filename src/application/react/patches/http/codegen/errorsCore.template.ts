import type { ValidationCodegenKind } from "./validationProfile.js";

export function errorsCoreSource(kind: ValidationCodegenKind): string {
  if (kind === "none") {
    return `export type ApiErrorKind = "network" | "http" | "unknown";

export interface ApiErrorParams {
  message: string;
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
`;
  }

  return `export type ApiErrorKind = "network" | "http" | "validation" | "unknown";

export interface ApiErrorParams {
  message: string;
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.kind = params.kind;
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
`;
}
