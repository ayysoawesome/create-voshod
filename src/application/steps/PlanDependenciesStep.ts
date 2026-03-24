import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "./GenerationStep.js";

/**
 * Pipeline step that computes dependency lists from selected options.
 */
export class PlanDependenciesStep implements GenerationStep {
  /**
   * @param planner Planner object with synchronous `plan` method.
   */
  constructor(private readonly planner: { plan(context: GenerationContext): void }) {}

  /**
   * @param context Runtime generation context.
   * @returns Promise resolved after dependency planning.
   */
  async execute(context: GenerationContext): Promise<void> {
    this.planner.plan(context);
  }
}

