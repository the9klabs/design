<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { computed, ref } from 'vue';

import { sourceUrl } from '../../../site/config';

const props = defineProps<{ name?: string }>();
const { page } = useData();

const markdownUrl = computed(() => {
  const path = `/${page.value.relativePath}`.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
  return withBase(path === '/' ? '/index.md' : `${path.replace(/\/$/, '')}.md`);
});

const state = ref<'idle' | 'copied' | 'failed'>('idle');
const copy = async () => {
  try {
    const response = await fetch(markdownUrl.value);
    if (!response.ok) throw new Error(String(response.status));
    await navigator.clipboard.writeText(await response.text());
    state.value = 'copied';
  } catch {
    state.value = 'failed';
  }
  setTimeout(() => (state.value = 'idle'), 2000);
};
</script>

<template>
  <div class="docs-actions">
    <button type="button" class="docs-actions__button" @click="copy">
      <span aria-live="polite">{{
        state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy page as Markdown'
      }}</span>
    </button>
    <a class="docs-actions__button" :href="markdownUrl" target="_blank">View as Markdown</a>
    <a
      v-if="props.name"
      class="docs-actions__button"
      :href="sourceUrl(props.name)"
      target="_blank"
      rel="noopener"
      >View source</a
    >
  </div>
</template>

<style scoped>
.docs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin-block: var(--spacing-8) var(--spacing-11);
}

.docs-actions__button {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--control-height-sm);
  padding-inline: var(--spacing-8);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-sm);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: var(--control-font-size-sm);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: var(--transition);
}

.docs-actions__button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
