import { GeneratedFileAsset } from './GeneratedFileAsset.js';

/**
 * Mutable runtime bucket for generated files and planned dependencies.
 */
export class GenerationRuntimeState {
  private readonly files = new Map<string, string>();
  private readonly prodDependencies = new Set<string>();
  private readonly devDependencies = new Set<string>();

  /**
   * Adds a new file or replaces content of an existing one.
   *
   * @param relativePath Relative path from project root.
   * @param content Full file content.
   */
  public addOrUpdateFile(relativePath: string, content: string): void {
    this.files.set(relativePath, content);
  }

  /**
   * Schedules production dependency installation.
   *
   * @param name Package name.
   */
  public addProdDependency(name: string): void {
    this.prodDependencies.add(name);
  }

  /**
   * Schedules development dependency installation.
   *
   * @param name Package name.
   */
  public addDevDependency(name: string): void {
    this.devDependencies.add(name);
  }

  /**
   * Returns generated files as serializable assets.
   *
   * @returns Array of generated file assets.
   */
  public getFiles(): GeneratedFileAsset[] {
    return Array.from(this.files.entries()).map(([relativePath, content]) => ({
      relativePath,
      content,
    }));
  }

  /**
   * Returns planned production dependencies.
   *
   * @returns Unique dependency names.
   */
  public getProdDependencies(): string[] {
    return Array.from(this.prodDependencies);
  }

  /**
   * Returns planned development dependencies.
   *
   * @returns Unique dependency names.
   */
  public getDevDependencies(): string[] {
    return Array.from(this.devDependencies);
  }
}
