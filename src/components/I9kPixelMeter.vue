<script setup lang="ts">
import { computed } from 'vue';

import type { I9kComponentSize, I9kPixelMeterTone } from '../types/components';

/**
 * A meter drawn in pixel blocks, the design language's pixel accent for
 * progress and levels (showcase: Foundations, Pixel accents). One block per
 * unit for a small count such as a level, or a continuous segmented fill for
 * a percentage. Drawn with SVG geometry attributes and scoped CSS only, never
 * a style attribute, so a strict Content-Security-Policy keeps it whole.
 */
const props = withDefaults(
  defineProps<{
    value: number;
    label: string;
    max?: number;
    valueText?: string;
    /** One block per unit (a level); false draws a continuous segmented fill (a percentage). */
    segments?: boolean;
    tone?: I9kPixelMeterTone;
    /** Blink the last filled block, like a cursor marking where someone stands. */
    blink?: boolean;
    size?: I9kComponentSize;
  }>(),
  {
    max: 4,
    valueText: undefined,
    segments: true,
    tone: 'accent',
    blink: false,
    size: 'md',
  },
);

const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment && !props.label.trim()) {
  console.warn('I9kPixelMeter requires a non-empty label for its accessible name.');
}

const max = computed(() => {
  const value = props.segments ? Math.floor(props.max) : props.max;

  return Number.isFinite(value) && value >= 1 ? value : 1;
});

const value = computed(() => {
  const raw = props.segments ? Math.round(props.value) : props.value;

  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), max.value) : 0;
});

const blocks = computed(() =>
  props.segments
    ? Array.from({ length: max.value }, (_, index) => ({
        step: index + 1,
        filled: index + 1 <= value.value,
        current: props.blink && index + 1 === value.value,
      }))
    : [],
);

const fillWidth = computed(() => `${(value.value / max.value) * 100}%`);
const text = computed(() => props.valueText?.trim() || undefined);
</script>

<template>
  <span :class="['i9k-pixel-meter', `i9k-pixel-meter--${size}`, `i9k-pixel-meter--${tone}`]">
    <slot />
    <span
      class="i9k-pixel-meter__meter"
      role="meter"
      :aria-label="label"
      aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="value"
      :aria-valuetext="text"
    >
      <template v-if="segments">
        <svg
          v-for="block in blocks"
          :key="block.step"
          :class="[
            'i9k-pixel-meter__block',
            {
              'i9k-pixel-meter__block--filled': block.filled,
              'i9k-pixel-meter__block--current': block.current,
            },
          ]"
          data-pixel-block
          :data-filled="block.filled ? '' : undefined"
          :data-current="block.current ? '' : undefined"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <rect width="1" height="1" />
        </svg>
      </template>
      <svg v-else class="i9k-pixel-meter__track" aria-hidden="true" focusable="false">
        <rect class="i9k-pixel-meter__track-bg" width="100%" height="100%" />
        <rect class="i9k-pixel-meter__fill" data-pixel-fill :width="fillWidth" height="100%" />
      </svg>
    </span>
    <slot name="end" />
  </span>
</template>

<style scoped>
/* A pixel accent: square blocks with notched corners, a flat fill with a
   light top edge and a dark bottom edge. Every size comes from --pixel-size
   and the empty block from --pixel-track-color (tokens.css). */
.i9k-pixel-meter {
  --i9k-pixel-meter-height: calc(var(--pixel-size) * 5);
  --i9k-pixel-meter-gap: calc(var(--pixel-size) * 1.5);
  --i9k-pixel-meter-color: var(--accent-color);

  display: flex;
  align-items: center;
  gap: var(--spacing-5, 0.75rem);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.i9k-pixel-meter--sm {
  --i9k-pixel-meter-height: calc(var(--pixel-size) * 3);
  --i9k-pixel-meter-gap: var(--pixel-size);
}

.i9k-pixel-meter--lg {
  --i9k-pixel-meter-height: calc(var(--pixel-size) * 7);
  --i9k-pixel-meter-gap: calc(var(--pixel-size) * 2);
}

.i9k-pixel-meter--primary {
  --i9k-pixel-meter-color: var(--primary-text-color);
}

.i9k-pixel-meter__meter {
  display: flex;
  flex: 1;
  gap: var(--i9k-pixel-meter-gap);
  min-inline-size: 4rem;
  block-size: var(--i9k-pixel-meter-height);
}

.i9k-pixel-meter__block,
.i9k-pixel-meter__track {
  display: block;
  flex: 1;
  block-size: 100%;
  clip-path: polygon(
    0 var(--pixel-size),
    var(--pixel-size) var(--pixel-size),
    var(--pixel-size) 0,
    calc(100% - var(--pixel-size)) 0,
    calc(100% - var(--pixel-size)) var(--pixel-size),
    100% var(--pixel-size),
    100% calc(100% - var(--pixel-size)),
    calc(100% - var(--pixel-size)) calc(100% - var(--pixel-size)),
    calc(100% - var(--pixel-size)) 100%,
    var(--pixel-size) 100%,
    var(--pixel-size) calc(100% - var(--pixel-size)),
    0 calc(100% - var(--pixel-size))
  );
}

.i9k-pixel-meter__block {
  fill: var(--pixel-track-color);
}

.i9k-pixel-meter__block--filled {
  fill: var(--i9k-pixel-meter-color);
  box-shadow:
    inset 0 var(--pixel-size) 0 color-mix(in srgb, var(--i9k-pixel-meter-color), white 30%),
    inset 0 calc(var(--pixel-size) * -1) 0
      color-mix(in srgb, var(--i9k-pixel-meter-color), black 30%);
}

.i9k-pixel-meter__block--current {
  animation: i9k-pixel-meter-blink 1.2s steps(2, jump-none) infinite;
}

@keyframes i9k-pixel-meter-blink {
  50% {
    fill: color-mix(in srgb, var(--i9k-pixel-meter-color), white 35%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-pixel-meter__block--current {
    animation: none;
  }
}

/* The continuous fill is cut into segments one pixel unit apart. */
.i9k-pixel-meter__track {
  mask-image: repeating-linear-gradient(
    to right,
    #000 0 calc(var(--pixel-size) * 2),
    transparent calc(var(--pixel-size) * 2) calc(var(--pixel-size) * 2.5)
  );
}

.i9k-pixel-meter__track-bg {
  fill: var(--pixel-track-color);
}

.i9k-pixel-meter__fill {
  fill: var(--i9k-pixel-meter-color);
}

/* Fill from the inline start: right to left in Arabic. */
.i9k-pixel-meter:dir(rtl) .i9k-pixel-meter__track {
  transform: scaleX(-1);
}
</style>
