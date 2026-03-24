import type { IViteConfigContribution, ViteContributionContext } from "./IViteConfigContribution.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

export class TailwindVitePluginContribution implements IViteConfigContribution {
  apply(editor: ViteConfigEditor, ctx: ViteContributionContext): void {
    if (!ctx.tailwind) {
      return;
    }
    editor.ensureDefaultImport("@tailwindcss/vite", "tailwindcss");
    editor.ensurePluginCall("tailwindcss", "tailwindcss()");
  }
}
