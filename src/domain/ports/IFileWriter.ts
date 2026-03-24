import { GeneratedFileAsset } from '../generation/GeneratedFileAsset.js';

/**
 * Persists generated file assets to a target project directory.
 */
export interface IFileWriter {
  /**
   * Writes all provided file assets under project path.
   *
   * @param projectPath Absolute path to generated project root.
   * @param files File assets to persist.
   * @returns Promise resolved after all files are written.
   */
  writeAll(projectPath: string, files: GeneratedFileAsset[]): Promise<void>;
}
