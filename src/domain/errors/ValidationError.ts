import { DomainError } from './DomainError.js';

/**
 * Domain error variant for invalid input or option combinations.
 */
export class ValidationError extends DomainError {
  /**
   * @param message Human-readable validation message.
   * @param details Optional structured metadata.
   */
  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}
