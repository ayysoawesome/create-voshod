import prettier from "prettier";
import path from "path";

/**
 * Applies Prettier formatting using parser inferred from file extension.
 */
export class PrettierFormatterService {
  private readonly parsers: Record<string, prettier.BuiltInParserName> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "babel",
    ".jsx": "babel",
    ".json": "json",
    ".css": "css",
  };

  /**
   * Formats content when parser is known; returns original content on unknown parser or formatting error.
   *
   * @param relativePath Relative file path used for parser selection.
   * @param content Raw file content.
   * @returns Formatted or original content.
   */
  async format(relativePath: string, content: string): Promise<string> {
    const parser = this.parsers[path.extname(relativePath)];

    if (!parser) {
      return content;
    }

    try {
      return await prettier.format(content, { parser });
    } catch {
      return content;
    }
  }
}

