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

test("PromptService uses aligned tanstack package names", () => {
  const filePath = path.resolve(
    process.cwd(),
    "src",
    "presentation",
    "cli",
    "prompts",
    "promptChoices.ts",
  );
  const content = fs.readFileSync(filePath, "utf8");

  assert.equal(content.includes("@tanstack/react-router"), true);
  assert.equal(content.includes("@tanstack/react-table"), true);
  assert.equal(content.includes("VALIDATION_LIBRARY_CHOICES"), true);
  assert.equal(content.includes("@tanstack/router"), false);
  assert.equal(content.includes("@tanstack/table"), false);
  assert.equal(content.includes("@tanstack/form"), false);
});

