import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerationContext } from "@/domain/generation/index.js";
import { TsMorphCodeComposer } from "@/infrastructure/codegen/index.js";
import { BaseReactFilesFactory } from "../../base-files/BaseReactFilesFactory.js";
import { TanstackRouterPatchService } from "./TanstackRouterPatchService.js";
import { ReactRouterDomPatchService } from "./ReactRouterDomPatchService.js";
import { AppProvidersPatchService } from "../providers/AppProvidersPatchService.js";

function makeContext(
  architecture: "simple" | "fsd",
  router: "react-router-dom" | "@tanstack/react-router",
): GenerationContext {
  return new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture,
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      router,
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });
}

test("BaseReactFilesFactory adds shared placeholder only for fsd", () => {
  const simple = new BaseReactFilesFactory().create(
    makeContext("simple", "react-router-dom"),
  );
  const fsd = new BaseReactFilesFactory().create(
    makeContext("fsd", "react-router-dom"),
  );

  assert.equal(
    simple.some((f) => f.relativePath === "src/shared/index.ts"),
    false,
  );
  assert.equal(
    fsd.some((f) => f.relativePath === "src/shared/index.ts"),
    true,
  );
});

test("BaseReactFilesFactory simple uses flat src entry", () => {
  const simple = new BaseReactFilesFactory().create(
    makeContext("simple", "react-router-dom"),
  );
  assert.ok(simple.some((f) => f.relativePath === "src/index.tsx"));
  assert.equal(
    simple.some((f) => f.relativePath === "src/app/index.tsx"),
    false,
  );
});

test("BaseReactFilesFactory simple seeds empty asset/component/hook/util dirs via gitkeep", () => {
  const simple = new BaseReactFilesFactory().create(
    makeContext("simple", "react-router-dom"),
  );
  assert.ok(simple.some((f) => f.relativePath === "src/assets/.gitkeep"));
  assert.ok(simple.some((f) => f.relativePath === "src/components/.gitkeep"));
  assert.ok(simple.some((f) => f.relativePath === "src/hooks/.gitkeep"));
  assert.ok(simple.some((f) => f.relativePath === "src/utils/.gitkeep"));
});

test("BaseReactFilesFactory fsd does not add simple flat gitkeeps", () => {
  const fsd = new BaseReactFilesFactory().create(
    makeContext("fsd", "react-router-dom"),
  );
  assert.equal(fsd.some((f) => f.relativePath === "src/components/.gitkeep"), false);
});

test("BaseReactFilesFactory fsd seeds slice dirs and shared ui/lib", () => {
  const fsd = new BaseReactFilesFactory().create(
    makeContext("fsd", "react-router-dom"),
  );
  assert.ok(fsd.some((f) => f.relativePath === "src/shared/ui/index.ts"));
  assert.ok(fsd.some((f) => f.relativePath === "src/shared/lib/index.ts"));
  assert.ok(fsd.some((f) => f.relativePath === "src/pages/.gitkeep"));
  assert.ok(fsd.some((f) => f.relativePath === "src/widgets/.gitkeep"));
  assert.ok(fsd.some((f) => f.relativePath === "src/features/.gitkeep"));
  assert.ok(fsd.some((f) => f.relativePath === "src/entities/.gitkeep"));
  assert.ok(fsd.some((f) => f.relativePath === "src/shared/assets/icons/.gitkeep"));
  assert.ok(fsd.some((f) => f.relativePath === "src/shared/assets/images/.gitkeep"));
});

test("TanstackRouterPatchService simple uses colocated router.tsx and @/pages/home", async () => {
  const context = makeContext("simple", "@tanstack/react-router");
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new AppProvidersPatchService().apply(context, composer);
  await new TanstackRouterPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/router.tsx"));
  assert.ok(composer.hasFile("src/components/RootLayout.tsx"));
  assert.ok(composer.hasFile("src/pages/home/ui/HomePage.tsx"));
  assert.equal(composer.hasFile("src/app/router/homeRoute.tsx"), false);

  const routerFile = composer.getFile("src/router.tsx");
  assert.ok(routerFile?.includes('@/pages/home'));
  assert.ok(routerFile?.includes("@/components/RootLayout"));
  const app = composer.getFile("src/App.tsx");
  assert.ok(app?.includes("@/providers"));
});

test("TanstackRouterPatchService fsd uses app/router tree and @/pages/home", async () => {
  const context = makeContext("fsd", "@tanstack/react-router");
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new AppProvidersPatchService().apply(context, composer);
  await new TanstackRouterPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/pages/home/ui/HomePage.tsx"));
  const homeRoute = composer.getFile("src/app/router/homeRoute.tsx");
  assert.ok(homeRoute?.includes('@/pages/home'));
});

test("ReactRouterDomPatchService simple uses src/App and pages slice", async () => {
  const context = makeContext("simple", "react-router-dom");
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new AppProvidersPatchService().apply(context, composer);
  await new ReactRouterDomPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/pages/home/ui/HomePage.tsx"));
  const app = composer.getFile("src/App.tsx");
  assert.ok(app?.includes("@/pages/home"));
  assert.ok(app?.includes("@/providers"));
});

test("ReactRouterDomPatchService fsd uses app/App and pages slice", async () => {
  const context = makeContext("fsd", "react-router-dom");
  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new AppProvidersPatchService().apply(context, composer);
  await new ReactRouterDomPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/pages/home/ui/HomePage.tsx"));
  const app = composer.getFile("src/app/App.tsx");
  assert.ok(app?.includes("@/pages/home"));
  assert.ok(app?.includes("./providers"));
});
