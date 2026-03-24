import { GenerationContext } from '../generation/GenerationContext.js';

/**
 * Creates a base project structure before code composition and patching.
 */
export interface IProjectScaffolder {
  /**
   * Scaffolds the initial project based on generation context.
   *
   * @param context Runtime generation context.
   * @returns Promise resolved after scaffold step is complete.
   */
  scaffold(context: GenerationContext): Promise<void>;
}
