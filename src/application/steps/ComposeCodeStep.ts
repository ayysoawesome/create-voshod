import { GenerationContext, GeneratedFileAsset } from "@/domain/generation/index.js";
import { ICodeComposer, IScaffoldFileReader } from "@/domain/ports/index.js";
import { GenerationStep } from "./GenerationStep.js";
import { IReactPatchService } from "../patches/IReactPatchService.js";
import { SCAFFOLD_INGEST_RELATIVE_PATHS } from "../react/codegen/scaffoldIngestPaths.js";

/**
 * Builds in-memory file set from base assets and conditional patches.
 */
export class ComposeCodeStep implements GenerationStep {
  /**
   * @param codeComposer In-memory code composer implementation.
   * @param baseFilesFactory Factory that produces base files.
   * @param patchServices Conditional patch services.
   * @param scaffoldFileReader Optional reader to ingest on-disk scaffold files before patches.
   */
  constructor(
    private readonly codeComposer: ICodeComposer,
    private readonly baseFilesFactory: (context: GenerationContext) => GeneratedFileAsset[],
    private readonly patchServices: IReactPatchService[],
    private readonly scaffoldFileReader: IScaffoldFileReader | null = null,
  ) {}

  /**
   * Applies base files and all eligible patches, then stores resulting files in runtime state.
   *
   * @param context Runtime generation context.
   * @returns Promise resolved after composition is complete.
   */
  async execute(context: GenerationContext): Promise<void> {
    const baseFiles = this.baseFilesFactory(context);
    this.codeComposer.setBaseFiles(baseFiles);

    if (this.scaffoldFileReader !== null) {
      for (const relativePath of SCAFFOLD_INGEST_RELATIVE_PATHS) {
        const disk = this.scaffoldFileReader.tryReadUtf8(context.projectPath, relativePath);
        if (disk !== null) {
          this.codeComposer.upsertFile(relativePath, disk);
        }
      }
    }

    for (const patch of this.patchServices) {
      if (!patch.supports(context)) {
        continue;
      }

      await patch.apply(context, this.codeComposer);
    }

    for (const file of this.codeComposer.getAllFiles()) {
      context.runtime.addOrUpdateFile(file.relativePath, file.content);
    }
  }
}

