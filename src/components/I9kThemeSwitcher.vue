<script setup lang="ts">
import { computed } from 'vue';

import type { I9kIconName } from '../types/icons';
import I9kIcon from './I9kIcon.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    lightLabel?: string;
    darkLabel?: string;
  }>(),
  { modelValue: false, lightLabel: 'Switch to light mode', darkLabel: 'Switch to dark mode' },
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const toggleLabel = computed(() => (props.modelValue ? props.lightLabel : props.darkLabel));
// The glyph names the theme the button switches to, matching the label: a moon
// while the page is light, a sun while it is dark.
const icon = computed<I9kIconName>(() => (props.modelValue ? 'sun' : 'moon'));
</script>

<template>
  <button
    class="theme-switcher i9k-theme-switcher"
    :class="{ 'is-dark': modelValue }"
    type="button"
    :aria-label="toggleLabel"
    :aria-pressed="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <Transition name="i9k-theme-switcher-icon" mode="out-in">
      <I9kIcon :key="icon" :name="icon" size="1.1rem" />
    </Transition>
  </button>
</template>

<style scoped>
.i9k-theme-switcher {
  --i9k-theme-switcher-height: var(--control-height-sm);

  display: inline-flex;
  width: var(--i9k-theme-switcher-height);
  height: var(--i9k-theme-switcher-height);
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  appearance: none;
  background: var(--surface-color);
  color: var(--theme-text-color);
  cursor: pointer;
  transition: var(--transition);
}

.i9k-theme-switcher:hover {
  border-color: var(--primary-color);
  color: var(--primary-text-color);
}

.i9k-theme-switcher:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

/* The two glyphs never coexist, so the cross-fade is a rotate-and-scale swap
   rather than the opacity stack the sliding-thumb version used. */
.i9k-theme-switcher-icon-enter-active,
.i9k-theme-switcher-icon-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.i9k-theme-switcher-icon-enter-from {
  opacity: 0;
  transform: rotate(-45deg) scale(0.7);
}

.i9k-theme-switcher-icon-leave-to {
  opacity: 0;
  transform: rotate(45deg) scale(0.7);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-theme-switcher,
  .i9k-theme-switcher-icon-enter-active,
  .i9k-theme-switcher-icon-leave-active {
    transition: none;
  }
}
</style>
