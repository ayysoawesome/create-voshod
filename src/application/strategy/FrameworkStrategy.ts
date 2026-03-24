import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "../steps/GenerationStep.js";

/**
 * Describes framework-specific pipeline construction.
 */
export interface FrameworkStrategy {
  /**
   * Checks whether strategy supports selected framework value.
   *
   * @param framework Framework identifier from options.
   * @returns True when strategy is applicable.
   */
  supports(framework: string): boolean;
  /**
   * Creates ordered generation steps for the framework.
   *
   * @param context Runtime generation context.
   * @returns Ordered steps to execute.
   */
  createSteps(context: GenerationContext): GenerationStep[];
}

