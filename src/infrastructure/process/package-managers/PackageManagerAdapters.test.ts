import { test } from "node:test";
import assert from "node:assert/strict";
import { NpmAdapter } from "./NpmAdapter.js";
import { BunAdapter } from "./BunAdapter.js";
import { PnpmAdapter } from "./PnpmAdapter.js";
import { YarnAdapter } from "./YarnAdapter.js";

test("PnpmAdapter passes create-vite options without `--` terminator", () => {
  const args = new PnpmAdapter().createProjectArgs("demo", "react-ts");
  // `--` would stop create-vite option parsing (it would ignore --template and ask interactively).
  assert.equal(args.includes("--"), false);
  assert.deepEqual(args.slice(0, 3), ["dlx", "create-vite@latest", "demo"]);
  assert.ok(args.includes("--template"));
  assert.ok(args.includes("react-ts"));
});

test("NpmAdapter uses npm create with args separator", () => {
  const args = new NpmAdapter().createProjectArgs("demo", "react-ts");
  assert.deepEqual(args.slice(0, 3), ["create", "vite@latest", "demo"]);
  assert.ok(args.includes("--"));
  assert.ok(args.includes("--template"));
  assert.ok(args.includes("react-ts"));
});

test("BunAdapter passes create-vite options without `--` terminator", () => {
  const args = new BunAdapter().createProjectArgs("demo", "react-ts");
  assert.equal(args.includes("--"), false);
  assert.deepEqual(args.slice(0, 3), ["create", "vite@latest", "demo"]);
  assert.ok(args.includes("--template"));
  assert.ok(args.includes("react-ts"));
});

test("YarnAdapter passes template without args separator", () => {
  const args = new YarnAdapter().createProjectArgs("demo", "react-ts");
  assert.deepEqual(args.slice(0, 3), ["create", "vite", "demo"]);
  assert.equal(args.includes("--"), false);
  assert.ok(args.includes("--template"));
  assert.ok(args.includes("react-ts"));
});

