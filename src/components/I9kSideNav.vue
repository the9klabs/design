<script setup lang="ts">
import { computed } from 'vue';

import type { I9kSideNavLink } from '../types/components';

/**
 * A vertical list of section links for an app's sidebar (I9kSidebarLayout's
 * `sidebar` slot). The caller decides which link is current, because only it
 * knows its routes; the current link carries aria-current="page", which is
 * also what I9kSidebarLayout reads to scroll it into view.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    links: I9kSideNavLink[];
    linkComponent?: string | object | null;
  }>(),
  { linkComponent: null },
);

const tag = computed(() => props.linkComponent ?? 'a');
</script>

<template>
  <nav class="i9k-side-nav" :aria-label="label">
    <ul class="i9k-side-nav__list">
      <li v-for="link in links" :key="link.id">
        <component
          :is="tag"
          class="i9k-side-nav__link"
          v-bind="linkComponent ? { to: link.href } : { href: link.href }"
          :aria-current="link.current ? 'page' : undefined"
        >
          {{ link.label }}
        </component>
      </li>
    </ul>
    <div v-if="$slots.footer" class="i9k-side-nav__footer">
      <slot name="footer" />
    </div>
  </nav>
</template>

<style scoped>
.i9k-side-nav {
  display: grid;
  gap: var(--spacing-8);
}

.i9k-side-nav__list {
  display: grid;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.i9k-side-nav__link {
  display: block;
  padding: var(--spacing-3) var(--spacing-4);
  border-inline-start: 3px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-color-light);
  text-decoration: none;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.i9k-side-nav__link:hover {
  background: var(--theme-bg-color);
  color: var(--text-color);
}

.i9k-side-nav__link:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}

.i9k-side-nav__link[aria-current='page'] {
  border-inline-start-color: var(--primary-color);
  background: var(--theme-bg-color);
  color: var(--primary-text-color);
  font-weight: 600;
}

.i9k-side-nav__footer {
  padding-inline: var(--spacing-4);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-side-nav__link {
    transition: none;
  }
}
</style>
