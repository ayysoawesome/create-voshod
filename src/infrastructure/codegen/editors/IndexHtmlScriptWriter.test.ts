import { test } from "node:test";
import assert from "node:assert/strict";
import { IndexHtmlScriptWriter } from "./IndexHtmlScriptWriter.js";

test("stripDefaultViteFaviconLink removes Vite default icon link", () => {
  const html = `<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <title>x</title>
  </head>`;
  const out = IndexHtmlScriptWriter.stripDefaultViteFaviconLink(html);
  assert.equal(out.includes("vite.svg"), false);
  assert.equal(out.includes("<title>x</title>"), true);
});

test("stripDefaultViteFaviconLink accepts single-quoted href", () => {
  const html = `<link rel='icon' href='/vite.svg' />`;
  assert.equal(IndexHtmlScriptWriter.stripDefaultViteFaviconLink(html).includes("vite.svg"), false);
});
