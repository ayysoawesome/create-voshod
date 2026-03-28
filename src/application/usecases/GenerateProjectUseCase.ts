import { GenerationContext } from "@/domain/generation/index.js";
import { ILogger } from "@/domain/ports/index.js";
import { FrameworkStrategyFactory } from "../strategy/FrameworkStrategyFactory.js";

const REPOSITORY_URL = "https://github.com/ayysoawesome/create-voshod";

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
    this.logger.info(
      `create-voshod is open source (MIT). If it saved you time, we'd appreciate a star on GitHub — it helps others discover the tool:\n${REPOSITORY_URL}\n`,
    );
  }
}

