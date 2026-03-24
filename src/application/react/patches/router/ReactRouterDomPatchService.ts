import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  pagesHomeImport,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";
import { morphAppForReactRouterDom } from "@/infrastructure/codegen/editors/AppRouterZoneMorph.js";

/**
 * React Router DOM shell. Does not touch entry or styles.
 */
export class ReactRouterDomPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.options.value.router === "react-router-dom";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const home = pagesHomeImport(profile);

    composer.upsertFile(
      `${profile.pagesHomeDir}/ui/HomePage.tsx`,
      `import { type FC } from "react";

export const HomePage: FC = () => {
  return <div>Home page</div>;
};
`,
    );
    composer.upsertFile(
      `${profile.pagesHomeDir}/index.ts`,
      `export { HomePage } from "./ui/HomePage";
`,
    );

    const current = composer.getFile(profile.appComponentPath);
    if (current === null) {
      throw new Error(`Expected ${profile.appComponentPath} to exist before react-router-dom morph.`);
    }
    composer.upsertFile(
      profile.appComponentPath,
      morphAppForReactRouterDom(current, profile.appComponentPath, home),
    );
  }
}
