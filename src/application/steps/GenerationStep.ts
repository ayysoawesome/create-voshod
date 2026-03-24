import { GenerationContext } from "@/domain/generation/index.js";

/**
 * Atomic asynchronous unit in generation pipeline.
 */
export interface GenerationStep {
  /**
   * Executes step side effects against provided context.
   *
   * @param context Runtime generation context.
   * @returns Promise resolved when step is done.
   */
  execute(context: GenerationContext): Promise<void>;
}

