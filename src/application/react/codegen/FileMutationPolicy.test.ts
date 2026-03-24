import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ZONAL_ONLY_RELATIVE_PATHS,
  isZonalOnlyPath,
  isFullReplaceOkPath,
  zonalAppComponentPath,
} from "./FileMutationPolicy.js";
import { resolveReactLayoutProfile } from "@/domain/generation/ReactLayoutProfile.js";

test("zonal registry lists toolchain files", () => {
  assert.ok(ZONAL_ONLY_RELATIVE_PATHS.includes("vite.config.ts"));
  assert.equal(isZonalOnlyPath("vite.config.ts"), true);
  assert.equal(isZonalOnlyPath("src/App.tsx"), false);
});

test("zonalAppComponentPath follows layout profile", () => {
  assert.equal(
    zonalAppComponentPath(resolveReactLayoutProfile("simple")),
    "src/App.tsx",
  );
  assert.equal(
    zonalAppComponentPath(resolveReactLayoutProfile("fsd")),
    "src/app/App.tsx",
  );
});

test("isFullReplaceOkPath allows registered prefixes and exact paths", () => {
  const simple = resolveReactLayoutProfile("simple");
  const fsd = resolveReactLayoutProfile("fsd");
  assert.equal(isFullReplaceOkPath("src/pages/home/index.ts", simple), true);
  assert.equal(isFullReplaceOkPath("src/shared/api/index.ts", fsd), true);
  assert.equal(isFullReplaceOkPath("src/router.tsx", simple), true);
  assert.equal(isFullReplaceOkPath("src/index.tsx", simple), true);
});

test("isFullReplaceOkPath rejects zonal toolchain paths and app shell", () => {
  const simple = resolveReactLayoutProfile("simple");
  const fsd = resolveReactLayoutProfile("fsd");
  assert.equal(isFullReplaceOkPath("vite.config.ts", simple), false);
  assert.equal(isFullReplaceOkPath("src/App.tsx", simple), false);
  assert.equal(isFullReplaceOkPath("src/app/App.tsx", fsd), false);
});

test("isFullReplaceOkPath returns false for undeclared paths", () => {
  assert.equal(
    isFullReplaceOkPath("src/experimental/Widget.tsx", resolveReactLayoutProfile("simple")),
    false,
  );
});
