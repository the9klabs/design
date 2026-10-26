<script setup lang="ts">
import { useData } from 'vitepress';

import { I9kBrandWordmark, I9kFooter, I9kNinoSky, type I9kFooterColumn } from '../../../../src';
import { MACHINE_PATHS, REPOSITORY_URL } from '../../../site/config';

// The landing page's footer, modelled on 9k.school's and ismail9k.com's: the
// wordmark, a tagline, the copyright and link columns, then Nino's night sky
// as a full-bleed band. The tagline and copyright are the theme's footer
// strings, so the year is the build's and never mismatches on hydration.
const { theme } = useData();

const columns: I9kFooterColumn[] = [
  {
    id: 'docs',
    title: 'Docs',
    links: [
      { id: 'installation', label: 'Getting started', href: '/getting-started/installation' },
      { id: 'foundations', label: 'Foundations', href: '/foundations/tokens' },
      { id: 'components', label: 'Components', href: '/components' },
      { id: 'guides', label: 'Guides', href: '/guides/notifications-and-dialogs' },
    ],
  },
  {
    id: 'agents',
    title: 'For agents',
    links: [
      { id: 'ai-agents', label: 'Using the docs with AI', href: '/getting-started/ai-agents' },
      // Static files beside the pages, not routes, so they open in a new tab
      // as the navigation's llms.txt link does.
      ...MACHINE_PATHS.map((path) => ({
        id: path,
        label: path.slice(1),
        href: path,
        external: true,
      })),
    ],
  },
  {
    id: 'more',
    title: 'More from 9k',
    links: [
      { id: '9k-school', label: '9k School', href: 'https://9k.school', external: true },
      { id: 'ismail9k', label: 'ismail9k.com', href: 'https://ismail9k.com', external: true },
      { id: '9klabs', label: '9kLabs', href: 'https://the9klabs.com/', external: true },
      { id: 'github', label: 'GitHub', href: REPOSITORY_URL, external: true },
    ],
  },
];
</script>

<template>
  <div class="docs-footer">
    <I9kFooter
      :columns="columns"
      :tagline="theme.footer?.message"
      :copyright="theme.footer?.copyright"
      brand-label="9k design home"
      nav-label="Footer"
    >
      <template #brand>
        <I9kBrandWordmark full="9k design" short="9k" />
      </template>
    </I9kFooter>
    <I9kNinoSky boop-label="Say hi to Nino" />
  </div>
</template>

<style scoped>
/* VitePress's home content ends flush with its last feature card. */
.docs-footer {
  margin-block-start: var(--spacing-15);
}
</style>
