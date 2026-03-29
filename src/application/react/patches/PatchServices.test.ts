import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerationContext } from "@/domain/generation/index.js";
import { TsMorphCodeComposer } from "@/infrastructure/codegen/index.js";
import { BaseReactFilesFactory } from "../base-files/BaseReactFilesFactory.js";
import { TailwindPatchService } from "./styling/TailwindPatchService.js";
import { SharedApiPatchService } from "./http/SharedApiPatchService.js";
import { SharedConfigPatchService } from "./config/SharedConfigPatchService.js";
import { FormatterPatchService } from "./toolchain/FormatterPatchService.js";

test("TailwindPatchService adds styles under FSD profile without touching entry imports via main", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
      httpClient: null,
      validationLibrary: "zod",
      styling: "tailwind",
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new TailwindPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/app/styles/index.css"));
  const variables = composer.getFile("src/app/styles/variables.css");
  assert.ok(variables?.includes("@theme"));
  assert.ok(variables?.includes("--color-white:"));
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
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/shared/api/resolveContentType.ts"));
  assert.ok(composer.hasFile("src/shared/api/errorAdapter.ts"));
  assert.ok(composer.hasFile("src/shared/api/validation.ts"));
  assert.equal(composer.hasFile("src/shared/api/httpClient.ts"), false);
  assert.ok(composer.hasFile("src/shared/api/axios.ts"));
  assert.ok(composer.hasFile("src/shared/api/baseService.ts"));
  const policy = composer.getFile("src/shared/api/resolveContentType.ts");
  assert.ok(policy?.includes("export const resolveContentType"));
  const axiosModule = composer.getFile("src/shared/api/axios.ts");
  assert.ok(axiosModule?.includes("axios.create"));
  assert.equal(
    axiosModule?.includes('"Content-Type": "application/json"'),
    false,
    "axios.create must not pin global JSON Content-Type",
  );
  const adapter = composer.getFile("src/shared/api/errorAdapter.ts");
  assert.ok(adapter?.includes("ApiErrorNormalizer"));
  assert.ok(adapter?.includes("isAxiosError"));
  const base = composer.getFile("src/shared/api/baseService.ts");
  assert.ok(base?.includes("./axios"));
  assert.ok(base?.includes("./resolveContentType"));
  assert.ok(base?.includes("./errorAdapter"));
  assert.ok(base?.includes("./validation"));
  assert.ok(base?.includes("resolveContentType"));
  assert.ok(base?.includes("queryParams"));
  assert.ok(base?.includes("this.client.request"));
  assert.ok(base?.includes("params:"));
  assert.ok(base?.includes("data:"));
  assert.ok(base?.includes("basePath: envConfig.apiBaseUrl"));
  assert.equal(base?.includes("AxiosHeaders"), false);
  assert.equal(base?.includes("axiosConfigForMutation"), false);
  assert.ok(base?.includes("public async put"));
  assert.ok(base?.includes("public async patch"));
  assert.ok(base?.includes("public async delete"));
  const index = composer.getFile("src/shared/api/index.ts");
  assert.equal(index?.includes("httpClient"), false);
  assert.ok(index?.includes("baseAxiosInstance"));
  assert.ok(index?.includes("validateResponse"));
  assert.ok(index?.includes("toApiError") && index?.includes("./errorAdapter"));
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
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.ok(composer.hasFile("src/api/resolveContentType.ts"));
  assert.ok(composer.hasFile("src/api/errorAdapter.ts"));
  assert.ok(composer.hasFile("src/api/validation.ts"));
  assert.equal(composer.hasFile("src/api/axios.ts"), false);
  assert.ok(composer.hasFile("src/api/httpClient.ts"));
  const httpClient = composer.getFile("src/api/httpClient.ts");
  assert.ok(httpClient?.includes("./resolveContentType"));
  assert.ok(httpClient?.includes("resolveContentType(body)"));
  assert.ok(httpClient?.includes("export class HttpClient"));
  assert.ok(httpClient?.includes("export const httpClient = new HttpClient()"));
  assert.ok(httpClient?.includes("put<T>("));
  assert.ok(httpClient?.includes("patch<T>("));
  assert.ok(httpClient?.includes("delete<T>("));
  assert.ok(httpClient?.includes("buildFetchInit"));
  assert.ok(httpClient?.includes("FormData"));
  assert.ok(httpClient?.includes("JSON.stringify(body)"));
  assert.equal(
    /headers:\s*\{\s*["']Content-Type["']\s*:\s*["']application\/json/.test(
      httpClient ?? "",
    ),
    false,
    "fetch wrapper must not set a single flat JSON Content-Type for every request",
  );
  const index = composer.getFile("src/api/index.ts");
  assert.ok(index?.includes("httpClient"));
  assert.ok(index?.includes("validateResponse"));
  assert.ok(index?.includes("toApiError") && index?.includes("./errorAdapter"));
  const adapter = composer.getFile("src/api/errorAdapter.ts");
  assert.ok(adapter?.includes("ApiErrorNormalizer"));
  assert.ok(adapter?.includes("Response"));
});

