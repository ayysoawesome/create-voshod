import { GenerationContext } from "@/domain/generation/index.js";
import { ILogger } from "@/domain/ports/index.js";
import { FrameworkStrategyFactory } from "../strategy/FrameworkStrategyFactory.js";

/**
 * Executes full project generation lifecycle for selected framework.
 */
export class GenerateProjectUseCase {
  /**
   * @param strategyFactory Framework strategy resolver.
   * @param logger Logger used for final user feedback.
   */
  constructor(
    private readonly strategyFactory: FrameworkStrategyFactory,
    private readonly logger: ILogger,
  ) {}

  /**
   * Runs strategy steps sequentially.
   *
   * @param context Runtime generation context.
   * @returns Promise resolved when generation completes.
   */
  async execute(context: GenerationContext): Promise<void> {
    const strategy = this.strategyFactory.create(context);
    const steps = strategy.createSteps(context);

    for (const step of steps) {
      await step.execute(context);
    }

    this.logger.success("\n✔ Project created successfully!\n");
  }
}

