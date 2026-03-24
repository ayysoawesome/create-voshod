import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";
import {
  IndexHtmlScriptWriter,
  TsConfigAppPathsBuilder,
} from "@/infrastructure/codegen/index.js";
import { mergeTsConfigAppPaths } from "@/infrastructure/codegen/editors/TsConfigAppPathsMerger.js";
import { minimalViteConfigFallback } from "@/infrastructure/codegen/editors/ViteScaffoldFallback.js";
import { ViteConfigEditor } from "@/infrastructure/codegen/editors/ViteConfigEditor.js";
import { applyViteContributions } from "@/infrastructure/codegen/vite/applyViteContributions.js";

const defaultIndexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>app</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

/**
 * Applies toolchain files: Vite alias, tsconfig paths, and HTML entry.
 * Uses zonal editors (ts-morph / JSON merge) instead of full-file replacement where possible.
 */
export class ToolchainPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const tailwind = context.options.value.styling === "tailwind";

    const rawVite = composer.getFile("vite.config.ts") ?? minimalViteConfigFallback();
    const viteEditor = new ViteConfigEditor(rawVite);
    applyViteContributions(viteEditor, { tailwind, profile });
    composer.upsertFile("vite.config.ts", viteEditor.toString());

    const rawTsConfig = composer.getFile("tsconfig.app.json") ?? TsConfigAppPathsBuilder.build();
    composer.upsertFile("tsconfig.app.json", mergeTsConfigAppPaths(rawTsConfig, profile));

    const rawHtml = composer.getFile("index.html") ?? defaultIndexHtml;
    const titled = rawHtml.replace(/<title>[^<]*<\/title>/, `<title>${context.options.value.projectName}</title>`);
    const withoutViteIcon = IndexHtmlScriptWriter.stripDefaultViteFaviconLink(titled);
    composer.upsertFile(
      "index.html",
      IndexHtmlScriptWriter.setModuleScriptSrc(withoutViteIcon, profile.htmlScriptSrc),
    );
  }
}
