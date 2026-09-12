import { extracted } from 'virtual:showcase-data';
import { createSSRApp } from 'vue';
import { renderToString, type SSRContext } from '@vue/server-renderer';

import { buildLlmsTxt, buildManifest } from './manifest';
import type { RenderedApp } from './page';
import { buildSitemap } from './sitemap';
import ShowcaseApp from './ShowcaseApp.vue';
import { entries } from './registry';
import { mergeRegistry } from './registry/merge';

export { buildPage } from './page';

// Teleported markup is collected in the context, not the returned HTML; buildPage places it.
export const render = async (): Promise<RenderedApp> => {
  const context: SSRContext = {};
  const html = await renderToString(createSSRApp(ShowcaseApp), context);
  return { html, teleports: context.teleports ?? {} };
};

export const artifacts = (version: string, lastmod: string) => {
  const manifest = buildManifest(mergeRegistry(entries, extracted), version);
  return { manifest, llmsTxt: buildLlmsTxt(manifest), sitemap: buildSitemap(lastmod) };
};
