import fs from "fs";
import path from "path";
import { IScaffoldFileReader } from "@/domain/ports/IScaffoldFileReader.js";

/**
 * Filesystem implementation for scaffold ingest (best-effort read).
 */
export class NodeScaffoldFileReader implements IScaffoldFileReader {
  tryReadUtf8(projectRoot: string, relativePath: string): string | null {
    const absolute = path.join(projectRoot, ...relativePath.split("/"));
    try {
      return fs.readFileSync(absolute, "utf8");
    } catch {
      return null;
    }
  }
}
