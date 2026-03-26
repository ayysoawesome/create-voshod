import fs from "fs-extra";
import path from "path";
import { IFileWriter } from "@/domain/ports/index.js";
import { GeneratedFileAsset } from "@/domain/generation/index.js";

/**
 * Writes generated files to filesystem as-is.
 */
export class FileSystemWriterService implements IFileWriter {
  /**
   * Ensures directory exists and writes each file as UTF-8.
   *
   * @param projectPath Absolute project path.
   * @param files File assets to persist.
   * @returns Promise resolved after all files are written.
   */
  async writeAll(projectPath: string, files: GeneratedFileAsset[]): Promise<void> {
    for (const file of files) {
      const absolutePath = path.join(projectPath, file.relativePath);
      await fs.ensureDir(path.dirname(absolutePath));
      await fs.writeFile(absolutePath, file.content, "utf8");
    }
  }
}

