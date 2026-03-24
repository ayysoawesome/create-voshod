/**
 * Logging abstraction used by application and presentation layers.
 */
export interface ILogger {
  /**
   * Emits an informational message.
   *
   * @param message Message to print.
   */
  info(message: string): void;
  /**
   * Emits a success-level message.
   *
   * @param message Message to print.
   */
  success(message: string): void;
  /**
   * Emits an error-level message.
   *
   * @param message Message to print.
   */
  error(message: string): void;
}
