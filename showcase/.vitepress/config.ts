import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { Plugin } from 'vite';
import { defineConfig, postcssIsolateStyles, type DefaultTheme, type HeadConfig } from 'vitepress';

import { buildManifest } from '../manifest';
import { loadCatalog, loadColorTokens, type Catalog } from '../site/catalog';
import { MACHINE_PATHS, REPOSITORY_URL, SITE_URL, sitePaths } from '../site/config';
import { llmsFullTxt, llmsTxt } from '../site/markdown';
import { markdownPath, pathOfMarkdown } from '../site/pages';
import { allTwins } from '../site/twins';
import { buildSitemap } from '../sitemap';
import { showcaseData } from '../vite-plugin-data';

const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as {
  version: string;
};

/** A page's URL from its source file: `foundations/theming.md` is `/foundations/theming`. */
const pathOfFile = (relativePath: string): string =>
  `/${relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`.replace(/\/$/, '') ||
  '/';

/**
 * `lastmod` should say when the content changed, not when the build ran, so it comes from the
 * last commit: rebuilding the same commit yields a byte-identical sitemap. Falls back to now when
 * git isn't available (a tarball export, a non-repo checkout).
 */
const lastCommitDate = (): string => {
  try {
    const committed = execFileSync('git', ['log', '-1', '--format=%cI'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (committed) return committed;
  } catch {
    // fall through
  }
  return new Date().toISOString();
};

/** Every machine-readable file, keyed by the URL it is served at. */
const machineFiles = (catalog: Catalog): Map<string, { body: string; type: string }> => {
  const colorTokens = loadColorTokens();
  const twins = allTwins(catalog, colorTokens);
  const files = new Map<string, { body: string; type: string }>();
  for (const twin of twins) {
    files.set(markdownPath(twin.path), { body: twin.markdown, type: 'text/markdown' });
  }
  files.set('/llms.txt', { body: llmsTxt(catalog.sidebar), type: 'text/plain' });
  files.set('/llms-full.txt', {
    body: llmsFullTxt(twins.filter((twin) => twin.path !== '/')),
    type: 'text/plain',
  });
  files.set('/components.json', {
    body: JSON.stringify(buildManifest(catalog.components, version), null, 2),
    type: 'application/json',
  });
  return files;
};

/** Serves the twins and the machine files in dev, where the build has not written them. */
const machineFilesInDev = (): Plugin => ({
  name: 'docs-machine-files',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = request.url ?? '';
      // In dev, VitePress loads each page as a module from the same `.md` URL its twin has. A
      // module request is a script fetch, or carries a query; a reader or `fetch()` is neither.
      const isModule = url.includes('?') || request.headers['sec-fetch-dest'] === 'script';
      const isMachine = url.endsWith('.md') || (MACHINE_PATHS as readonly string[]).includes(url);
      if (isModule || !isMachine) return next();
      const catalog = await loadCatalog();
      const file =
        machineFiles(catalog).get(url) ??
        // A twin the catalog has no page for falls through to VitePress's 404.
        undefined;
      if (!file) return next();
      response.setHeader('Content-Type', `${file.type}; charset=utf-8`);
      response.end(file.body);
    });
  },
});

const sidebarOf = (catalog: Catalog): DefaultTheme.SidebarItem[] =>
  catalog.sidebar.map((group) => ({
    text: group.title,
    collapsed: false,
    items: group.pages.map((page) => ({ text: page.navTitle, link: page.path })),
  }));

