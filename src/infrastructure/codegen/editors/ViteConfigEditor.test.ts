import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveReactLayoutProfile } from "@/domain/generation/ReactLayoutProfile.js";
import { ViteConfigEditor } from "./ViteConfigEditor.js";
import { applyViteContributions } from "../vite/applyViteContributions.js";
import { SrcAliasContribution } from "../vite/contributions/SrcAliasContribution.js";
import { minimalViteConfigFallback } from "./ViteScaffoldFallback.js";

const simpleProfile = resolveReactLayoutProfile("simple");

test("applyViteContributions is idempotent for plugins and imports", () => {
  const seed = minimalViteConfigFallback();
  const once = new ViteConfigEditor(seed);
  applyViteContributions(once, { tailwind: true, profile: simpleProfile });
  const first = once.toString();
  const twice = new ViteConfigEditor(first);
  applyViteContributions(twice, { tailwind: true, profile: simpleProfile });
  const second = twice.toString();
  assert.equal(
    (second.match(/react\(\)/g) ?? []).length,
    1,
    "duplicate react()",
  );
  assert.equal(
    (second.match(/tailwindcss\(\)/g) ?? []).length,
    1,
    "duplicate tailwindcss()",
  );
});

test("SrcAliasContribution keeps foreign Vue plugin when only aliases are applied", () => {
  const vueFixture = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
});
`;
  const editor = new ViteConfigEditor(vueFixture);
  new SrcAliasContribution().apply(editor, { tailwind: false, profile: simpleProfile });
  const out = editor.toString();
  assert.match(out, /vue\(\)/);
  assert.match(out, /@vitejs\/plugin-vue/);
  assert.match(out, /"@icons"/);
});

test("merge-style vite config from scaffold keeps plugins order append", () => {
  const scaffoldLike = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;
  const editor = new ViteConfigEditor(scaffoldLike);
  applyViteContributions(editor, { tailwind: false, profile: simpleProfile });
  const out = editor.toString();
  assert.match(out, /path\.resolve\(__dirname, "src"\)/);
});
