<script setup lang="ts">
/**
 * A titled page section whose header can carry the section's own actions, and
 * which can collapse behind a disclosure button in its heading.
 *
 * Not an I9kCollapsible: that is a native <details>, whose only header is its
 * <summary>, and a button placed inside a <summary> is nested interactive
 * content. Here the disclosure button sits inside the heading and the actions
 * sit beside it, so both stay operable and the tab order is button, then
 * actions.
 */
import { computed, ref, useId, watch } from 'vue';

import I9kIcon from './I9kIcon.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    id?: string;
    level?: 2 | 3 | 4 | 5 | 6;
    collapsible?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
  }>(),
  {
    id: undefined,
    level: 2,
    collapsible: false,
    // Explicitly undefined: Vue would otherwise cast an absent boolean prop to
    // false and every section would become a controlled, closed one.
    open: undefined,
    defaultOpen: true,
  },
);

const emit = defineEmits<{ 'update:open': [open: boolean] }>();

const generatedId = useId();
const baseId = computed(() => props.id || generatedId);
const headingId = computed(() => `${baseId.value}-heading`);
const bodyId = computed(() => `${baseId.value}-body`);

// Seeded and synced from `open`, so a section whose `open` goes back to
// undefined keeps its last state instead of jumping to `defaultOpen`.
const localOpen = ref(props.open ?? props.defaultOpen);
watch(
  () => props.open,
  (open) => {
    if (open !== undefined) localOpen.value = open;
  },
);
const isControlled = computed(() => props.open !== undefined);
const isCollapsible = computed(() => props.collapsible || isControlled.value);
const isOpen = computed(() => {
  if (!isCollapsible.value) return true;
  return isControlled.value ? props.open === true : localOpen.value;
});

// A controlled section only asks: it stays as it is until the parent changes
// `open`, so a parent can refuse to close a section that must stay visible.
function toggle() {
  const next = !isOpen.value;
  if (!isControlled.value) localOpen.value = next;
  emit('update:open', next);
}
</script>

<template>
  <section :id="id || undefined" class="i9k-section" :aria-labelledby="headingId">
    <div class="i9k-section__header">
      <component :is="`h${level}`" :id="headingId" class="i9k-section__heading">
        <button
          v-if="isCollapsible"
          type="button"
          class="i9k-section__toggle"
          data-i9k-section-toggle
          :aria-expanded="isOpen ? 'true' : 'false'"
          :aria-controls="bodyId"
          @click="toggle"
        >
          <I9kIcon name="arrowDown" size="1rem" class="i9k-section__indicator" />
          <span>{{ title }}</span>
        </button>
        <template v-else>{{ title }}</template>
      </component>
      <div v-if="$slots.actions" class="i9k-section__actions"><slot name="actions" /></div>
      <div v-if="$slots.toolbar" class="i9k-section__toolbar"><slot name="toolbar" /></div>
    </div>
    <!-- `hidden`, not v-show: v-show server-renders an inline `style`, which a
         `style-src 'self'` Content Security Policy blocks, so a closed section
         would render open until hydration. -->
    <div :id="bodyId" class="i9k-section__body" data-i9k-section-body :hidden="!isOpen">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.i9k-section {
  --i9k-section-gap: var(--spacing-6);
  --i9k-section-heading-font-size: 1.1rem;

  display: grid;
  gap: var(--i9k-section-gap);
  min-width: 0;
}

.i9k-section__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--spacing-4) var(--spacing-8);
  align-items: center;
}

.i9k-section__heading {
  min-width: 0;
  margin: 0;
  font-size: var(--i9k-section-heading-font-size);
  font-weight: 700;
}

/* Pulled back by its own inline padding so the title lines up with the body
   while the hover background still has room around it. */
.i9k-section__toggle {
  display: inline-flex;
  gap: var(--spacing-4);
  align-items: center;
  margin: 0;
  margin-inline-start: calc(var(--spacing-4) * -1);
  padding: var(--spacing-2) var(--spacing-4);
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: start;
  transition: background-color 160ms ease;
}

.i9k-section__toggle:hover {
  background: var(--primary-color-alpha-12);
}

.i9k-section__toggle:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}

/* Points along the reading direction while closed, and down while open. */
.i9k-section__indicator {
  flex: 0 0 auto;
  color: var(--text-color-light);
  transform: rotate(-90deg);
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.i9k-section__indicator:dir(rtl) {
  transform: rotate(90deg);
}

.i9k-section__toggle[aria-expanded='true'] .i9k-section__indicator {
  transform: none;
}

.i9k-section__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  align-items: center;
  justify-content: flex-end;
}

.i9k-section__toolbar {
  grid-column: 1 / -1;
}

.i9k-section__body {
  min-width: 0;
}

/* The global `[hidden]` rule sits in a cascade layer, so any unlayered display
   rule would beat it; keep a closed body closed regardless. */
.i9k-section__body[hidden] {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-section__toggle,
  .i9k-section__indicator {
    transition: none;
  }
}
</style>
