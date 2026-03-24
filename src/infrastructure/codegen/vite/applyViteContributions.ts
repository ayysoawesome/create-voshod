import type { ViteConfigEditor } from "../editors/ViteConfigEditor.js";
import { DefineConfigImportContribution } from "./contributions/DefineConfigImportContribution.js";
import { ReactVitePluginContribution } from "./contributions/ReactVitePluginContribution.js";
import { TailwindVitePluginContribution } from "./contributions/TailwindVitePluginContribution.js";
import { SrcAliasContribution } from "./contributions/SrcAliasContribution.js";
import type { ViteContributionContext } from "./contributions/IViteConfigContribution.js";

const ORDERED_CONTRIBUTIONS = [
  new DefineConfigImportContribution(),
  new ReactVitePluginContribution(),
  new TailwindVitePluginContribution(),
  new SrcAliasContribution(),
] as const;

/**
 * Applies Vite toolchain contributions in a stable order: defineConfig import → React → Tailwind → aliases.
 */
export function applyViteContributions(editor: ViteConfigEditor, ctx: ViteContributionContext): void {
  for (const c of ORDERED_CONTRIBUTIONS) {
    c.apply(editor, ctx);
  }
}
