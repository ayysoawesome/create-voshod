import type { ReactLayoutProfile } from "@/domain/generation/index.js";
import type { ICodeComposer } from "@/domain/ports/index.js";
import type { Styling } from "@/domain/generation/ProjectOptions.js";

/**
 * Writes `variables.css`, `utility.css`, `animation.css`, and `index.css` under the profile styles directory.
 * Router patches must not touch these paths.
 *
 * @param composer Target composer.
 * @param profile Layout profile (selects `src/styles` vs `src/app/styles`).
 * @param styling Selected styling preset.
 */
export function writeAppStyleTree(
  composer: ICodeComposer,
  profile: ReactLayoutProfile,
  styling: Styling,
): void {
  const base = profile.stylesDirectory;
  composer.upsertFile(
    `${base}/variables.css`,
    `:root {
  /* Design tokens — extend as needed */
}
`,
  );
  composer.upsertFile(
    `${base}/utility.css`,
    `/* Shared utility classes (non-Tailwind) */
`,
  );
  composer.upsertFile(
    `${base}/animation.css`,
    `/* Keyframes and motion tokens */
`,
  );

  if (styling === "tailwind") {
    composer.upsertFile(
      `${base}/index.css`,
      `@import "tailwindcss";
@import "./variables.css";
@import "./utility.css";
@import "./animation.css";
`,
    );
    return;
  }

  composer.upsertFile(
    `${base}/index.css`,
    `@import "./variables.css";
@import "./utility.css";
@import "./animation.css";

:root {
  font-family: Inter, system-ui, -apple-system, sans-serif;
}
`,
  );
}
