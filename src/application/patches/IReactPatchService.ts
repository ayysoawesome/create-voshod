import { GenerationContext } from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

/**
 * Contract for conditional React-specific code mutations during composition.
 */
export interface IReactPatchService {
  /**
   * Checks whether this patch should be applied for current options.
   *
   * @param context Runtime generation context.
   * @returns True when patch should run.
   */
  supports(context: GenerationContext): boolean;
  /**
   * Applies code/file changes using composer abstraction.
   *
   * @param context Runtime generation context.
   * @param composer In-memory code composer.
   * @returns Promise resolved after patch finishes.
   */
  apply(context: GenerationContext, composer: ICodeComposer): Promise<void>;
}

