import type { Architecture } from "@/domain/generation/ProjectOptions.js";
import type { ViteConfigEditor } from "../../editors/ViteConfigEditor.js";

/** Minimal layout slice needed for Vite alias paths (React and Vue share FSD/simple rules). */
export type VitePathProfile = {
  readonly architecture: Architecture;
};

export type ViteContributionContext = {
  readonly tailwind: boolean;
  readonly profile: VitePathProfile;
};

/**
 * Single-responsibility Vite config mutation (plugins, imports, alias, …).
 */
export interface IViteConfigContribution {
  apply(editor: ViteConfigEditor, ctx: ViteContributionContext): void;
}
