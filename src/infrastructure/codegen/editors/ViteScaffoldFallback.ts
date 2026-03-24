/**
 * Minimal `vite.config.ts` when scaffold ingest did not provide a file (tests / edge cases).
 * Matches the object-literal `defineConfig({ plugins: [...] })` shape required by `ViteConfigEditor` v1.
 */
export function minimalViteConfigFallback(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;
}
