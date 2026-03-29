import { IReactPatchService } from "../../patches/IReactPatchService.js";
import {
  GenerationContext,
  resolveVueLayoutProfile,
  vueApiImportBase,
} from "@/domain/generation/index.js";
import { ICodeComposer } from "@/domain/ports/index.js";

/**
 * Wires Vue Router, Pinia, TanStack Query (Vue), Pinia Colada, and entry/App shell for generated Vue apps.
 */
export class VueAppIntegrationPatchService implements IReactPatchService {
  supports(context: GenerationContext): boolean {
    if (context.framework !== "vue") {
      return false;
    }
    const o = context.options.value;
    const useRouter = o.router === "vue-router";
    const useQuery = o.asyncState === "tanstack-query";
    const usePinia = o.clientState === "pinia" || o.asyncState === "pinia-colada";
    return useRouter || useQuery || usePinia;
  }

  async apply(context: GenerationContext, composer: ICodeComposer): Promise<void> {
    const profile = resolveVueLayoutProfile(context.options.value.architecture);
    const o = context.options.value;
    const useRouter = o.router === "vue-router";
    const useQuery = o.asyncState === "tanstack-query";
    const useColada = o.asyncState === "pinia-colada";
    const usePinia = o.clientState === "pinia" || useColada;
    const api = vueApiImportBase(profile);
    const entryPath = profile.entryRelativePath;
    const appPath = profile.appComponentPath;

    if (useRouter) {
      if (profile.vueRouterLayout === "fsd_tree") {
        composer.upsertFile(
          "src/app/router/router.ts",
          `import { createWebHistory, createRouter } from "vue-router";
import { RootLayout } from "../layouts/root";
import { HomePage } from "@/pages/home";

const routes = [
  {
    path: "/",
    component: RootLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomePage,
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
`,
        );
        composer.upsertFile(
          "src/app/layouts/root/ui/RootLayout.vue",
          `<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <main class="min-h-screen">
    <RouterView />
  </main>
</template>
`,
        );
        composer.upsertFile(
          "src/app/layouts/root/index.ts",
          `export { default as RootLayout } from "./ui/RootLayout.vue";
`,
        );
      } else {
        composer.upsertFile(
          "src/router.ts",
          `import { createWebHistory, createRouter } from "vue-router";
import { RootLayout } from "@/layouts/root";
import { HomePage } from "@/pages/home";

const routes = [
  {
    path: "/",
    component: RootLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomePage,
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
`,
        );
        composer.upsertFile(
          "src/layouts/root/ui/RootLayout.vue",
          `<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <main class="min-h-screen">
    <RouterView />
  </main>
</template>
`,
        );
        composer.upsertFile(
          "src/layouts/root/index.ts",
          `export { default as RootLayout } from "./ui/RootLayout.vue";
`,
        );
      }

      composer.upsertFile(
        `${profile.pagesHomeDir}/ui/HomePage.vue`,
        `<script setup lang="ts">
</script>

<template>
  <div>
    <h1>Home Page</h1>
  </div>
</template>
`,
      );
      composer.upsertFile(
        `${profile.pagesHomeDir}/index.ts`,
        `export { default as HomePage } from "./ui/HomePage.vue";
`,
      );
    }

    const routerImportLine = useRouter
      ? profile.vueRouterLayout === "fsd_tree"
        ? `import { router } from "./router/router";
`
        : `import { router } from "./router";
`
      : "";

    const piniaImportBlock = usePinia
      ? `import { createPinia } from "pinia";
`
      : "";

    const coladaImportBlock = useColada
      ? `import { PiniaColada } from "@pinia/colada";
`
      : "";

    const queryImportBlock = useQuery
      ? `import { VueQueryPlugin } from "@tanstack/vue-query";
import { queryClient } from "${api}";
`
      : "";

    const piniaUseBlock = usePinia
      ? `const pinia = createPinia();
app.use(pinia);
`
      : "";

    const routerUse = useRouter ? `app.use(router);
` : "";

    const queryUse = useQuery
      ? `app.use(VueQueryPlugin, { queryClient });
`
      : "";

    const coladaUse = useColada ? `app.use(PiniaColada);
` : "";

    composer.upsertFile(
      entryPath,
      `import { createApp } from "vue";
${piniaImportBlock}${coladaImportBlock}${queryImportBlock}${routerImportLine}import App from "./App.vue";
import "${profile.stylesIndexImport}";

const app = createApp(App);
${piniaUseBlock}${routerUse}${queryUse}${coladaUse}app.mount("#app");
`,
    );

    if (useRouter) {
      composer.upsertFile(
        appPath,
        `<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView />
</template>
`,
      );
    }
  }
}
