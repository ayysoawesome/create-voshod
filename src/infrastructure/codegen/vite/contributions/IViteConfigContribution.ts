import type { ReactLayoutProfile } from "@/domain/generation/ReactLayoutProfile.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

export type ViteContributionContext = {
  readonly tailwind: boolean;
  readonly profile: ReactLayoutProfile;
};

/**
 * Single-responsibility Vite config mutation (plugins, imports, alias, …).
 */
export interface IViteConfigContribution {
  apply(editor: ViteConfigEditor, ctx: ViteContributionContext): void;
}
