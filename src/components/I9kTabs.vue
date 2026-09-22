<script setup lang="ts">
import { computed, useId } from 'vue';

import type { I9kComponentSize, I9kTabItem } from '../types/components';

/** The selected tab's `value`. */
const model = defineModel<string>({ required: true });

const props = withDefaults(
  defineProps<{
    tabs: I9kTabItem[];
    label: string;
    size?: I9kComponentSize;
    focusablePanel?: boolean;
  }>(),
  {
    size: 'md',
    focusablePanel: true,
  },
);

defineSlots<Record<string, (props: { value: string }) => unknown>>();

// One SSR-stable id per instance; tabs and panels are told apart by index
// because a tab's value may hold characters an id reference cannot.
const baseId = useId();
const tabId = (index: number) => `${baseId}-tab-${index}`;
const panelId = (index: number) => `${baseId}-panel-${index}`;

// A value that matches no enabled tab shows the first enabled one instead, so
// the tablist always has a selection; nothing is emitted until the user acts.
const selectedIndex = computed(() => {
  const match = props.tabs.findIndex((tab) => !tab.disabled && tab.value === model.value);
  return match === -1 ? props.tabs.findIndex((tab) => !tab.disabled) : match;
});
const selectedTab = computed<I9kTabItem | undefined>(() => props.tabs[selectedIndex.value]);

const select = (index: number) => {
  const tab = props.tabs[index];
  if (!tab || tab.disabled || tab.value === model.value) return;
  model.value = tab.value;
};

/** The first enabled tab `step` places away from `from`, wrapping at both ends. */
const enabledFrom = (from: number, step: 1 | -1) => {
  const count = props.tabs.length;
  for (let offset = 1; offset <= count; offset += 1) {
    const index = (((from + step * offset) % count) + count) % count;
    if (!props.tabs[index].disabled) return index;
  }
  return from;
};

const onKeydown = (event: KeyboardEvent, index: number) => {
  // Modified arrows belong to the browser: Alt+ArrowLeft and Cmd+ArrowLeft go back.
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  const tab = event.currentTarget as HTMLElement;
  // jsdom computes no `direction`, so read the nearest dir attribute instead.
  const rtl = tab.closest('[dir]')?.getAttribute('dir') === 'rtl';
  let target: number;

  switch (event.key) {
    case 'ArrowRight':
      target = enabledFrom(index, rtl ? -1 : 1);
      break;
    case 'ArrowLeft':
      target = enabledFrom(index, rtl ? 1 : -1);
      break;
    // Home searches forward from before the first tab, End backward from after the last.
    case 'Home':
      target = enabledFrom(-1, 1);
      break;
    case 'End':
      target = enabledFrom(props.tabs.length, -1);
      break;
    default:
      return;
  }

  event.preventDefault();
  select(target);
  tab.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus();
};
</script>

<template>
  <div :class="['i9k-tabs', `i9k-tabs--${size}`]">
    <div role="tablist" class="i9k-tabs__list" :aria-label="label">
      <button
        v-for="(tab, index) in tabs"
        :id="tabId(index)"
        :key="tab.value"
        type="button"
        role="tab"
        class="i9k-tabs__tab"
        :aria-selected="index === selectedIndex ? 'true' : 'false'"
        :aria-controls="index === selectedIndex ? panelId(index) : undefined"
        :tabindex="index === selectedIndex ? 0 : -1"
        :disabled="tab.disabled"
        @click="select(index)"
        @keydown="onKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>
    <!-- Only the selected panel exists: keyed by value, its content mounts when its tab is
         selected and unmounts when another is. -->
    <div
      v-if="selectedTab"
      :id="panelId(selectedIndex)"
      :key="selectedTab.value"
      role="tabpanel"
      class="i9k-tabs__panel"
      :aria-labelledby="tabId(selectedIndex)"
      :tabindex="focusablePanel ? 0 : undefined"
    >
      <slot :name="selectedTab.value" :value="selectedTab.value" />
    </div>
  </div>
</template>

<style scoped>
.i9k-tabs {
  --i9k-tabs-height: var(--control-height-md);
  --i9k-tabs-font-size: var(--control-font-size-md);
  --i9k-tabs-gap: var(--component-gap-md);
  --i9k-tabs-color: var(--text-color-light);
  --i9k-tabs-selected-color: var(--text-color);
  /* Equal to --primary-color in the light theme; in the dark theme --primary-color
     is too dim on the page for a state marker, and this token is not. */
  --i9k-tabs-indicator-color: var(--primary-text-color);
  --i9k-tabs-rule-color: var(--border-color);
}

.i9k-tabs--sm {
  --i9k-tabs-height: var(--control-height-sm);
  --i9k-tabs-font-size: var(--control-font-size-sm);
  --i9k-tabs-gap: var(--component-gap-sm);
}

.i9k-tabs--lg {
  --i9k-tabs-height: var(--control-height-lg);
  --i9k-tabs-font-size: var(--control-font-size-lg);
  --i9k-tabs-gap: var(--component-gap-lg);
}

.i9k-tabs__list {
  display: flex;
  border-block-end: 1px solid var(--i9k-tabs-rule-color);
}

/* Equal shares of the row, so two tabs read as a segmented control. */
.i9k-tabs__tab {
  position: relative;
  display: inline-flex;
  flex: 1 1 0;
  min-width: 0;
  min-height: var(--i9k-tabs-height);
  align-items: center;
  justify-content: center;
  padding-block: var(--spacing-2);
  padding-inline: var(--i9k-tabs-gap);
  border: 0;
  border-radius: var(--radius-sm);
  appearance: none;
  background: none;
  color: var(--i9k-tabs-color);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--i9k-tabs-font-size);
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  transition: color 160ms ease;
}

.i9k-tabs__tab[aria-selected='true'] {
  color: var(--i9k-tabs-selected-color);
}

/* A border rather than a shadow or a fill, so the marker survives forced colors; it
   sits over the list's rule. */
.i9k-tabs__tab[aria-selected='true']::after {
  position: absolute;
  inset-block-end: -1px;
  inset-inline: 0;
  border-block-end: 2px solid var(--i9k-tabs-indicator-color);
  content: '';
}

.i9k-tabs__tab:hover:not(:disabled, [aria-selected='true']) {
  color: var(--i9k-tabs-selected-color);
}

.i9k-tabs__tab:focus-visible,
.i9k-tabs__panel:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

.i9k-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.i9k-tabs__panel {
  padding-block-start: var(--i9k-tabs-gap);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-tabs__tab {
    transition: none;
  }
}
</style>
