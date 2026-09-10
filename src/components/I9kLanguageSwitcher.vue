<script setup lang="ts">
import { computed } from 'vue';

import I9kIcon from './I9kIcon.vue';

const props = withDefaults(
  defineProps<{
    label: string;
    href: string;
    code?: string | null;
    hreflang?: string | null;
    linkComponent?: string | object | null;
  }>(),
  { code: null, hreflang: null, linkComponent: null },
);
const tag = computed(() => props.linkComponent ?? 'a');
// Latin codes read as "EN"/"AR"; toUpperCase leaves Arabic script untouched, so
// a caller may pass "ع" instead and get it back verbatim.
const displayCode = computed(() => props.code?.toUpperCase() ?? null);
</script>
<template>
  <component
    :is="tag"
    class="language-switcher i9k-language-switcher"
    :class="{ 'i9k-language-switcher--icon': displayCode }"
    :to="linkComponent ? href : undefined"
    :href="!linkComponent ? href : undefined"
    :hreflang="hreflang ?? undefined"
    :aria-label="displayCode ? label : undefined"
  >
    <slot>
      <!-- Without a code there is nothing compact to show, so the control keeps
           the full-text form it had before the icon treatment. Consumers on an
           older build therefore keep working until they pass `code`. -->
      <template v-if="displayCode">
        <I9kIcon name="translate" size="1.1rem" />
        <span class="i9k-language-switcher__code">{{ displayCode }}</span>
      </template>
      <template v-else>{{ label }}</template>
    </slot>
  </component>
</template>
<style scoped>
.i9k-language-switcher {
  --i9k-language-switcher-height: var(--control-height-sm);

  display: inline-flex;
  height: var(--i9k-language-switcher-height);
  align-items: center;
  padding: 0 var(--spacing-6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-pill);
  color: var(--theme-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}

/* Paired with the theme button: same height, same corner, and a gap sized to
   sit between the glyph and the two-letter code without looking like a word. */
.i9k-language-switcher--icon {
  gap: var(--spacing-2);
  padding: 0 var(--spacing-4);
  border-radius: var(--radius-md);
  background: var(--surface-color);
}

.i9k-language-switcher__code {
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  line-height: 1;
}

.i9k-language-switcher:hover {
  border-color: var(--primary-color);
  color: var(--primary-text-color);
}

.i9k-language-switcher:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}
</style>
