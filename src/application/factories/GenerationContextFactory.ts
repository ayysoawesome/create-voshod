import path from "path";
import { CLIOptions, GenerationContext } from "@/domain/generation/index.js";
import { PackageManagerDetectorService } from "@/infrastructure/process/index.js";

/**
 * Factory that creates generation context from CLI options and environment data.
 */
export class GenerationContextFactory {
  /**
   * @param packageManagerDetector Environment-based package manager detector.
   */
  constructor(
    private readonly packageManagerDetector: PackageManagerDetectorService,
  ) {}

  /**
   * @param options Raw CLI options from prompt flow.
   * @returns Fully initialized generation context.
   */
  create(options: CLIOptions): GenerationContext {
    return new GenerationContext({
      options,
      projectPath: path.resolve(options.projectName),
      packageManager: this.packageManagerDetector.detect(),
      framework: options.framework,
    });
  }
}

