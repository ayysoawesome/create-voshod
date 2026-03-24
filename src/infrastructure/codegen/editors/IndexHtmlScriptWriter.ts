/**
 * Rewrites Vite `index.html` module entry script `src` attribute.
 */
export class IndexHtmlScriptWriter {
  /**
   * Removes the default Vite favicon link to `/vite.svg` (file is pruned from `public/`).
   *
   * @param html Original index.html from scaffold or prior edits.
   * @returns HTML without that link tag.
   */
  static stripDefaultViteFaviconLink(html: string): string {
    return html.replace(
      /<link\s+[^>]*href=(["'])\/vite\.svg\1[^>]*\/?>\s*/i,
      "",
    );
  }

  /**
   * @param html Original index.html from scaffold or prior edits.
   * @param scriptSrc New script src, e.g. `/src/app/index.tsx`.
   * @returns Updated HTML.
   */
  static setModuleScriptSrc(html: string, scriptSrc: string): string {
    return html.replace(
      /<script\s+type="module"\s+src="[^"]*"\s*><\/script>/,
      `<script type="module" src="${scriptSrc}"></script>`,
    );
  }
}
