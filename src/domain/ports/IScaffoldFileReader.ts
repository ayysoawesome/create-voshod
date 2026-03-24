/**
 * Reads scaffolded files from disk after `IProjectScaffolder` runs (compose-time ingest).
 */
export interface IScaffoldFileReader {
  /**
   * Reads a UTF-8 file under the project root when it exists.
   *
   * @param projectRoot Absolute path to generated project directory.
   * @param relativePath Path relative to project root (POSIX-style separators).
   * @returns File text or null when missing/unreadable.
   */
  tryReadUtf8(projectRoot: string, relativePath: string): string | null;
}
