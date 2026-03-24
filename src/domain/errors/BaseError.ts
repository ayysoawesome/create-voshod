/**
 * Base error with stable code and optional structured details payload.
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  /**
   * @param message Human-readable error message.
   * @param code Stable machine-readable error code.
   * @param details Optional structured metadata for diagnostics.
   */
  protected constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
