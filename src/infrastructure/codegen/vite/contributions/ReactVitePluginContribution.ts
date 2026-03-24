import type { IViteConfigContribution, ViteContributionContext } from "./IViteConfigContribution.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

export class ReactVitePluginContribution implements IViteConfigContribution {
  apply(editor: ViteConfigEditor, _ctx: ViteContributionContext): void {
    editor.ensureDefaultImport("@vitejs/plugin-react", "react");
    editor.ensurePluginCall("react", "react()");
  }
}
