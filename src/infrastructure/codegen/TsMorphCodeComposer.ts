import { Project } from "ts-morph";
import { ICodeComposer } from "@/domain/ports/index.js";
import { GeneratedFileAsset } from "@/domain/generation/index.js";

/**
 * In-memory code composer backed by ts-morph project.
 */
export class TsMorphCodeComposer implements ICodeComposer {
  private readonly project = new Project({ useInMemoryFileSystem: true });
  private readonly files = new Map<string, string>();

  /**
   * @param files Base generated files.
   */
  setBaseFiles(files: GeneratedFileAsset[]): void {
    this.files.clear();
    for (const file of files) {
      this.upsertFile(file.relativePath, file.content);
    }
  }

  /**
   * @param relativePath Relative file path from project root.
   * @param content Full file content.
   */
  upsertFile(relativePath: string, content: string): void {
    this.files.set(relativePath, content);
    this.project.createSourceFile(relativePath, content, { overwrite: true });
  }

  /**
   * @param relativePath Relative file path from project root.
   * @returns True when file is present.
   */
  hasFile(relativePath: string): boolean {
    return this.files.has(relativePath);
  }

  /**
   * @param relativePath Relative file path from project root.
   * @returns File content or null when absent.
   */
  getFile(relativePath: string): string | null {
    return this.files.get(relativePath) ?? null;
  }

  /**
   * @returns Snapshot of all composed file assets.
   */
  getAllFiles(): GeneratedFileAsset[] {
    return Array.from(this.files.entries()).map(([relativePath, content]) => ({
      relativePath,
      content,
    }));
  }
}

