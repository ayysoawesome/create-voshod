import assert from "node:assert/strict";
import { test } from "node:test";
import { ALL_ADDITIONAL_LIBRARY_IDS } from "@/domain/generation/frameworkCapabilityCatalog.js";
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
  assert.equal(cliOptionsToInjectedAnswers(options).length, 11);
});

test("lib powerset size is 2^n for n additional-library prompt choices", () => {
  const n = ALL_ADDITIONAL_LIBRARY_IDS.length;
  assert.equal(iterateLibPowerset().length, 1 << n);
});

test("enumerateCliMatrixOptionBundles count matches constant", () => {
  const bundles = enumerateCliMatrixOptionBundles();
  assert.equal(bundles.length, CLI_MATRIX_COMBINATION_COUNT);
});
