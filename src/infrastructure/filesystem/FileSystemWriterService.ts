import fs from "fs-extra";
import path from "path";
import { IFileWriter } from "@/domain/ports/index.js";
import { GeneratedFileAsset } from "@/domain/generation/index.js";
import { PrettierFormatterService } from "@/infrastructure/codegen/index.js";

/**
 * Writes generated files to filesystem and formats content before persistence.
 */
export class FileSystemWriterService implements IFileWriter {
  /**
   * @param formatter Formatter used before write.
   */
  constructor(private readonly formatter: PrettierFormatterService) {}

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
      const formatted = await this.formatter.format(file.relativePath, file.content);
      await fs.writeFile(absolutePath, formatted, "utf8");
    }
  }
}

