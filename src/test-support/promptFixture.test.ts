import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLI_MATRIX_COMBINATION_COUNT,
  cliOptionsToInjectedAnswers,
  enumerateCliMatrixOptionBundles,
  iterateLibPowerset,
  mergeCliMatrixBundle,
} from "./promptFixture.js";

test("injected answers length matches PromptService.askOptions field count", () => {
  const options = mergeCliMatrixBundle(
    enumerateCliMatrixOptionBundles()[0],
    "probe",
  );
  assert.equal(cliOptionsToInjectedAnswers(options).length, 9);
});

test("lib powerset size is 2^n for n additional-library prompt choices", () => {
  assert.equal(iterateLibPowerset().length, 1 << 3);
});

test("enumerateCliMatrixOptionBundles count matches constant", () => {
  const bundles = enumerateCliMatrixOptionBundles();
  assert.equal(bundles.length, CLI_MATRIX_COMBINATION_COUNT);
});
