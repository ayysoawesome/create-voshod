import { Project, type SourceFile } from "ts-morph";

/**
 * Opens a single TS/TSX snapshot in an isolated ts-morph project (no shared composer project).
 * Call `file.getFullText()` after edits to flush back into `ICodeComposer.upsertFile`.
 */
export function createEphemeralTsSourceFile(
  virtualPath: string,
  content: string,
): { readonly project: Project; readonly file: SourceFile } {
  const project = new Project({ useInMemoryFileSystem: true });
  const file = project.createSourceFile(virtualPath, content, { overwrite: true });
  return { project, file };
}
