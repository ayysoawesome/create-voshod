import type { IViteConfigContribution, ViteContributionContext } from "./IViteConfigContribution.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

export class VueVitePluginContribution implements IViteConfigContribution {
  apply(editor: ViteConfigEditor, _ctx: ViteContributionContext): void {
    editor.ensureDefaultImport("@vitejs/plugin-vue", "vue");
    editor.ensurePluginCall("vue", "vue()");
  }
}
