import path from "path";
import { CLIOptions, Framework } from "./ProjectOptions.js";
import { GenerationOptions } from "./GenerationOptions.js";
import { GenerationRuntimeState } from "./GenerationRuntimeState.js";
import { PackageManager } from "@/domain/ports/index.js";

/**
 * Seed data required to build generation context.
 */
export interface GenerationContextSeed {
  /** Frozen-compatible options from the prompt layer. */
  options: CLIOptions;
  /** Absolute project root override; defaults to resolving `projectName`. */
  projectPath?: string;
  /** Package manager used for scaffold and install commands. */
  packageManager: PackageManager;
  /** Framework value echoed from options for quick access. */
  framework: Framework;
}

/**
 * Aggregate runtime context passed through the generation pipeline.
 */
export class GenerationContext {
  /** Immutable user-selected options. */
  public readonly options: GenerationOptions;
  /** Mutable working set of files and dependency names. */
  public readonly runtime: GenerationRuntimeState;
  /** Absolute path to the generated project directory. */
  public readonly projectPath: string;
  /** Package manager detected or injected for child processes. */
  public readonly packageManager: PackageManager;
  /** Framework identifier from options. */
  public readonly framework: Framework;

  /**
   * Builds context with immutable options and mutable runtime state.
   *
   * @param seed Input seed from CLI and environment detection.
   */
  constructor(seed: GenerationContextSeed) {
    this.options = new GenerationOptions(seed.options);
    this.runtime = new GenerationRuntimeState();
    this.projectPath = seed.projectPath ?? path.resolve(seed.options.projectName);
    this.packageManager = seed.packageManager;
    this.framework = seed.framework;
  }
}

