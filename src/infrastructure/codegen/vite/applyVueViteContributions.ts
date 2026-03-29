import type { ViteConfigEditor } from "../editors/ViteConfigEditor.js";
import { DefineConfigImportContribution } from "./contributions/DefineConfigImportContribution.js";
import { TailwindVitePluginContribution } from "./contributions/TailwindVitePluginContribution.js";
import { SrcAliasContribution } from "./contributions/SrcAliasContribution.js";
import { VueVitePluginContribution } from "./contributions/VueVitePluginContribution.js";
import type { ViteContributionContext } from "./contributions/IViteConfigContribution.js";

const ORDERED_VUE_CONTRIBUTIONS = [
  new DefineConfigImportContribution(),
  new VueVitePluginContribution(),
  new TailwindVitePluginContribution(),
  new SrcAliasContribution(),
] as const;

/**
 * Applies Vite contributions for Vue: defineConfig → plugin-vue → Tailwind → aliases.
 */
export function applyVueViteContributions(editor: ViteConfigEditor, ctx: ViteContributionContext): void {
  for (const c of ORDERED_VUE_CONTRIBUTIONS) {
    c.apply(editor, ctx);
  }
}