test('SharedApiPatchService creates ofetch stack under shared/api when ofetch selected', async () => {
  const context = new GenerationContext({
    options: {
      projectName: 'demo',
      framework: 'react',
      architecture: 'fsd',
      httpClient: 'ofetch',
      validationLibrary: 'zod',
      styling: 'css',
      formatter: 'prettier',
      router: 'react-router-dom',
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: 'npm',
    framework: 'react',
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.ok(composer.hasFile('src/shared/api/resolveContentType.ts'));
  assert.ok(composer.hasFile('src/shared/api/errorAdapter.ts'));
  assert.ok(composer.hasFile('src/shared/api/validation.ts'));
  assert.ok(composer.hasFile('src/shared/api/baseService.ts'));
  assert.equal(composer.hasFile('src/shared/api/httpClient.ts'), false);
  assert.equal(composer.hasFile('src/shared/api/axios.ts'), false);

  const base = composer.getFile('src/shared/api/baseService.ts');
  assert.ok(base?.includes('from \"ofetch\"') || base?.includes("from 'ofetch'"));
  assert.ok(base?.includes("../config"));
  assert.ok(base?.includes("basePath: envConfig.apiBaseUrl"));
  assert.ok(base?.includes('resolveContentType'));
  assert.ok(base?.includes("'Content-Type'") || base?.includes('"Content-Type"'));

  const index = composer.getFile('src/shared/api/index.ts');
  assert.equal(index?.includes('httpClient'), false);
  assert.equal(index?.includes('baseAxiosInstance'), false);
  assert.ok(index?.includes('baseService'));
});

test("SharedConfigPatchService writes env files and ignore rules at project root", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedConfigPatchService().apply(context, composer);

  assert.equal(composer.getFile(".env")?.trim(), "VITE_API_BASE_URL=http://localhost:8080");
  assert.ok(composer.getFile(".env.example")?.includes("VITE_API_BASE_URL="));
  assert.ok(composer.getFile(".gitignore")?.includes(".env"));
  assert.ok(composer.getFile(".gitignore")?.includes("node_modules"));
  assert.ok(composer.getFile(".cursorignore")?.includes("node_modules/"));
});

test("FormatterPatchService switches package.json to biome toolchain", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      formatter: "biome",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles([
    {
      relativePath: "package.json",
      content: JSON.stringify(
        {
          scripts: {
            lint: "eslint .",
          },
          devDependencies: {
            eslint: "^9.0.0",
            "@eslint/js": "^9.0.0",
            "eslint-plugin-react-hooks": "^7.0.0",
            "eslint-plugin-react-refresh": "^0.5.0",
            "typescript-eslint": "^8.0.0",
            globals: "^16.0.0",
          },
        },
        null,
        2,
      ),
    },
  ]);

  await new FormatterPatchService().apply(context, composer);

  const pkg = composer.getFile("package.json");
  assert.ok(pkg?.includes('"lint": "biome check ."'));
  assert.ok(pkg?.includes('"format": "biome format ."'));
  assert.ok(pkg?.includes('"format:write": "biome format --write ."'));
  assert.equal(pkg?.includes('"eslint"'), false);
  assert.equal(pkg?.includes('"@eslint/js"'), false);
  assert.ok(composer.hasFile("biome.json"));
  const biome = composer.getFile("biome.json");
  assert.ok(biome?.includes('"tailwindDirectives": true'));
  assert.ok(biome?.includes('"quoteStyle": "single"'));
  assert.ok(biome?.includes('"semicolons": "always"'));
});

test("FormatterPatchService keeps eslint flow for prettier option", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles([
    {
      relativePath: "package.json",
      content: JSON.stringify(
        {
          scripts: {
            lint: "eslint .",
          },
          devDependencies: {
            eslint: "^9.0.0",
          },
        },
        null,
        2,
      ),
    },
  ]);

  await new FormatterPatchService().apply(context, composer);
  const pkg = composer.getFile("package.json");
  assert.ok(pkg?.includes('"lint": "eslint ."'));
  assert.ok(pkg?.includes('"format:write": "prettier --write ."'));
  assert.equal(composer.hasFile("biome.json"), false);
  const prettier = composer.getFile(".prettierrc");
  assert.ok(prettier?.includes('"singleQuote": true'));
  assert.ok(prettier?.includes('"semi": true'));
});

test("SharedApiPatchService omits query client files when asyncState is none", async () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: "zod",
      styling: "css",
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: null,
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
      formatter: "prettier",
      router: "react-router-dom",
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  const composer = new TsMorphCodeComposer();
  composer.setBaseFiles(new BaseReactFilesFactory().create(context));
  await new SharedApiPatchService().apply(context, composer);

  assert.equal(composer.hasFile("src/api/validation.ts"), false);

  const errors = composer.getFile("src/api/errors.ts");
  assert.ok(errors, "expected src/api/errors.ts");
  assert.equal(errors.includes("from \"zod\""), false);
  assert.equal(errors.includes("ZodError"), false);
  assert.equal(errors.includes("toApiError"), false);

  const adapter = composer.getFile("src/api/errorAdapter.ts");
  assert.ok(adapter, "expected src/api/errorAdapter.ts");
  assert.equal(adapter.includes("ZodError"), false);
  assert.equal(adapter.includes("from \"zod\""), false);

  const base = composer.getFile("src/api/baseService.ts");
  assert.ok(base, "expected src/api/baseService.ts");
  assert.equal(base.includes("from \"zod\""), false);
});
