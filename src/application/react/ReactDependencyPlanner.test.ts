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
      tanstackQuery: true,
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

test("ReactDependencyPlanner skips @tanstack/react-query when tanstackQuery is false", () => {
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
      tanstackQuery: false,
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
      tanstackQuery: false,
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
      tanstackQuery: false,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const dev = context.runtime.getDevDependencies();
  assert.ok(dev.includes("@biomejs/biome"));
});

