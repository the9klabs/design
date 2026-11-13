<script setup lang="ts">
import { computed } from 'vue';

import type { I9kComponentSize } from '../types/components';

/**
 * An identity mark when a person has no photo, the design language's pixel
 * accent (showcase: Foundations, Pixel accents): a five by five grid mirrored
 * left to right, drawn from a seed such as an account id. The same seed always
 * draws the same face, and the seed never leaves the page.
 */
const props = withDefaults(
  defineProps<{
    seed: string;
    /** Empty: decorative, hidden from assistive technology. */
    alt?: string;
    size?: I9kComponentSize;
  }>(),
  { alt: '', size: 'md' },
);

const GRID = 5;
const HALF = 3;

// FNV-1a, 32-bit: small, stable across runtimes, and spreads short ids well.
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

const bits = computed(() => hash(props.seed));

const cells = computed(() => {
  // 15 bits fill the left three columns; the right two mirror them. A seed
  // whose 15 bits are all zero gets the centre column, so no face is empty.
  const pattern = bits.value & 0x7fff || 0b100_100_100_100_100;
  return Array.from({ length: GRID * GRID }, (_, index) => {
    const row = Math.floor(index / GRID);
    const col = index % GRID;
    const source = col < HALF ? col : GRID - 1 - col;
    return {
      key: `${row}-${col}`,
      row,
      col,
      filled: Boolean(pattern & (1 << (row * HALF + source))),
    };
  });
});

const tone = computed(() => ((bits.value >>> 15) & 1 ? 'accent' : 'primary'));
const named = computed(() => props.alt.trim().length > 0);
</script>

<template>
  <svg
    :class="['i9k-pixel-avatar', `i9k-pixel-avatar--${size}`, `i9k-pixel-avatar--${tone}`]"
    viewBox="-1 -1 7 7"
    shape-rendering="crispEdges"
    :role="named ? 'img' : undefined"
    :aria-label="named ? alt : undefined"
    :aria-hidden="named ? undefined : 'true'"
    focusable="false"
  >
    <rect class="i9k-pixel-avatar__bg" x="-1" y="-1" width="7" height="7" />
    <rect
      v-for="cell in cells"
      :key="cell.key"
      :class="['i9k-pixel-avatar__cell', { 'i9k-pixel-avatar__cell--filled': cell.filled }]"
      :data-cell="cell.key"
      :data-filled="cell.filled ? '' : undefined"
      :x="cell.col"
      :y="cell.row"
      width="1"
      height="1"
    />
  </svg>
</template>

<style scoped>
/* Pixel accents: notched corners of --pixel-size, as .i9k-pixel-corners. */
.i9k-pixel-avatar {
  --i9k-pixel-avatar-size: 4rem;
  --i9k-pixel-avatar-color: var(--primary-text-color);

  display: block;
  flex: none;
  inline-size: var(--i9k-pixel-avatar-size);
  block-size: var(--i9k-pixel-avatar-size);
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

.i9k-pixel-avatar--sm {
  --i9k-pixel-avatar-size: var(--control-height-md);
}

.i9k-pixel-avatar--lg {
  --i9k-pixel-avatar-size: 6rem;
}

.i9k-pixel-avatar--accent {
  --i9k-pixel-avatar-color: var(--accent-color);
}

.i9k-pixel-avatar__bg {
  fill: var(--pixel-track-color);
}

.i9k-pixel-avatar__cell {
  fill: transparent;
}

.i9k-pixel-avatar__cell--filled {
  fill: var(--i9k-pixel-avatar-color);
}
</style>
