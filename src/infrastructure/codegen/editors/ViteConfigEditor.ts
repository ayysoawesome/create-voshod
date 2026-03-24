import {
  type ObjectLiteralExpression,
  type PropertyAssignment,
  SyntaxKind,
  type SourceFile,
} from "ts-morph";
import { createEphemeralTsSourceFile } from "../workspace/ephemeralTsSourceFile.js";

export class ViteConfigShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ViteConfigShapeError";
  }
}

/**
 * Zonal editor for official Vite `react-ts`-style configs:
 * `export default defineConfig({ plugins: [...], resolve?: { alias?: { ... } } })`.
 */
export class ViteConfigEditor {
  private readonly file: SourceFile;

  constructor(source: string, virtualPath = "vite.config.ts") {
    this.file = createEphemeralTsSourceFile(virtualPath, source).file;
  }

  /**
   * @returns Serialized config source.
   */
  toString(): string {
    return this.file.getFullText();
  }

  /**
   * Ensures `import { defineConfig } from "vite"` exists.
   */
  ensureDefineConfigImport(): void {
    this.ensureNamedImportFrom("vite", "defineConfig");
  }

  /**
   * Ensures `import defaultImport from moduleSpecifier` when missing.
   */
  ensureDefaultImport(moduleSpecifier: string, importName: string): void {
    if (this.hasDefaultImportFrom(moduleSpecifier, importName)) {
      return;
    }
    this.file.addImportDeclaration({
      defaultImport: importName,
      moduleSpecifier,
    });
  }

  /**
   * Idempotently appends a plugin call inside `plugins: [ ... ]`.
   *
   * @param pluginCalleeIdentifier Identifier used in the call, e.g. `react` for `react()`.
   * @param callSnippet Full call expression source, e.g. `react()`.
   */
  ensurePluginCall(pluginCalleeIdentifier: string, callSnippet: string): void {
    const obj = this.getDefineConfigObjectLiteral();
    const plugins = this.getOrCreatePluginsArrayProperty(obj);
    const arr = this.asArrayLiteralOrThrow(plugins, "plugins");
    if (this.pluginsArrayHasCallTo(arr, pluginCalleeIdentifier)) {
      return;
    }
    arr.addElement(callSnippet);
  }

  /**
   * Ensures `resolve.alias` contains the given entries (idempotent by alias key).
   *
   * @param entries Map of alias key → initializer expression source (e.g. `path.resolve(__dirname, "src")`).
   */
  ensureResolveAliasEntries(entries: Readonly<Record<string, string>>): void {
    const obj = this.getDefineConfigObjectLiteral();
    const resolveProp = this.getOrCreateObjectProperty(obj, "resolve");
    const resolveObj = this.asObjectLiteralOrThrow(resolveProp, "resolve");
    const aliasProp = this.getOrCreateObjectProperty(resolveObj, "alias");
    const aliasObj = this.asObjectLiteralOrThrow(aliasProp, "alias");
    for (const [key, initializerText] of Object.entries(entries)) {
      if (this.objectHasShorthandOrProperty(aliasObj, key)) {
        continue;
      }
      aliasObj.addPropertyAssignment({ name: JSON.stringify(key), initializer: initializerText });
    }
  }

  private hasDefaultImportFrom(moduleSpecifier: string, importName: string): boolean {
    for (const decl of this.file.getImportDeclarations()) {
      if (decl.getModuleSpecifierValue() !== moduleSpecifier) {
        continue;
      }
      const defaultImport = decl.getDefaultImport();
      if (defaultImport?.getText() === importName) {
        return true;
      }
    }
    return false;
  }

  private ensureNamedImportFrom(
    moduleSpecifier: string,
    importName: string,
    alias?: string,
  ): void {
    for (const decl of this.file.getImportDeclarations()) {
      if (decl.getModuleSpecifierValue() !== moduleSpecifier) {
        continue;
      }
      const named = decl.getNamedImports();
      if (named.some((n) => n.getName() === importName)) {
        return;
      }
    }
    this.file.addImportDeclaration({
      moduleSpecifier,
      namedImports: [{ name: importName, alias }],
    });
  }

