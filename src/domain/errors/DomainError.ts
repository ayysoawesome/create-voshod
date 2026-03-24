import { BaseError } from './BaseError.js';

/**
 * Generic domain-layer error with `DOMAIN_ERROR` code.
 */
export class DomainError extends BaseError {
  /**
   * @param message Human-readable error message.
   * @param details Optional structured metadata.
   */
  constructor(message: string, details?: unknown) {
    super(message, 'DOMAIN_ERROR', details);
  }
}
