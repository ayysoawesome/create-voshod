import { test } from "node:test";
import assert from "node:assert/strict";
import { getViteVueTsTemplateCruftPaths } from "./viteVueTsScaffoldCruft.js";

test("vue-ts FSD cruft drops default entry and App", () => {
  const paths = getViteVueTsTemplateCruftPaths("fsd");
  assert.ok(paths.includes("src/main.ts"));
  assert.ok(paths.includes("src/App.vue"));
});

test("vue-ts simple cruft drops demo component and assets", () => {
  const paths = getViteVueTsTemplateCruftPaths("simple");
  assert.equal(paths.includes("src/main.ts"), false);
  assert.ok(paths.includes("src/components/HelloWorld.vue"));
});
