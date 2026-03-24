import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerationContext } from "@/domain/generation/index.js";
import { TsMorphCodeComposer } from "@/infrastructure/codegen/index.js";
import { BaseReactFilesFactory } from "../base-files/BaseReactFilesFactory.js";
import { TailwindPatchService } from "./styling/TailwindPatchService.js";
import { SharedApiPatchService } from "./http/SharedApiPatchService.js";

test("TailwindPatchService adds styles under FSD profile without touching entry imports via main", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
      httpClient: null,
      validationLibrary: "zod",
      styling: "tailwind",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new TailwindPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/app/styles/index.css"));
  const entry = composer.getFile("src/app/index.tsx");
  assert.ok(entry?.includes("./styles/index.css"));
});

test("SharedApiPatchService creates axios stack under shared/api when axios selected", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
      httpClient: "axios",
      validationLibrary: "zod",
      styling: "css",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/shared/api/axios.ts"));
  assert.ok(composer.hasFile("src/shared/api/baseService.ts"));
  assert.ok(composer.getFile("src/shared/api/index.ts")?.includes("baseAxiosInstance"));
});

test("SharedApiPatchService creates fetch stack under src/api for simple layout", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/api/httpClient.ts"));
  assert.ok(composer.getFile("src/api/index.ts")?.includes("httpClient"));
});

test("SharedApiPatchService omits query client files when tanstackQuery is false", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      router: "react-router-dom",
      tanstackQuery: false,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.equal(composer.hasFile("src/api/queryClient.ts"), false);
  assert.equal(composer.hasFile("src/api/retry.ts"), false);
  const index = composer.getFile("src/api/index.ts");
  assert.ok(index, "expected src/api/index.ts");
  assert.equal(index.includes("queryClient"), false);
});

test("SharedApiPatchService omits Zod from generated API when validationLibrary is null", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  const errors = composer.getFile("src/api/errors.ts");
  assert.ok(errors, "expected src/api/errors.ts");
  assert.equal(errors.includes("from \"zod\""), false);
  assert.equal(errors.includes("ZodError"), false);

  const base = composer.getFile("src/api/baseService.ts");
  assert.ok(base, "expected src/api/baseService.ts");
  assert.equal(base.includes("from \"zod\""), false);
});
