import { test } from "node:test";
import assert from "node:assert/strict";
import { getViteReactTsTemplateCruftPaths } from "./viteReactTsScaffoldCruft.js";

test("FSD cruft includes root App and main from Vite template", () => {
  const paths = getViteReactTsTemplateCruftPaths("fsd");
  assert.ok(paths.includes("src/App.tsx"));
  assert.ok(paths.includes("src/main.tsx"));
  assert.ok(paths.includes("src/index.css"));
  assert.ok(paths.includes("public/vite.svg"));
});

test("simple cruft keeps root App but drops Vite entry and demo css", () => {
  const paths = getViteReactTsTemplateCruftPaths("simple");
  assert.equal(paths.includes("src/App.tsx"), false);
  assert.ok(paths.includes("src/main.tsx"));
  assert.ok(paths.includes("src/App.css"));
  assert.ok(paths.includes("public/vite.svg"));
});
