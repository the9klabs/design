<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';

import DocsDirectionToggle from './components/DocsDirectionToggle.vue';
import DocsHeroNino from './components/DocsHeroNino.vue';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #nav-bar-content-after>
      <DocsDirectionToggle />
    </template>
    <template #home-hero-image>
      <DocsHeroNino />
    </template>
  </Layout>
</template>
