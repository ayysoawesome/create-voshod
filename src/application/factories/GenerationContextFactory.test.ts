import { test } from "node:test";
import assert from "node:assert/strict";
import { GenerationContextFactory } from "./GenerationContextFactory.js";
import type { PackageManager } from "@/domain/ports/index.js";
import type { CLIOptions } from "@/domain/generation/index.js";
import { ValidationError } from "@/domain/errors/index.js";

const createOptions = (projectName: string): CLIOptions => ({
  projectName,
  framework: "react",
  architecture: "simple",
  styling: "css",
  formatter: "prettier",
  httpClient: null,
  validationLibrary: "zod",
  router: "react-router-dom",
  tanstackQuery: true,
  libs: [],
});

const detectorStub = {
  detect(): PackageManager {
    return "npm";
  },
};

test("GenerationContextFactory trims project name", () => {
  const factory = new GenerationContextFactory(detectorStub);
  const context = factory.create(createOptions("  demo-app  "));
  assert.equal(context.options.value.projectName, "demo-app");
});

test("GenerationContextFactory rejects empty project name", () => {
  const factory = new GenerationContextFactory(detectorStub);
  assert.throws(
    () => factory.create(createOptions("   ")),
    (error: unknown) =>
      error instanceof ValidationError &&
      error.message === "Project name is required.",
  );
});
