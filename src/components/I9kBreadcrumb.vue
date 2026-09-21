<script setup lang="ts">
import { computed } from 'vue';

import type { I9kBreadcrumbItem } from '../types/components';

const props = withDefaults(
  defineProps<{
    items: I9kBreadcrumbItem[];
    label?: string;
    linkComponent?: string | object | null;
  }>(),
  { label: 'Breadcrumb', linkComponent: null },
);

const tag = computed(() => props.linkComponent ?? 'a');
const lastIndex = computed(() => props.items.length - 1);
</script>

<template>
  <nav class="i9k-breadcrumb" :aria-label="label">
    <ol class="i9k-breadcrumb__list">
      <li v-for="(item, index) in items" :key="item.id" class="i9k-breadcrumb__item">
        <component
          :is="tag"
          v-if="index < lastIndex && item.href"
          class="i9k-breadcrumb__link"
          :to="linkComponent ? item.href : undefined"
          :href="linkComponent ? undefined : item.href"
          :title="item.label"
        >
          {{ item.label }}
        </component>
        <span
          v-else
          class="i9k-breadcrumb__text"
          :aria-current="index === lastIndex ? 'page' : undefined"
          :title="item.label"
        >
          {{ item.label }}
        </span>
        <span v-if="index < lastIndex" class="i9k-breadcrumb__separator" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.i9k-breadcrumb {
  min-width: 0;
}

.i9k-breadcrumb__list {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.i9k-breadcrumb__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.i9k-breadcrumb__link,
.i9k-breadcrumb__text {
  overflow: hidden;
  max-inline-size: 28ch;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.i9k-breadcrumb__link {
  border-radius: var(--radius-sm);
  color: var(--text-color-light);
  text-decoration: none;
  transition: color 160ms ease;
}

.i9k-breadcrumb__link:hover {
  color: var(--primary-text-color);
}

.i9k-breadcrumb__link:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

.i9k-breadcrumb__text[aria-current='page'] {
  color: var(--text-color);
  font-weight: 600;
}

.i9k-breadcrumb__separator {
  flex: none;
  color: var(--text-color-light);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-breadcrumb__link {
    transition: none;
  }
}
</style>
