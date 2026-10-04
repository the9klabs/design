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

// The steps are SVG rects sized by geometry attributes rather than an inline
// style, because a strict Content-Security-Policy (`style-src 'self'`) drops
// style attributes. Units are the viewBox's; CSS scales the drawing to the
// size's height, and the outline keeps a 1px stroke whatever the scale.
const STEP_WIDTH = 5;
const STEP_GAP = 3;
const HEIGHT = 14;
const INSET = 0.5;

const viewBox = computed(
  () => `0 0 ${steps.value * STEP_WIDTH + (steps.value - 1) * STEP_GAP} ${HEIGHT}`,
);

const rects = computed(() =>
  Array.from({ length: steps.value }, (_, index) => {
    const step = index + 1;
    const height = HEIGHT * (0.4 + (0.6 * step) / steps.value);

    return {
      step,
      x: index * (STEP_WIDTH + STEP_GAP) + INSET,
      y: HEIGHT - height + INSET,
      width: STEP_WIDTH - INSET * 2,
      height: height - INSET * 2,
      filled: step <= filled.value,
    };
  }),
);
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
    <svg class="i9k-level-meter__steps" :viewBox="viewBox" aria-hidden="true" focusable="false">
      <rect
        v-for="rect in rects"
        :key="rect.step"
        :class="['i9k-level-meter__step', { 'i9k-level-meter__step--filled': rect.filled }]"
        :x="rect.x"
        :y="rect.y"
        :width="rect.width"
        :height="rect.height"
        rx="1"
      />
    </svg>
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
  --i9k-level-meter-gap: var(--spacing-2);
  --i9k-level-meter-font-size: 0.8rem;
}

.i9k-level-meter--lg {
  --i9k-level-meter-height: 1.125rem;
  --i9k-level-meter-gap: var(--spacing-4);
  --i9k-level-meter-font-size: 1rem;
}

.i9k-level-meter__steps {
  display: block;
  flex: none;
  width: auto;
  height: var(--i9k-level-meter-height);
  overflow: visible;
}

/* The drawing has no reading direction of its own, so mirror it to rise in
   the reading direction. */
.i9k-level-meter:dir(rtl) .i9k-level-meter__steps {
  transform: scaleX(-1);
}

.i9k-level-meter__step {
  fill: transparent;
  stroke: var(--control-border-color);
  stroke-width: 1px;
  vector-effect: non-scaling-stroke;
}

.i9k-level-meter__step--filled {
  fill: var(--primary-text-color);
  stroke: var(--primary-text-color);
}

.i9k-level-meter__text {
  white-space: nowrap;
}
</style>
