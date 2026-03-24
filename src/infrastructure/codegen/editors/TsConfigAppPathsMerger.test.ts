import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveReactLayoutProfile } from "@/domain/generation/ReactLayoutProfile.js";
import { mergeTsConfigAppPaths } from "./TsConfigAppPathsMerger.js";

const simpleProfile = resolveReactLayoutProfile("simple");

test("mergeTsConfigAppPaths preserves other compilerOptions and overlays paths", () => {
  const raw = JSON.stringify(
    {
      compilerOptions: {
        strict: true,
        paths: { "@/*": ["./src/*"], "legacy/*": ["./legacy/*"] },
      },
      include: ["src"],
    },
    null,
    2,
  );
  const out = mergeTsConfigAppPaths(raw, simpleProfile);
  const parsed = JSON.parse(out) as {
    compilerOptions: { strict: boolean; paths: Record<string, string[]> };
    include: string[];
  };
  assert.equal(parsed.compilerOptions.strict, true);
  assert.deepEqual(parsed.include, ["src"]);
  assert.ok(parsed.compilerOptions.paths["@icons/*"]);
  assert.ok(parsed.compilerOptions.paths["legacy/*"]);
});

test("mergeTsConfigAppPaths accepts JSONC like Vite react-ts template", () => {
  const raw = `{
  // Vite / TS defaults
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  "include": ["src"],
}
`;
  const out = mergeTsConfigAppPaths(raw, simpleProfile);
  const parsed = JSON.parse(out) as {
    compilerOptions: { strict: boolean; paths: Record<string, string[]> };
    include: string[];
  };
  assert.equal(parsed.compilerOptions.strict, true);
  assert.ok(parsed.compilerOptions.paths["@icons/*"]);
});
