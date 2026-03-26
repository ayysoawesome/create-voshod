import path from "path";
import { ValidationError } from "@/domain/errors/index.js";
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
    const projectName = options.projectName.trim();
    if (projectName.length === 0) {
      throw new ValidationError("Project name is required.");
    }

    return new GenerationContext({
      options: {
        ...options,
        projectName,
      },
      projectPath: path.resolve(projectName),
      packageManager: this.packageManagerDetector.detect(),
      framework: options.framework,
    });
  }
}

