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
      router: "react-router-dom",
      tanstackQuery: true,
      libs: [],
    },
    packageManager: "npm",
    framework: "react",
  });

  new ReactDependencyPlanner().plan(context);

  const prod = context.runtime.getProdDependencies();
  assert.ok(prod.includes("@tanstack/react-query"));
  assert.ok(prod.includes("axios"));
  assert.ok(prod.includes("react-router-dom"));
  assert.ok(prod.includes("tailwindcss"));
  assert.ok(prod.includes("@tailwindcss/vite"));
  assert.ok(prod.includes("zod"));
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

