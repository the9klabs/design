/**
 * Canonical origin for the published showcase.
 *
 * `wrangler.jsonc` deploys this site to the Cloudflare Pages project
 * `9k-design-system`, which serves it on the custom domain below rather than on
 * its default `*.pages.dev` hostname.
 *
 * This is the only place the origin is written in code. Change it here and
 * nothing else: `sitemap.xml`, canonical links and `llms.txt` are generated
 * from it, and the two static files that cannot import it are held in step by
 * tests. `showcaseSitemap.test.ts` checks the `Sitemap:` line in
 * `showcase/pages/public/robots.txt`, and `showcaseLinkHeaders.test.ts` checks the
 * `rel="canonical"` target in `showcase/pages/public/_headers`.
 *
 * No trailing slash; every path supplies its own leading one.
 */
export const SITE_URL = 'https://design.the9klabs.com';

export const REPOSITORY_URL = 'https://github.com/the9klabs/design';

/** Where a component's source can be read, for the "View source" link on its page. */
export const sourceUrl = (name: string): string =>
  `${REPOSITORY_URL}/blob/main/src/components/${name}.vue`;

/**
 * The machine-readable files the VitePress build writes beside the pages. They are
 * non-HTML, which the sitemap protocol permits and which is the point: they are
 * what agent crawlers should find.
 */
export const MACHINE_PATHS = ['/llms.txt', '/llms-full.txt', '/components.json'] as const;

/**
 * Every URL the sitemap lists, in order: each HTML page, then the machine
 * files. The Markdown twins are left out; each page links its own through
 * `rel="alternate"`, and they are alternates of a listed page, not content of
 * their own.
 *
 * `robots.txt` and `sitemap.xml` are deliberately absent. A sitemap never lists
 * itself, and robots.txt is a crawl directive rather than content.
 */
export const sitePaths = (pagePaths: string[]): string[] => [...pagePaths, ...MACHINE_PATHS];
