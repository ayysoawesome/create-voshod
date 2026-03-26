import { ConsoleLoggerService } from '@/infrastructure/logger.js';
import { PromptService } from '../prompts/PromptService.js';
import { CliErrorPresenter } from './CliErrorPresenter.js';
import {
  FrameworkStrategyFactory,
  ReactFrameworkStrategy,
} from '@/application/strategy/index.js';
import { GenerateProjectUseCase } from '@/application/usecases/GenerateProjectUseCase.js';
import { GenerationContextFactory } from '@/application/factories/GenerationContextFactory.js';
import { BaseReactFilesFactory } from '@/application/react/base-files/index.js';
import { ReactDependencyPlanner } from '@/application/react/dependency-planning/index.js';
import {
  ToolchainPatchService,
  FormatterPatchService,
  SharedConfigPatchService,
  SharedApiPatchService,
  AppProvidersPatchService,
  ReactRouterDomPatchService,
  TanstackRouterPatchService,
  TailwindPatchService,
  CssPatchService,
} from '@/application/react/patches/index.js';
import {
  ViteProjectScaffolderService,
  PackageManagerInstallerService,
  PackageManagerDetectorService,
} from '@/infrastructure/process/index.js';
import { PackageManagerAdapterFactory } from '@/infrastructure/process/package-managers/index.js';
import {
  TsMorphCodeComposer,
} from '@/infrastructure/codegen/index.js';
import { FileSystemWriterService } from '@/infrastructure/filesystem/FileSystemWriterService.js';
import { NodeScaffoldFileReader } from '@/infrastructure/filesystem/NodeScaffoldFileReader.js';
import { readOwnPackageIdentity } from '@/infrastructure/runtimePackageInfo.js';
import { NpmRegistryUpdateCheckerService } from '@/infrastructure/updateChecker.js';

/**
 * Main CLI application entry that wires dependencies and runs generation flow.
 */
export class CliApplication {
  private readonly logger = new ConsoleLoggerService();
  private readonly promptService = new PromptService();
  private readonly errorPresenter = new CliErrorPresenter(this.logger);
  private readonly updateChecker = new NpmRegistryUpdateCheckerService();
  private readonly generationContextFactory = new GenerationContextFactory(
    new PackageManagerDetectorService(),
  );

  /**
   * Runs update notification, prompt flow, strategy composition, and generation use case.
   *
   * @returns Promise resolved when generation pipeline completes.
   */
  async run(): Promise<void> {
    this.logger.info('\nCreate SPA using Vite\n');
    this.notifyIfUpdateAvailable();

    try {
      const options = await this.promptService.askOptions();
      const generationContext = this.generationContextFactory.create(options);

      const adapterFactory = new PackageManagerAdapterFactory();
      const strategy = new ReactFrameworkStrategy(
        new ViteProjectScaffolderService(
          generationContext.packageManager,
          adapterFactory,
        ),
        new TsMorphCodeComposer(),
        new FileSystemWriterService(),
        new PackageManagerInstallerService(
          generationContext.packageManager,
          adapterFactory,
        ),
        new BaseReactFilesFactory(),
        [
          new ToolchainPatchService(),
          new FormatterPatchService(),
          new TailwindPatchService(),
          new CssPatchService(),
          new SharedConfigPatchService(),
          new SharedApiPatchService(),
          new AppProvidersPatchService(),
          new ReactRouterDomPatchService(),
          new TanstackRouterPatchService(),
        ],
        new ReactDependencyPlanner(),
        new NodeScaffoldFileReader(),
      );

      const strategyFactory = new FrameworkStrategyFactory([strategy]);
      const useCase = new GenerateProjectUseCase(strategyFactory, this.logger);
      await useCase.execute(generationContext);
    } catch (error) {
      this.errorPresenter.present(error);
    }
  }

  /**
   * Triggers non-blocking package update check and prints notification when newer version exists.
   */
  private notifyIfUpdateAvailable(): void {
    const { name: packageName, version: currentVersion } = readOwnPackageIdentity();

    void this.updateChecker
      .check(packageName, currentVersion)
      .then((updateInfo) => {
        if (
          updateInfo.latestVersion !== null &&
          updateInfo.latestVersion !== updateInfo.currentVersion
        ) {
          this.logger.info(
            `Update available: ${updateInfo.currentVersion} -> ${updateInfo.latestVersion}. Run ${packageName}@latest.`,
          );
        }
      })
      .catch(() => {
        // Update check must never break the generation flow.
      });
  }
}
