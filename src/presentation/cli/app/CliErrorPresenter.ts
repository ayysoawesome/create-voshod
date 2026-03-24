import { ILogger } from "@/domain/ports/index.js";

/**
 * Converts unknown runtime errors into user-facing CLI output and rethrows.
 */
export class CliErrorPresenter {
  /**
   * @param logger Logger used for CLI output.
   */
  constructor(private readonly logger: ILogger) {}

  /**
   * Presents error message and rethrows to preserve process failure behavior.
   *
   * @param error Unknown thrown value.
   * @returns Never returns; always throws.
   * @throws {Error} Original error or synthesized unknown error.
   */
  present(error: unknown): never {
    if (error instanceof Error) {
      this.logger.error(`\n✖ ${error.message}\n`);
      throw error;
    }

    this.logger.error('\n✖ Unknown error\n');
    throw new Error('Unknown error');
  }
}

