import { SyntaxKind, type SourceFile } from "ts-morph";
import { createEphemeralTsSourceFile } from "../workspace/ephemeralTsSourceFile.js";

export class AppRouterMorphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppRouterMorphError";
  }
}

function findAppProvidersRootJsx(sourceFile: SourceFile) {
  const appDecl = sourceFile.getVariableDeclaration("App");
  if (!appDecl) {
    throw new AppRouterMorphError("Expected `App` variable declaration.");
  }
  const init = appDecl.getInitializer();
  if (!init || init.getKind() !== SyntaxKind.ArrowFunction) {
    throw new AppRouterMorphError("Expected `App` to be an arrow function.");
  }
  const fn = init.asKindOrThrow(SyntaxKind.ArrowFunction);
  const body = fn.getBody();
  if (!body) {
    throw new AppRouterMorphError("Expected `App` arrow function body.");
  }
  let expr = body;
  if (body.getKind() === SyntaxKind.ParenthesizedExpression) {
    const inner = body.asKindOrThrow(SyntaxKind.ParenthesizedExpression).getExpression();
    expr = inner;
  }
  if (expr.getKind() !== SyntaxKind.JsxElement) {
    throw new AppRouterMorphError("Expected JSX root inside `App`.");
  }
  const root = expr.asKindOrThrow(SyntaxKind.JsxElement);
  const opening = root.getOpeningElement();
  if (opening.getTagNameNode().getText() !== "AppProviders") {
    throw new AppRouterMorphError("Expected root JSX to be `<AppProviders>`.");
  }
  return root;
}

function ensureNamedImports(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  names: readonly string[],
): void {
  let decl = sourceFile
    .getImportDeclarations()
    .find((d) => d.getModuleSpecifierValue() === moduleSpecifier);
  if (!decl) {
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: names.map((name) => ({ name })),
    });
    return;
  }
  const existing = new Set(decl.getNamedImports().map((n) => n.getName()));
  for (const name of names) {
    if (!existing.has(name)) {
      decl.addNamedImport(name);
    }
  }
}

function replaceAppProvidersChildren(sourceFile: SourceFile, innerJsx: string): void {
  const root = findAppProvidersRootJsx(sourceFile);
  const children = root.getJsxChildren();
  const trimmedInner = innerJsx.trim();
  if (children.length === 0) {
    sourceFile.insertText(root.getOpeningElement().getEnd(), `\n    ${trimmedInner}\n  `);
    return;
  }
  const start = children[0].getStart();
  const end = children[children.length - 1].getEnd();
  sourceFile.replaceText([start, end], `\n    ${trimmedInner}\n  `);
}

/**
 * Replaces only the children of `<AppProviders>` and ensures TanStack Router imports.
 */
export function morphAppForTanstackRouter(appSource: string, virtualPath: string): string {
  const { file } = createEphemeralTsSourceFile(virtualPath, appSource);
  ensureNamedImports(file, "@tanstack/react-router", ["RouterProvider"]);
  ensureNamedImports(file, "./router", ["router"]);
  replaceAppProvidersChildren(
    file,
    `<RouterProvider router={router} />`,
  );
  return file.getFullText();
}

/**
 * Replaces only the children of `<AppProviders>` and ensures react-router-dom imports.
 */
export function morphAppForReactRouterDom(
  appSource: string,
  virtualPath: string,
  homeModule: string,
): string {
  const { file } = createEphemeralTsSourceFile(virtualPath, appSource);
  ensureNamedImports(file, "react-router-dom", [
    "BrowserRouter",
    "Routes",
    "Route",
    "Navigate",
  ]);
  ensureNamedImports(file, homeModule, ["HomePage"]);
  replaceAppProvidersChildren(
    file,
    `<BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>`,
  );
  return file.getFullText();
}
