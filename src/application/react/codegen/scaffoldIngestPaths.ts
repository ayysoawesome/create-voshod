/**
 * Files created by official Vite scaffold that should be loaded into the composer
 * before zonal patches (see `FileMutationPolicy`).
 */
export const SCAFFOLD_INGEST_RELATIVE_PATHS = [
  "package.json",
  "vite.config.ts",
  "tsconfig.app.json",
  "index.html",
] as const;

export type ScaffoldIngestRelativePath = (typeof SCAFFOLD_INGEST_RELATIVE_PATHS)[number];
