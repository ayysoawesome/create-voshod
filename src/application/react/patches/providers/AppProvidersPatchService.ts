import { IReactPatchService } from "../../../patches/IReactPatchService.js";
import {
  GenerationContext,
  apiImportBase,
  resolveReactLayoutProfile,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

/**
 * Registers `AppProviders` and a default `App` shell when no router is selected.
 * Router patches replace `App.tsx` with router-aware layout that still wraps children in `AppProviders`.
 */
export class AppProvidersPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.framework === "react";
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveReactLayoutProfile(context.options.value.architecture);
    const api = apiImportBase(profile);
    const pDir = profile.providersDirectory;
    const useQuery = context.options.value.tanstackQuery;

    const appProvidersSource = useQuery
      ? `import { type FC, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "${api}";

export const AppProviders: FC<{ children: ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
`
      : `import { type FC, type ReactNode } from "react";

export const AppProviders: FC<{ children: ReactNode }> = ({ children }) => <>{children}</>;
`;

    composer.upsertFile(`${pDir}/AppProviders.tsx`, appProvidersSource);
    composer.upsertFile(
      `${pDir}/index.ts`,
      `export { AppProviders } from "./AppProviders";
`,
    );

    const providersImport =
      profile.appDirectory === null ? "@/providers" : "./providers";

    composer.upsertFile(
      profile.appComponentPath,
      `import { type FC } from "react";
import { AppProviders } from "${providersImport}";

export const App: FC = () => (
  <AppProviders>
    <div>Voshod React App</div>
  </AppProviders>
);
`,
    );
  }
}
