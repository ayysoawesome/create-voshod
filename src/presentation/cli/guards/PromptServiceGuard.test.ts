import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

test("PromptService does not depend on legacy askQuestions helper", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src",
    "presentation",
    "cli",
    "prompts",
    "PromptService.ts",
  );
  const content = fs.readFileSync(filePath, "utf8");

  assert.equal(content.includes("askQuestions"), false);
});

test("Prompt choices and capability catalog use stable TanStack ids", () => {
  const choicesPath = path.resolve(
    process.cwd(),
    "src",
    "presentation",
    "cli",
    "prompts",
    "promptChoices.ts",
  );
  const catalogPath = path.resolve(
    process.cwd(),
    "src",
    "domain",
    "generation",
    "frameworkCapabilityCatalog.ts",
  );
  const choices = fs.readFileSync(choicesPath, "utf8");
  const catalog = fs.readFileSync(catalogPath, "utf8");

  assert.equal(choices.includes("@tanstack/react-router"), true);
  assert.equal(choices.includes("tanstack-table"), true);
  assert.equal(choices.includes("VALIDATION_LIBRARY_CHOICES"), true);
  assert.equal(catalog.includes("@tanstack/react-table"), true);
  assert.equal(catalog.includes("@tanstack/vue-table"), true);
  assert.equal(choices.includes("@tanstack/router"), false);
  assert.equal(choices.includes("@tanstack/table"), false);
  assert.equal(choices.includes("@tanstack/form"), false);
});

