import { GenerationContext } from "@/domain/generation/index.js";
import { IFileWriter } from "@/domain/ports/index.js";
import { GenerationStep } from "./GenerationStep.js";

/**
 * Pipeline step that persists generated files to disk.
 */
export class WriteFilesStep implements GenerationStep {
  /**
   * @param fileWriter Filesystem writer implementation.
   */
  constructor(private readonly fileWriter: IFileWriter) {}

  /**
   * @param context Runtime generation context.
   * @returns Promise resolved after files are written.
   */
  async execute(context: GenerationContext): Promise<void> {
    await this.fileWriter.writeAll(context.projectPath, context.runtime.getFiles());
  }
}

