import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';

import { extractComponent } from '../extract/props';
import { extractColorTokens } from '../extract/tokens';
import { mergeRegistry } from '../registry/merge';
import type { ShowcaseComponent, ShowcaseEntry } from '../registry/types';
import { COMPONENT_SECTIONS, componentPath, GUIDE_GROUPS } from './pages';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PAGES_DIR = resolve(repositoryRoot, 'showcase/pages');

/** One page of the site, as the sidebar, the twins, llms.txt and the sitemap all see it. */
export interface CatalogPage {
  path: string;
  title: string;
  /** The sidebar label, when shorter than the title. */
  navTitle: string;
  description: string;
  groupTitle: string;
  kind: 'home' | 'guide' | 'components' | 'component';
  /** Set for component pages. */
  component?: ShowcaseComponent;
}

export interface Catalog {
  components: ShowcaseComponent[];
  /** Every page in sidebar order, which is also reading order. */
  pages: CatalogPage[];
  sidebar: { title: string; pages: CatalogPage[] }[];
}

/**
 * Loads the registry through Vite, because its entries are TypeScript and one of them imports
 * `.vue` files for a demo that renders a component of its own. The server lives only as long as
 * the load.
 */
const loadEntries = async (): Promise<ShowcaseEntry[]> => {
  const server = await createServer({
    configFile: false,
    root: repositoryRoot,
    logLevel: 'error',
    appType: 'custom',
    plugins: [vue()],
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const registry = await server.ssrLoadModule('/showcase/registry/index.ts');
    return registry.entries as ShowcaseEntry[];
  } finally {
    await server.close();
  }
};

/** The flat `key: value` front matter a page opens with, and the body after it. */
export const readFrontMatter = (
  source: string,
): { fields: Record<string, string>; body: string } => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source.replace(/\r\n/g, '\n'));
  if (!match) return { fields: {}, body: source };

  const fields: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':');
    if (separator < 1 || /^\s/.test(line)) continue;
    fields[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
  }
  return { fields, body: source.replace(/\r\n/g, '\n').slice(match[0].length) };
};

/** The Markdown file behind a prose page. */
export const guideFile = (path: string): string => resolve(PAGES_DIR, `${path.slice(1)}.md`);

const guidePage = (path: string, groupTitle: string): CatalogPage => {
  const { fields } = readFrontMatter(readFileSync(guideFile(path), 'utf8'));
  if (!fields.title || !fields.description) {
    throw new Error(`${guideFile(path)} needs a title and a description in its front matter`);
  }
  return {
    path,
    title: fields.title,
    navTitle: fields.navTitle ?? fields.title,
    description: fields.description,
    groupTitle,
    kind: 'guide',
  };
};

export const HOME_DESCRIPTION =
  'Vue 3 components, design tokens and guidance for the 9k products, with live demos, an API reference read from source, and every page in Markdown for agents.';

const buildCatalog = (components: ShowcaseComponent[]): Catalog => {
  const home: CatalogPage = {
    path: '/',
    title: '9k Design System',
    navTitle: 'Overview',
    description: HOME_DESCRIPTION,
    groupTitle: 'Getting started',
    kind: 'home',
  };

  const sidebar = [
    ...GUIDE_GROUPS.map((group) => ({
      title: group.title,
      pages: [
        ...(group.id === 'getting-started' ? [home] : []),
        ...group.paths.map((path) => guidePage(path, group.title)),
      ],
    })),
    {
      title: 'Components',
      pages: [
        {
          path: '/components',
          title: 'Components',
          navTitle: 'All components',
          description: `Every one of the ${components.length} components in @9klabs/design, by purpose.`,
          groupTitle: 'Components',
          kind: 'components' as const,
        },
      ],
    },
    ...COMPONENT_SECTIONS.map((section) => ({
      title: section.title,
      pages: components
        .filter((component) => component.section === section.id)
        .map((component) => ({
          path: componentPath(component.name),
          title: component.name,
          navTitle: component.name.replace(/^I9k/, ''),
          description: component.summary,
          groupTitle: section.title,
          kind: 'component' as const,
          component,
        })),
    })),
  ].filter((group) => group.pages.length);

  const pages = sidebar.flatMap((group) => group.pages);
  const seen = new Set<string>();
  for (const page of pages) {
    if (seen.has(page.path)) throw new Error(`Two pages share the path ${page.path}`);
    seen.add(page.path);
  }

  return { components, pages, sidebar };
};

let pending: Promise<Catalog> | undefined;

/** The whole site, loaded once per process: the config, the route loader and the build share it. */
export const loadCatalog = (): Promise<Catalog> => {
  pending ??= loadEntries().then(catalogFrom);
  return pending;
};

/** Builds the catalog from entries already in hand, for tests that load the registry themselves. */
export const catalogFrom = (entries: ShowcaseEntry[]): Catalog =>
  buildCatalog(
    mergeRegistry(
      entries,
      entries.map((entry) =>
        extractComponent(resolve(repositoryRoot, `src/components/${entry.name}.vue`)),
      ),
    ),
  );

export const loadColorTokens = () =>
  extractColorTokens(resolve(repositoryRoot, 'src/styles/tokens.css'));
