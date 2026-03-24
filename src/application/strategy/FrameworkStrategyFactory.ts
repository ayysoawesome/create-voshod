import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationError } from "@/domain/errors/index.js";
import { FrameworkStrategy } from "./FrameworkStrategy.js";

/**
 * Resolves a matching framework strategy for provided generation context.
 */
export class FrameworkStrategyFactory {
  /**
   * @param strategies Available strategy instances.
   */
  constructor(private readonly strategies: FrameworkStrategy[]) {}

  /**
   * Finds a strategy that supports selected framework.
   *
   * @param context Runtime generation context.
   * @returns Matching framework strategy.
   * @throws {GenerationError} When no strategy supports selected framework.
   */
  public create(context: GenerationContext): FrameworkStrategy {
    const strategy = this.strategies.find((s) =>
      s.supports(context.options.value.framework),
    );

    if (!strategy) {
      throw new GenerationError(
        `No framework strategy for ${context.options.value.framework}`,
      );
    }

    return strategy;
  }
}

