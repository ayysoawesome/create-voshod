import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLatestVersionFromRegistryBody } from "./updateChecker.js";

test("parseLatestVersionFromRegistryBody returns version on valid payload", () => {
  const version = parseLatestVersionFromRegistryBody('{"version":"1.2.3"}');
  assert.equal(version, "1.2.3");
});

test("parseLatestVersionFromRegistryBody returns null on missing version", () => {
  const version = parseLatestVersionFromRegistryBody('{"name":"pkg"}');
  assert.equal(version, null);
});

test("parseLatestVersionFromRegistryBody returns null on malformed payload", () => {
  const version = parseLatestVersionFromRegistryBody("not-json");
  assert.equal(version, null);
});

