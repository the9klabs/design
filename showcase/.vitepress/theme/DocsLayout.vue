<script setup lang="ts">
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import DocsFooter from './components/DocsFooter.vue';
import DocsHeroNino from './components/DocsHeroNino.vue';

const { Layout } = DefaultTheme;
const { frontmatter } = useData();
</script>

<template>
  <Layout>
    <template #home-hero-image>
      <DocsHeroNino />
    </template>
    <!-- Outside VitePress's content box, so Nino's sky can span the window. -->
    <template #layout-bottom>
      <DocsFooter v-if="frontmatter.layout === 'home'" />
    </template>
  </Layout>
</template>
