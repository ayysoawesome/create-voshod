import { BaseError } from "./BaseError.js";

/**
 * Infrastructure-layer error with `INFRASTRUCTURE_ERROR` code.
 */
export class InfrastructureError extends BaseError {
  /**
   * @param message Human-readable error message.
   * @param details Optional structured metadata.
   */
  constructor(message: string, details?: unknown) {
    super(message, "INFRASTRUCTURE_ERROR", details);
  }
}

