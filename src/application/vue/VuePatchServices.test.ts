import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GenerationContext,
  type ProjectOptions,
} from "@/domain/generation/index.js";
import { TsMorphCodeComposer } from "@/infrastructure/codegen/index.js";
import { BaseVueFilesFactory } from "./base-files/BaseVueFilesFactory.js";
import { SharedApiPatchService } from "../react/patches/http/SharedApiPatchService.js";
import { VueToolchainPatchService } from "./patches/toolchain/VueToolchainPatchService.js";
import { VueAppIntegrationPatchService } from "./patches/VueAppIntegrationPatchService.js";

function vueContext(overrides: Partial<ProjectOptions> = {}): GenerationContext {
  return new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "fsd",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "vue-router",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
      ...overrides,
    },
    packageManager: "npm",
    framework: "vue",
  });
}

test("SharedApiPatchService uses @tanstack/vue-query in queryClient for Vue", async () => {
  const context = vueContext();
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseVueFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);
  const qc = composer.getFile("src/shared/api/queryClient.ts");
  assert.ok(qc?.includes("@tanstack/vue-query"));
  assert.equal(qc?.includes("@tanstack/react-query"), false);
});

test("VueToolchainPatchService sets html script to FSD main and adds vue plugin", async () => {
  const context = vueContext();
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseVueFilesFactory().create(context));
  composer.upsertFile(
    "vite.config.ts",
    `import { defineConfig } from "vite";

export default defineConfig({});
`,
  );
  composer.upsertFile(
    "tsconfig.app.json",
    `{
  "compilerOptions": { "paths": {} },
  "include": ["src"]
}
`,
  );
  composer.upsertFile(
    "index.html",
    `<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
  );
  await new VueToolchainPatchService().apply(context, composer);
  const html = composer.getFile("index.html");
  assert.ok(html?.includes("/src/app/main.ts"));
  const vite = composer.getFile("vite.config.ts");
  assert.ok(vite?.includes("@vitejs/plugin-vue"));
  assert.ok(vite?.includes("vue()"));
});

test("VueAppIntegrationPatchService writes router and home slice for vue-router", async () => {
  const context = vueContext();
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseVueFilesFactory().create(context));
  await new VueAppIntegrationPatchService().apply(context, composer);
  assert.ok(composer.hasFile("src/app/router/router.ts"));
  assert.ok(composer.getFile("src/app/router/router.ts")?.includes("createWebHistory"));
  assert.ok(composer.hasFile("src/pages/home/ui/HomePage.vue"));
  const main = composer.getFile("src/app/main.ts");
  assert.ok(main?.includes("VueQueryPlugin"));
  assert.ok(main?.includes("./router/router"));
});

test("SharedApiPatchService omits queryClient for Vue when asyncState is pinia-colada", async () => {
  const context = vueContext({
    asyncState: "pinia-colada",
    clientState: null,
  });
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseVueFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);
  assert.equal(composer.hasFile("src/shared/api/queryClient.ts"), false);
  const index = composer.getFile("src/shared/api/index.ts");
  assert.ok(index);
  assert.equal(index.includes("queryClient"), false);
});

test("VueAppIntegrationPatchService wires Pinia Colada in main when asyncState is pinia-colada", async () => {
  const context = vueContext({
    router: null,
    asyncState: "pinia-colada",
    clientState: null,
  });
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseVueFilesFactory().create(context));
  await new VueAppIntegrationPatchService().apply(context, composer);
  const main = composer.getFile("src/app/main.ts");
  assert.ok(main?.includes("createPinia"));
  assert.ok(main?.includes("PiniaColada"));
  assert.equal(main?.includes("VueQueryPlugin"), false);
});
