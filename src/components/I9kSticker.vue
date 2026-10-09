<script setup lang="ts">
import { useId } from 'vue';

import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    /** The sticker art: dark line art on a light fill, a white die-cut border and a transparent background. */
    src: string;
    /** The sticker's accessible name; it also names a link the caller wraps around it. */
    alt: string;
    size?: I9kComponentSize;
  }>(),
  { size: 'md' },
);

// One id pair per instance, stable across a server render and hydration, so
// two stickers on a page never share a mask or a gradient.
const id = useId();
const maskId = `${id}-mask`;
const foilId = `${id}-foil`;

// The pointer's place across the sticker, 0 at the left edge to 1 at the
// right, reaches CSS as a custom property set through the CSSOM. A strict
// Content-Security-Policy (`style-src 'self'`) drops style attributes but not
// properties set from script, and nothing is set until a pointer moves, so
// the server's HTML carries no style attribute.
function onPointerMove(event: PointerEvent) {
  const root = event.currentTarget as HTMLElement;
  const box = root.getBoundingClientRect();
  if (!box.width) return;
  const shift = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
  root.style.setProperty('--i9k-sticker-shift', String(Math.round(shift * 100) / 100));
}

function onPointerLeave(event: PointerEvent) {
  (event.currentTarget as HTMLElement).style.removeProperty('--i9k-sticker-shift');
}
</script>

<template>
  <span
    :class="['i9k-sticker', `i9k-sticker--${size}`]"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  >
    <svg class="i9k-sticker__art" viewBox="0 0 100 100" role="img" :aria-label="alt">
      <defs>
        <mask
          :id="maskId"
          class="i9k-sticker__mask"
          mask-type="alpha"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100"
          height="100"
        >
          <image :href="src" width="100" height="100" />
        </mask>
        <linearGradient
          :id="foilId"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="100"
          y2="40"
          spreadMethod="repeat"
        >
          <stop offset="0" stop-color="#ff9ad5" />
          <stop offset="0.2" stop-color="#ffe29a" />
          <stop offset="0.4" stop-color="#9affc8" />
          <stop offset="0.6" stop-color="#9ad8ff" />
          <stop offset="0.8" stop-color="#c49aff" />
          <stop offset="1" stop-color="#ff9ad5" />
        </linearGradient>
      </defs>
      <image :href="src" width="100" height="100" />
      <g class="i9k-sticker__foil" :mask="`url(#${maskId})`">
        <rect
          class="i9k-sticker__sheen"
          x="-100"
          y="-100"
          width="300"
          height="300"
          :fill="`url(#${foilId})`"
        />
      </g>
    </svg>
  </span>
</template>

<style scoped>
/* A die-cut sticker with a holographic foil. The foil is a rainbow gradient
   clipped to the sticker's own shape (the image's alpha) and multiplied over
   it, so dark lines stay dark and light areas take the colour. It slides with
   the pointer through --i9k-sticker-shift and eases back when it leaves. */
.i9k-sticker {
  --i9k-sticker-size: 6rem;

  display: inline-block;
  inline-size: var(--i9k-sticker-size);
  block-size: var(--i9k-sticker-size);
  vertical-align: middle;
}

.i9k-sticker--sm {
  --i9k-sticker-size: 4rem;
}

.i9k-sticker--lg {
  --i9k-sticker-size: 8rem;
}

.i9k-sticker__art {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
  isolation: isolate;
  filter: drop-shadow(0 2px 3px rgb(0 0 0 / 25%));
}

.i9k-sticker__mask {
  mask-type: alpha;
}

.i9k-sticker__foil {
  mix-blend-mode: multiply;
  opacity: 0.7;
}

.i9k-sticker__sheen {
  transform: translate(
    calc(var(--i9k-sticker-shift, 0.5) * -60px),
    calc(var(--i9k-sticker-shift, 0.5) * -24px)
  );
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* A keyboard user focusing a link around the sticker sees one sweep. */
:focus-visible > .i9k-sticker .i9k-sticker__sheen {
  animation: i9k-sticker-sweep 0.9s ease-in-out;
}

@keyframes i9k-sticker-sweep {
  from {
    transform: translate(0, 0);
  }

  to {
    transform: translate(-60px, -24px);
  }
}

/* Still foil: holographic at a fixed angle, with no slide and no sweep. */
@media (prefers-reduced-motion: reduce) {
  .i9k-sticker__sheen,
  :focus-visible > .i9k-sticker .i9k-sticker__sheen {
    transform: translate(-30px, -12px);
    transition: none;
    animation: none;
  }
}
</style>