export default async () => {
  const catalog = await loadCatalog();
  const byPath = new Map(catalog.pages.map((page) => [page.path, page]));

  return defineConfig({
    srcDir: 'pages',
    outDir: '../showcase-dist',
    cleanUrls: true,
    lang: 'en-US',
    title: '9k Design System',
    description:
      'Vue 3 components, tokens and guidance for the 9k products, with live demos and Markdown for agents.',
    appearance: true,
    lastUpdated: false,

    head: [['meta', { name: 'theme-color', content: '#166434' }]],

    themeConfig: {
      siteTitle: '9k design',
      nav: [
        {
          text: 'Getting started',
          link: '/getting-started/installation',
          activeMatch: '^/getting-started/',
        },
        { text: 'Foundations', link: '/foundations/tokens', activeMatch: '^/foundations/' },
        { text: 'Components', link: '/components', activeMatch: '^/components' },
        { text: 'Guides', link: '/guides/notifications-and-dialogs', activeMatch: '^/guides/' },
        { text: 'llms.txt', link: '/llms.txt', target: '_blank' },
      ],
      sidebar: sidebarOf(catalog),
      outline: { level: [2, 3], label: 'On this page' },
      search: { provider: 'local' },
      socialLinks: [{ icon: 'github', link: REPOSITORY_URL, ariaLabel: 'Source on GitHub' }],
      editLink: {
        // VitePress serialises this function into the client bundle, so it cannot close over
        // anything: the repository URL is written out here rather than read from config.ts.
        pattern: ({ filePath, params }) =>
          params?.name
            ? `https://github.com/the9klabs/design/edit/main/showcase/registry/${params.name}.ts`
            : `https://github.com/the9klabs/design/edit/main/showcase/pages/${filePath}`,
        text: 'Edit this page on GitHub',
      },
      docFooter: { prev: 'Previous', next: 'Next' },
      // DocsFooter shows these on the landing page, which hides VitePress's own footer.
      footer: {
        message: 'Made with love 💚, caffeine, and Claude Code. Built with @9klabs/design itself.',
        copyright: `© ${new Date().getFullYear()} 9kLabs · MIT License`,
      },
    },

    markdown: {
      theme: { light: 'github-light', dark: 'github-dark' },
      config: (md) => {
        // ```vue demo renders the code live above an ordinary code block of the same code.
        const fence = md.renderer.rules.fence!;
        md.renderer.rules.fence = (tokens, index, options, env, self) => {
          const token = tokens[index];
          const demo = /^(\w+)\s+demo\b/.exec(token.info.trim());
          if (!demo) return fence(tokens, index, options, env, self);
          token.info = demo[1];
          const code = encodeURIComponent(token.content.replace(/\n$/, ''));
          return `<DocsDemo code="${code}" />\n${fence(tokens, index, options, env, self)}`;
        };
      },
    },

    transformPageData(pageData) {
      const page = byPath.get(pathOfFile(pageData.relativePath));
      if (page?.kind === 'component') {
        pageData.title = page.title;
        pageData.description = page.description;
      }
    },

    transformHead({ pageData }): HeadConfig[] {
      const path = pathOfFile(pageData.relativePath);
      if (!byPath.has(path)) return [];
      return [
        ['link', { rel: 'canonical', href: `${SITE_URL}${path === '/' ? '/' : path}` }],
        ['link', { rel: 'alternate', type: 'text/markdown', href: markdownPath(path) }],
      ];
    },

    async buildEnd(siteConfig) {
      const files = machineFiles(catalog);
      files.set('/sitemap.xml', {
        body: buildSitemap(sitePaths(catalog.pages.map((page) => page.path)), lastCommitDate()),
        type: 'application/xml',
      });
      await Promise.all(
        [...files].map(async ([url, { body }]) => {
          const target = resolve(siteConfig.outDir, `.${url}`);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, body);
        }),
      );
      // Pages and twins must stay one to one; a twin for a page that does not exist is a bug.
      for (const url of files.keys()) {
        if (url.endsWith('.md') && !byPath.has(pathOfMarkdown(url))) {
          throw new Error(`Wrote ${url}, but there is no page at ${pathOfMarkdown(url)}`);
        }
      }
      console.log(`Wrote ${files.size} machine-readable files for ${catalog.pages.length} pages.`);
    },

    vite: {
      plugins: [showcaseData() as never, machineFilesInDev() as never],
      // Read by vite-plugin-data with paths relative to the repository root.
      server: { fs: { allow: [resolve('.')] } },
      // Live demos and widgets sit in `.vp-raw`, which keeps VitePress's prose styles (a border
      // over every h2, list bullets, link colors) off the components; the class only works with
      // this plugin rewriting the theme's doc stylesheet.
      css: { postcss: { plugins: [postcssIsolateStyles({ includeFiles: [/vp-doc\.css/] })] } },
    },
  });
};
