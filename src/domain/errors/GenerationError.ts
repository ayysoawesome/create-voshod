import { DomainError } from './DomainError.js';

/**
 * Domain error variant for generation-specific failures.
 */
export class GenerationError extends DomainError {
  /**
   * @param message Human-readable generation error message.
   * @param details Optional structured metadata.
   */
  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}
