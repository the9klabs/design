const APP_MARKER = '<!--app-html-->';

export interface RenderedApp {
  html: string;
  /** Teleported markup keyed by target selector, as renderToString collects it. */
  teleports: Record<string, string>;
}

/**
 * Fills the built `index.html` shell with the server-rendered app.
 *
 * Teleported content is not part of the app HTML, so it has to be placed where hydration will
 * look for it. Vue hydrates a `<body>` teleport from `body.firstChild`, so that markup must open
 * the body with nothing before it, not even whitespace — otherwise hydration claims `#app` as
 * teleport content and replaces the whole page. Nuxt prepends body teleports the same way. Any
 * other target would need its own placement, so it fails the build instead of shipping a page
 * that breaks on hydration.
 */
export const buildPage = (shell: string, { html, teleports }: RenderedApp): string => {
  if (!shell.includes(APP_MARKER)) {
    throw new Error(`The showcase shell lost its ${APP_MARKER} marker`);
  }

  const unplaced = Object.keys(teleports).filter((target) => target !== 'body');
  if (unplaced.length) {
    throw new Error(`The showcase shell has no place for teleports to ${unplaced.join(', ')}`);
  }

  // Function replacers, so `$&`-style sequences in rendered markup stay literal.
  return shell
    .replace(APP_MARKER, () => html)
    .replace(/<body[^>]*>/, (tag) => tag + (teleports.body ?? ''));
};
