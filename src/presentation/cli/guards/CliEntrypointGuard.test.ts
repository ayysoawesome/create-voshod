import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

test('run.ts does not import legacy core pipeline', () => {
  const runPath = path.resolve(process.cwd(), 'src', 'run.ts');
  const content = fs.readFileSync(runPath, 'utf8');
  assert.equal(content.includes('core/pipeline'), false);
});

function collectSourceFiles(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
      continue;
    }

    const isSourceFile =
      fullPath.endsWith('.ts') ||
      fullPath.endsWith('.tsx') ||
      fullPath.endsWith('.mts');
    const isTestFile =
      fullPath.endsWith('.test.ts') ||
      fullPath.endsWith('.test.tsx') ||
      fullPath.endsWith('.spec.ts') ||
      fullPath.endsWith('.spec.tsx');

    if (isSourceFile && !isTestFile) {
      files.push(fullPath);
    }
  }

  return files;
}

test('runtime source files do not import core modules', () => {
  const srcRoot = path.resolve(process.cwd(), 'src');
  const disallowedImports: string[] = [];

  for (const filePath of collectSourceFiles(srcRoot)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCoreImport =
      content.includes('"@/core/') ||
      content.includes("'@/core/") ||
      content.includes('"../core/') ||
      content.includes('"../../core/') ||
      content.includes('"../../../core/') ||
      content.includes("'../core/") ||
      content.includes("'../../core/") ||
      content.includes("'../../../core/");

    if (hasCoreImport) {
      const normalizedPath = path
        .relative(srcRoot, filePath)
        .replaceAll('\\', '/');
      disallowedImports.push(normalizedPath);
    }
  }

  assert.deepEqual(disallowedImports, []);
});

test("domain layer does not import prompts modules", () => {
  const domainRoot = path.resolve(process.cwd(), "src", "domain");
  const disallowedImports: string[] = [];

  for (const filePath of collectSourceFiles(domainRoot)) {
    const content = fs.readFileSync(filePath, "utf8");
    const hasPromptsImport =
      content.includes("/prompts/") ||
      content.includes('"../prompts/') ||
      content.includes('"../../prompts/') ||
      content.includes("'../prompts/") ||
      content.includes("'../../prompts/");

    if (hasPromptsImport) {
      const normalizedPath = path
        .relative(path.resolve(process.cwd(), "src"), filePath)
        .replaceAll("\\", "/");
      disallowedImports.push(normalizedPath);
    }
  }

  assert.deepEqual(disallowedImports, []);
});

