import { GeneratedFileAsset } from '../generation/GeneratedFileAsset.js';

/**
 * Defines code-composition operations over in-memory generated assets.
 */
export interface ICodeComposer {
  /**
   * Replaces current file set with provided base assets.
   *
   * @param files Base files used as the initial composition state.
   */
  setBaseFiles(files: GeneratedFileAsset[]): void;
  /**
   * Inserts a new file or replaces existing file content by relative path.
   *
   * @param relativePath Relative file path from project root.
   * @param content Full file content.
   */
  upsertFile(relativePath: string, content: string): void;
  /**
   * Checks whether a file exists in current in-memory state.
   *
   * @param relativePath Relative file path from project root.
   * @returns True when file is present.
   */
  hasFile(relativePath: string): boolean;
  /**
   * Reads file content from current in-memory state.
   *
   * @param relativePath Relative file path from project root.
   * @returns File content or null if absent.
   */
  getFile(relativePath: string): string | null;
  /**
   * Returns all accumulated file assets.
   *
   * @returns Snapshot of composed files.
   */
  getAllFiles(): GeneratedFileAsset[];
}
