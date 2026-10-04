<script setup lang="ts">
import { computed } from 'vue';

import type { I9kComponentSize } from '../types/components';

const props = withDefaults(
  defineProps<{
    value: number;
    label: string;
    max?: number;
    valueText?: string;
    size?: I9kComponentSize;
  }>(),
  {
    max: 5,
    valueText: undefined,
    size: 'md',
  },
);

const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment && !props.label.trim()) {
  console.warn('I9kLevelMeter requires a non-empty label for its accessible name.');
}

const steps = computed(() => {
  const max = Math.floor(props.max);

  return Number.isFinite(max) && max >= 1 ? max : 1;
});

const filled = computed(() => {
  const value = Math.round(props.value);

  return Number.isFinite(value) ? Math.min(Math.max(value, 0), steps.value) : 0;
});

const text = computed(() => props.valueText?.trim() || undefined);
</script>

<template>
  <span
    :class="['i9k-level-meter', `i9k-level-meter--${size}`]"
    role="meter"
    :aria-label="label"
    aria-valuemin="0"
    :aria-valuemax="steps"
    :aria-valuenow="filled"
    :aria-valuetext="text"
  >
    <span class="i9k-level-meter__steps" aria-hidden="true">
      <span
        v-for="step in steps"
        :key="step"
        :class="['i9k-level-meter__step', { 'i9k-level-meter__step--filled': step <= filled }]"
        :style="{ '--i9k-level-meter-rise': step / steps }"
      />
    </span>
    <span v-if="text" class="i9k-level-meter__text">{{ text }}</span>
  </span>
</template>

<style scoped>
/* A filled step is solid and an empty one is only outlined, and the steps
   rise in height, so the level reads without colour; the value text says it
   in words. The steps follow the reading direction, so they rise leftwards in
   Arabic. */
.i9k-level-meter {
  --i9k-level-meter-height: 0.875rem;
  --i9k-level-meter-step-width: 0.3125rem;
  --i9k-level-meter-step-gap: var(--spacing-1);
  --i9k-level-meter-gap: var(--spacing-3);
  --i9k-level-meter-font-size: 0.875rem;

  display: inline-flex;
  align-items: center;
  gap: var(--i9k-level-meter-gap);
  color: var(--text-color-light);
  font-size: var(--i9k-level-meter-font-size);
  font-weight: 600;
  line-height: 1.4;
  vertical-align: middle;
}

.i9k-level-meter--sm {
  --i9k-level-meter-height: 0.75rem;
  --i9k-level-meter-step-width: 0.25rem;
  --i9k-level-meter-gap: var(--spacing-2);
  --i9k-level-meter-font-size: 0.8rem;
}

.i9k-level-meter--lg {
  --i9k-level-meter-height: 1.125rem;
  --i9k-level-meter-step-width: 0.4375rem;
  --i9k-level-meter-step-gap: var(--spacing-2);
  --i9k-level-meter-gap: var(--spacing-4);
  --i9k-level-meter-font-size: 1rem;
}

.i9k-level-meter__steps {
  display: inline-flex;
  flex: none;
  align-items: flex-end;
  gap: var(--i9k-level-meter-step-gap);
  height: var(--i9k-level-meter-height);
}

.i9k-level-meter__step {
  box-sizing: border-box;
  width: var(--i9k-level-meter-step-width);
  height: calc(var(--i9k-level-meter-height) * (0.4 + 0.6 * var(--i9k-level-meter-rise)));
  border: 1px solid var(--control-border-color);
  border-radius: var(--spacing-1);
  background: transparent;
}

.i9k-level-meter__step--filled {
  border-color: var(--primary-text-color);
  background: var(--primary-text-color);
}

.i9k-level-meter__text {
  white-space: nowrap;
}
</style>
