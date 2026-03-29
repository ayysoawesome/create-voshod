import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveReactLayoutProfile,
  resolveVueLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";
import { writeAppStyleTree } from "./writeAppStyleTree.js";

/**
 * Applies plain global CSS under the profile styles directory (never touches router or entry).
 */
export class CssPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.options.value.styling === "css";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile =
      context.framework === "vue"
        ? resolveVueLayoutProfile(context.options.value.architecture)
        : resolveReactLayoutProfile(context.options.value.architecture);
    writeAppStyleTree(composer, profile, "css");
  }
}
