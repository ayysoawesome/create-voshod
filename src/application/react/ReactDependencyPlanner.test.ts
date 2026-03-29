import { test } from "node:test";
import assert from "node:assert/strict";
import { ReactDependencyPlanner } from "./dependency-planning/index.js";
import { GenerationContext } from "@/domain/generation/index.js";

test("ReactDependencyPlanner plans required dependencies", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "fsd",
      httpClient: "axios",
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

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  const dev = context.runtime.getDevDependencies();
  assert.ok(prod.includes("@tanstack/react-query"));
  assert.ok(prod.includes("axios"));
  assert.ok(prod.includes("react-router-dom"));
  assert.ok(prod.includes("tailwindcss"));
  assert.ok(prod.includes("@tailwindcss/vite"));
  assert.ok(prod.includes("zod"));
  assert.equal(prod.includes("@biomejs/biome"), false);
  assert.ok(dev.includes("prettier"));
});

test("ReactDependencyPlanner skips @tanstack/react-query when asyncState is none", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.equal(prod.includes("@tanstack/react-query"), false);
});

test("ReactDependencyPlanner skips zod when validationLibrary is null", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.equal(prod.includes("zod"), false);
});

test("ReactDependencyPlanner adds biome when formatter is biome", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "biome",
      router: null,
      clientState: null,
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const dev = context.runtime.getDevDependencies();
  assert.ok(dev.includes("@biomejs/biome"));
});

test("ReactDependencyPlanner adds vue-query for Vue when asyncState is tanstack-query", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: "tanstack-query",
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("@tanstack/vue-query"));
  assert.equal(prod.includes("@tanstack/react-query"), false);
});

test("ReactDependencyPlanner resolves logical additional libs to npm", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: null,
      libs: ["tanstack-table", "react-hook-form"],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("@tanstack/react-table"));
  assert.ok(prod.includes("react-hook-form"));
});

test("ReactDependencyPlanner adds zustand when clientState is zustand", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "react",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: "zustand",
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("zustand"));
});

test("ReactDependencyPlanner adds pinia for Vue when clientState is pinia", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: "pinia",
      asyncState: null,
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("pinia"));
  assert.equal(prod.filter((p) => p === "pinia").length, 1);
});

test("ReactDependencyPlanner adds pinia and colada once when asyncState is pinia-colada without client pinia", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: null,
      asyncState: "pinia-colada",
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("@pinia/colada"));
  assert.equal(prod.filter((p) => p === "pinia").length, 1);
});

test("ReactDependencyPlanner does not duplicate pinia when clientState pinia and asyncState pinia-colada", () => {
  const context = new GenerationContext({
    options: {
      projectName: "demo",
      framework: "vue",
      architecture: "simple",
      httpClient: null,
      validationLibrary: null,
      styling: "css",
      formatter: "prettier",
      router: null,
      clientState: "pinia",
      asyncState: "pinia-colada",
      libs: [],
    },
    packageManager: "npm",
    framework: "vue",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("@pinia/colada"));
  assert.equal(prod.filter((p) => p === "pinia").length, 1);
});
