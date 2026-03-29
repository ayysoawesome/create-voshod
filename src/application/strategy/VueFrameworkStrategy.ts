import { FrameworkStrategy } from "./FrameworkStrategy.js";
import { GenerationContext } from "@/domain/generation/index.js";
import { GenerationStep } from "../steps/GenerationStep.js";
import { ScaffoldBaseProjectStep } from "../steps/ScaffoldBaseProjectStep.js";
import { ComposeCodeStep } from "../steps/ComposeCodeStep.js";
import { WriteFilesStep } from "../steps/WriteFilesStep.js";
import { PruneViteVueTsScaffoldStep } from "../steps/PruneViteVueTsScaffoldStep.js";
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
import { BaseVueFilesFactory } from "../vue/base-files/index.js";
import { IReactPatchService } from "../patches/IReactPatchService.js";
import { ReactDependencyPlanner } from "../react/dependency-planning/index.js";

/**
 * Vue + Vite generation pipeline (mirrors {@link ReactFrameworkStrategy} step order).
 */
export class VueFrameworkStrategy implements FrameworkStrategy {
  constructor(
    private readonly projectScaffolder: IProjectScaffolder,
    private readonly codeComposer: ICodeComposer,
    private readonly fileWriter: IFileWriter,
    private readonly packageInstaller: IPackageInstaller,
    private readonly baseFilesFactory: BaseVueFilesFactory,
    private readonly patchServices: IReactPatchService[],
    private readonly dependencyPlanner: ReactDependencyPlanner,
    private readonly scaffoldFileReader: IScaffoldFileReader,
  ) {}

  supports(framework: string): boolean {
    return framework === "vue";
  }

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
      new PruneViteVueTsScaffoldStep(),
      new InstallDependenciesStep(this.packageInstaller),
      new FormatGeneratedProjectStep(),
    ];
  }
}
