import { IReactPatchService } from '../../../patches/IReactPatchService.js';
import {
  GenerationContext,
  pagesHomeImport,
  resolveReactLayoutProfile,
} from '@/domain/generation/index.js';
import { ICodeComposer } from '@/domain/ports/index.js';
import { morphAppForTanstackRouter } from '@/infrastructure/codegen/editors/AppRouterZoneMorph.js';

const homePageUi = `import { type FC } from "react";

export const HomePage: FC = () => {
  return <div>HomePage</div>;
};
`;

/**
 * TanStack Router scaffolding. Does not modify entry, HTML, or styles — only router tree and `App`.
 */
export class TanstackRouterPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    return context.options.value.router === '@tanstack/react-router';
  }

  async apply(
    context: GenerationContext,
    composer: ICodeComposer,
  ): Promise<void> {
    const profile = resolveReactLayoutProfile(
      context.options.value.architecture,
    );
    const homeModule = pagesHomeImport(profile);

    composer.upsertFile(`${profile.pagesHomeDir}/ui/HomePage.tsx`, homePageUi);
    composer.upsertFile(
      `${profile.pagesHomeDir}/index.ts`,
      `export { HomePage } from "./ui/HomePage";
`,
    );

    if (profile.tanstackLayout === 'fsd_tree') {
      composer.upsertFile(
        `${profile.appDirectory}/router/index.ts`,
        `export { router } from "./router";
`,
      );
      composer.upsertFile(
        `${profile.appDirectory}/router/router.tsx`,
        `import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./rootRoute";
import { homeRoute } from "./homeRoute";

const routeTree = rootRoute.addChildren([homeRoute.addChildren([])]);
export const router = createRouter({ routeTree });
`,
      );
      composer.upsertFile(
        `${profile.appDirectory}/router/rootRoute.tsx`,
        `import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "../layouts/root";

export const rootRoute = createRootRoute({ component: RootLayout });
`,
      );
      composer.upsertFile(
        `${profile.appDirectory}/router/homeRoute.tsx`,
        `import { HomePage } from "${homeModule}";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./rootRoute";

export const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => rootRoute,
  component: HomePage,
});
`,
      );
      composer.upsertFile(
        `${profile.appDirectory}/layouts/root/index.ts`,
        `export { RootLayout } from "./ui/RootLayout";
`,
      );
      composer.upsertFile(
        `${profile.appDirectory}/layouts/root/ui/RootLayout.tsx`,
        `import { Outlet } from "@tanstack/react-router";
import { type FC } from "react";

export const RootLayout: FC = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};
`,
      );
      this.applyTanstackAppMorph(composer, profile.appComponentPath);
      return;
    }

    composer.upsertFile(
      'src/components/RootLayout.tsx',
      `import { Outlet } from "@tanstack/react-router";
import { type FC } from "react";

export const RootLayout: FC = () => (
  <main>
    <Outlet />
  </main>
);
`,
    );
    composer.upsertFile(
      'src/router.tsx',
      `import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomePage } from "${homeModule}";
import { RootLayout } from "@/components/RootLayout";

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({
  path: "/",
  getParentRoute: () => rootRoute,
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute.addChildren([])]);

export const router = createRouter({ routeTree });
`,
    );

    this.applyTanstackAppMorph(composer, profile.appComponentPath);
  }

  private applyTanstackAppMorph(
    composer: ICodeComposer,
    appComponentPath: string,
  ): void {
    const current = composer.getFile(appComponentPath);
    if (current === null) {
      throw new Error(
        `Expected ${appComponentPath} to exist before TanStack router morph.`,
      );
    }
    composer.upsertFile(
      appComponentPath,
      morphAppForTanstackRouter(current, appComponentPath),
    );
  }
}
