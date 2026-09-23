<script setup lang="ts">
/**
 * The page column: the one measure the site chrome and every page section
 * share, so a section's heading, the brand in the bar and the footer's columns
 * all start on the same line.
 *
 * It sets only width and centring. Padding, backgrounds, flex and min-height
 * stay with the caller, so it can be a `<section>`, a `<main>` or the inner
 * box of the chrome without imposing a layout of its own. On a viewport
 * narrower than the column it keeps a gutter on each side.
 */
import type { Component } from 'vue';

import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    as?: string | Component;
    /** `md` is the site column, `sm` a reading column, `lg` a wide work area. */
    size?: I9kComponentSize;
  }>(),
  {
    as: 'div',
    size: 'md',
  },
);
</script>

<template>
  <component :is="as" :class="['i9k-container', `i9k-container--${size}`]">
    <slot />
  </component>
</template>

<style scoped>
/* The measure is exact once the viewport allows it, and the gutter is what is
   left when it does not. The gutter is a margin, not padding, so the column's
   own edge is where content starts and a `width: 100%` child fills exactly the
   column; a background belongs on the element around the container. */
.i9k-container {
  --i9k-container-width: var(--container-width-md);
  --i9k-container-gutter: var(--container-gutter);

  width: min(100% - 2 * var(--i9k-container-gutter), var(--i9k-container-width));
  margin-inline: auto;
}

.i9k-container--sm {
  --i9k-container-width: var(--container-width-sm);
}

.i9k-container--lg {
  --i9k-container-width: var(--container-width-lg);
}

@media (max-width: 768px) {
  .i9k-container {
    --i9k-container-gutter: var(--spacing-8);
  }
}
</style>
