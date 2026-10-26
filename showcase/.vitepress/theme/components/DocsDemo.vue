<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue';

import { entries } from '../../../registry';
import { compileDemo } from './compileDemo';

/**
 * A registry demo is named by its component and position; a guide's `vue demo` fence passes its
 * code URI-encoded instead, so it survives being an attribute in the page's template.
 */
const props = defineProps<{ name?: string; index?: number; code?: string }>();

const demo = computed(() => {
  if (props.code !== undefined) return { code: decodeURIComponent(props.code) };
  const entry = entries.find((candidate) => candidate.name === props.name);
  const found = entry?.demos[props.index ?? 0];
  if (!found) throw new Error(`No demo ${props.index} for ${props.name}`);
  return found;
});

// Compiled once per demo rather than on every render, so flipping the theme does not recompile
// every template on the page.
const stage = computed(() => compileDemo(demo.value));

// A heading inside a demo belongs to the component shown, not to the page, so VitePress's
// "On this page" outline must skip it. It skips headings marked ignore-header.
const frame = ref<HTMLElement | null>(null);
const hideHeadingsFromOutline = () => {
  frame.value
    ?.querySelectorAll('h1, h2, h3, h4, h5, h6')
    .forEach((heading) => heading.classList.add('ignore-header'));
};
onMounted(hideHeadingsFromOutline);
onUpdated(hideHeadingsFromOutline);
</script>

<template>
  <div ref="frame" class="docs-demo vp-raw">
    <component :is="stage" />
  </div>
</template>

<style scoped>
.docs-demo {
  margin-block-start: var(--spacing-8);
  padding: var(--spacing-13) var(--spacing-11);
  border: 1px solid var(--vp-c-divider);
  border-start-start-radius: var(--radius-md);
  border-start-end-radius: var(--radius-md);
  background: var(--vp-c-bg);
  /* The page's prose styles (VitePress's .vp-doc) must not leak into the components shown. */
  font-size: var(--text-size-2);
  line-height: 1.5;
}

/*
 * The stage is compiled at runtime and carries no scope id, so a plain scoped rule can't reach
 * it. Some demos lay out content wider than the stage; contain that overflow here instead of
 * letting it widen the whole page.
 */
.docs-demo :deep(.showcase-demo-stage) {
  overflow-x: auto;
}

/* Edge to edge below 640px, like the code block VitePress runs to the screen's edges under it. */
@media (max-width: 639px) {
  .docs-demo {
    margin-inline: -24px;
    padding-inline: 24px;
    border-inline: 0;
    border-radius: 0;
  }
}
</style>
