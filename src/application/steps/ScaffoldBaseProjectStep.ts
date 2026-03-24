import { GenerationContext } from "@/domain/generation/index.js";
import { IProjectScaffolder } from "@/domain/ports/index.js";
import { GenerationStep } from "./GenerationStep.js";

/**
 * Pipeline step that scaffolds an initial project skeleton.
 */
export class ScaffoldBaseProjectStep implements GenerationStep {
  /**
   * @param projectScaffolder Base project scaffolder.
   */
  constructor(private readonly projectScaffolder: IProjectScaffolder) {}

  /**
   * @param context Runtime generation context.
   * @returns Promise resolved after scaffold finishes.
   */
  async execute(context: GenerationContext): Promise<void> {
    await this.projectScaffolder.scaffold(context);
  }
}