  private getDefineConfigObjectLiteral(): ObjectLiteralExpression {
    const exportAssign = this.file.getExportAssignments().at(0);
    if (!exportAssign) {
      throw new ViteConfigShapeError(
        "Expected `export default ...` in vite.config.ts (v1 supports export assignment only).",
      );
    }
    let expr = exportAssign.getExpression();
    if (expr.getKind() === SyntaxKind.CallExpression) {
      const call = expr.asKindOrThrow(SyntaxKind.CallExpression);
      if (call.getExpression().getText() !== "defineConfig") {
        throw new ViteConfigShapeError(
          "Expected `defineConfig({ ... })` as default export (factory/async configs are not supported in v1).",
        );
      }
      const arg = call.getArguments()[0];
      if (!arg || arg.getKind() !== SyntaxKind.ObjectLiteralExpression) {
        throw new ViteConfigShapeError("Expected `defineConfig` first argument to be an object literal.");
      }
      return arg as ObjectLiteralExpression;
    }
    if (expr.getKind() === SyntaxKind.ObjectLiteralExpression) {
      return expr as ObjectLiteralExpression;
    }
    throw new ViteConfigShapeError(
      "Unsupported default export shape: expected `defineConfig({ ... })` or object literal.",
    );
  }

  private getOrCreatePluginsArrayProperty(obj: ObjectLiteralExpression): PropertyAssignment {
    const existing = obj.getProperty("plugins");
    if (existing?.getKind() === SyntaxKind.PropertyAssignment) {
      return existing as PropertyAssignment;
    }
    return obj.addPropertyAssignment({
      name: "plugins",
      initializer: "[]",
    }) as PropertyAssignment;
  }

  private asArrayLiteralOrThrow(prop: PropertyAssignment, label: string) {
    const init = prop.getInitializer();
    if (!init || init.getKind() !== SyntaxKind.ArrayLiteralExpression) {
      throw new ViteConfigShapeError(`Expected \`${label}\` to be an array literal [...] (v1).`);
    }
    return init.asKindOrThrow(SyntaxKind.ArrayLiteralExpression);
  }

  private asObjectLiteralOrThrow(prop: PropertyAssignment, label: string) {
    const init = prop.getInitializer();
    if (!init || init.getKind() !== SyntaxKind.ObjectLiteralExpression) {
      throw new ViteConfigShapeError(`Expected \`${label}\` to be an object literal { ... } (v1).`);
    }
    return init as ObjectLiteralExpression;
  }

  private getOrCreateObjectProperty(obj: ObjectLiteralExpression, name: string): PropertyAssignment {
    const existing = obj.getProperty(name);
    if (existing?.getKind() === SyntaxKind.PropertyAssignment) {
      return existing as PropertyAssignment;
    }
    return obj.addPropertyAssignment({
      name,
      initializer: "{}",
    }) as PropertyAssignment;
  }

  private pluginsArrayHasCallTo(arr: import("ts-morph").ArrayLiteralExpression, callee: string): boolean {
    for (const el of arr.getElements()) {
      if (el.getKind() !== SyntaxKind.CallExpression) {
        continue;
      }
      const call = el.asKindOrThrow(SyntaxKind.CallExpression);
      if (call.getExpression().getText() === callee) {
        return true;
      }
    }
    return false;
  }

  private objectHasShorthandOrProperty(obj: ObjectLiteralExpression, key: string): boolean {
    for (const p of obj.getProperties()) {
      if (p.getKind() === SyntaxKind.PropertyAssignment) {
        const pa = p.asKindOrThrow(SyntaxKind.PropertyAssignment);
        const n = pa.getName();
        if (n.replace(/['"]/g, "") === key || n === key) {
          return true;
        }
      }
      if (p.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
        const sh = p.asKindOrThrow(SyntaxKind.ShorthandPropertyAssignment);
        if (sh.getName() === key) {
          return true;
        }
      }
    }
    return false;
  }
}
