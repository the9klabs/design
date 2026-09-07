<script setup lang="ts">
import type { Component } from 'vue';

import type { I9kComponentSize, I9kPanelVariant } from '../types/components';

withDefaults(
  defineProps<{
    as?: string | Component;
    size?: I9kComponentSize;
    variant?: I9kPanelVariant;
  }>(),
  {
    as: 'div',
    size: 'md',
    variant: 'default',
  },
);
</script>

<template>
  <component :is="as" :class="['i9k-panel', `i9k-panel--${variant}`, `i9k-panel--${size}`]">
    <slot />
  </component>
</template>

<style scoped>
.i9k-panel {
  --i9k-panel-padding: var(--spacing-13);
  --i9k-panel-radius: var(--radius-md);

  padding: var(--i9k-panel-padding);
  border: 1px solid var(--border-color);
  border-radius: var(--i9k-panel-radius);
  background: var(--surface-color);
  backdrop-filter: none;
  transition: var(--transition);
}

.i9k-panel--sm {
  --i9k-panel-padding: var(--spacing-8);
  --i9k-panel-radius: var(--radius-sm);
}

.i9k-panel--lg {
  --i9k-panel-padding: var(--spacing-18);
  --i9k-panel-radius: var(--radius-lg);
}

.i9k-panel--feature {
  border-color: color-mix(in srgb, var(--accent-color) 46%, var(--border-color));
  border-radius: var(--radius-lg);
  background: var(--surface-raised-color);
  box-shadow: var(--shadow-sm);
}

.i9k-panel--flat {
  border: none;
  background: none;
  backdrop-filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-panel {
    transition: none;
  }
}
</style>
