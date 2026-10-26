import { readFileSync } from 'node:fs';

import type { ColorTokens } from '../extract/types';
import { guideFile, readFrontMatter, type Catalog, type CatalogPage } from './catalog';
import { componentList, componentMarkdown, guideMarkdown, llmsTxt } from './markdown';

/** The Markdown twin of one page, as served at its URL plus `.md`. */
export const twinOf = (page: CatalogPage, catalog: Catalog, colorTokens: ColorTokens): string => {
  const context = { colorTokens, components: catalog.components };
  switch (page.kind) {
    case 'component':
      return componentMarkdown(page.component!);
    case 'guide':
      return guideMarkdown(
        page,
        readFrontMatter(readFileSync(guideFile(page.path), 'utf8')).body,
        context,
      );
    case 'components':
      return `# ${page.title}\n\n> ${page.description}\n\n${componentList(catalog.components)}\n`;
    case 'home':
      // The overview an agent wants is the index of everything else.
      return llmsTxt(catalog.sidebar);
  }
};

/** Every page's twin, in reading order. */
export const allTwins = (catalog: Catalog, colorTokens: ColorTokens) =>
  catalog.pages.map((page) => ({ path: page.path, markdown: twinOf(page, catalog, colorTokens) }));
