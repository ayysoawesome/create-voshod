import type { IViteConfigContribution, VitePathProfile, ViteContributionContext } from "./IViteConfigContribution.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

function viteAliasEntriesForProfile(profile: VitePathProfile): Record<string, string> {
  const base: Record<string, string> = {
    "@": `path.resolve(__dirname, "src")`,
  };
  if (profile.architecture === "fsd") {
    return {
      ...base,
      "@icons": `path.resolve(__dirname, "src/shared/assets/icons")`,
      "@images": `path.resolve(__dirname, "src/shared/assets/images")`,
    };
  }
  return {
    ...base,
    "@icons": `path.resolve(__dirname, "src/assets/icons")`,
    "@images": `path.resolve(__dirname, "src/assets/images")`,
  };
}

export class SrcAliasContribution implements IViteConfigContribution {
  apply(editor: ViteConfigEditor, ctx: ViteContributionContext): void {
    editor.ensureDefaultImport("node:path", "path");
    editor.ensureResolveAliasEntries(viteAliasEntriesForProfile(ctx.profile));
  }
}
