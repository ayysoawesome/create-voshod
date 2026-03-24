import { CLIOptions } from "./ProjectOptions.js";

/**
 * Immutable wrapper over user-selected CLI options.
 */
export class GenerationOptions {
  public readonly value: Readonly<CLIOptions>;

  /**
   * Creates frozen options payload to prevent accidental runtime mutations.
   *
   * @param options Raw options from prompt flow.
   */
  constructor(options: CLIOptions) {
    this.value = Object.freeze({ ...options });
  }
}

