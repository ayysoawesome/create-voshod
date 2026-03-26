import { FrameworkStrategy } from "./FrameworkStrategy.js";
import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "../steps/GenerationStep.js";
import { ScaffoldBaseProjectStep } from "../steps/ScaffoldBaseProjectStep.js";
import { ComposeCodeStep } from "../steps/ComposeCodeStep.js";
import { WriteFilesStep } from "../steps/WriteFilesStep.js";
import { PruneViteReactTsScaffoldStep } from "../steps/PruneViteReactTsScaffoldStep.js";
import { InstallDependenciesStep } from "../steps/InstallDependenciesStep.js";
import { PlanDependenciesStep } from "../steps/PlanDependenciesStep.js";
import { FormatGeneratedProjectStep } from "../steps/FormatGeneratedProjectStep.js";
import {
  IProjectScaffolder,
  ICodeComposer,
  IFileWriter,
  IPackageInstaller,
  IScaffoldFileReader,
} from "@/domain/ports/index.js";
import { BaseReactFilesFactory } from "../react/base-files/index.js";
import { IReactPatchService } from "../patches/IReactPatchService.js";
import { ReactDependencyPlanner } from "../react/dependency-planning/index.js";

/**
 * React implementation of framework strategy.
 *
 * The step order is intentional:
 * 1) scaffold base project,
 * 2) compose files and apply patches (ingests scaffolded vite/tsconfig/index.html from disk first),
 * 3) plan dependencies,
 * 4) write files,
 * 5) prune unused `create-vite` react-ts paths on disk,
 * 6) install dependencies,
 * 7) run formatter in generated project.
 */
export class ReactFrameworkStrategy implements FrameworkStrategy {
  /**
   * @param projectScaffolder Base project scaffolder.
   * @param codeComposer In-memory code composer.
   * @param fileWriter Filesystem writer.
   * @param packageInstaller Dependency installer.
   * @param baseFilesFactory Base React files factory.
   * @param patchServices Conditional patch services.
   * @param dependencyPlanner Dependency planner.
   * @param scaffoldFileReader Reads scaffolded files from disk into the composer before patches.
   */
  constructor(
    private readonly projectScaffolder: IProjectScaffolder,
    private readonly codeComposer: ICodeComposer,
    private readonly fileWriter: IFileWriter,
    private readonly packageInstaller: IPackageInstaller,
    private readonly baseFilesFactory: BaseReactFilesFactory,
    private readonly patchServices: IReactPatchService[],
    private readonly dependencyPlanner: ReactDependencyPlanner,
    private readonly scaffoldFileReader: IScaffoldFileReader,
  ) {}

  /**
   * @param framework Framework identifier from options.
   * @returns True only for `react`.
   */
  supports(framework: string): boolean {
    return framework === "react";
  }

  /**
   * Builds ordered React generation pipeline.
   *
   * @param _context Runtime generation context (reserved for future use).
   * @returns Ordered generation steps.
   */
  createSteps(_context: GenerationContext): GenerationStep[] {
    return [
      new ScaffoldBaseProjectStep(this.projectScaffolder),
      new ComposeCodeStep(
        this.codeComposer,
        (ctx) => this.baseFilesFactory.create(ctx),
        this.patchServices,
        this.scaffoldFileReader,
      ),
      new PlanDependenciesStep(this.dependencyPlanner),
      new WriteFilesStep(this.fileWriter),
      new PruneViteReactTsScaffoldStep(),
      new InstallDependenciesStep(this.packageInstaller),
      new FormatGeneratedProjectStep(),
    ];
  }
}

