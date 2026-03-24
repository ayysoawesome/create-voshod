import type { IViteConfigContribution, ViteContributionContext } from "./IViteConfigContribution.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

export class DefineConfigImportContribution implements IViteConfigContribution {
  apply(editor: ViteConfigEditor, _ctx: ViteContributionContext): void {
    editor.ensureDefineConfigImport();
  }
}
