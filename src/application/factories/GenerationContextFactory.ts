import path from "path";
import { ValidationError } from "@/domain/errors/index.js";
import {
  isAsyncStateValidForFramework,
  isClientStateValidForFramework,
  isRouterValidForFramework,
  resolveAdditionalLibNpm,
} from "@/domain/generation/frameworkCapabilityCatalog.js";
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

    if (!isRouterValidForFramework(options.router, options.framework)) {
      throw new ValidationError(
        `Router selection is invalid for framework "${options.framework}".`,
      );
    }

    if (!isClientStateValidForFramework(options.clientState, options.framework)) {
      throw new ValidationError(
        `Client state selection is invalid for framework "${options.framework}".`,
      );
    }

    if (!isAsyncStateValidForFramework(options.asyncState, options.framework)) {
      throw new ValidationError(
        `Async state selection is invalid for framework "${options.framework}".`,
      );
    }

    for (const lib of options.libs) {
      if (resolveAdditionalLibNpm(lib, options.framework) === null) {
        throw new ValidationError(
          `Library "${lib}" is not available for framework "${options.framework}".`,
        );
      }
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
