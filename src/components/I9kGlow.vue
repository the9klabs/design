<script setup lang="ts">
/**
 * One large, soft brand-coloured glow behind the whole page, with film grain.
 *
 * A sibling of I9kBlurredCircles rather than a variant of it: `position` only
 * means something for a single glow.
 */
import { computed } from 'vue';

import type { I9kGlowPosition } from '../types/components';

const props = withDefaults(defineProps<{ position?: I9kGlowPosition }>(), { position: 'end' });

// A Record rather than an array, so TypeScript fails when it and the type drift apart.
const POSITIONS: Record<I9kGlowPosition, true> = {
  top: true,
  'top-start': true,
  'top-end': true,
  start: true,
  end: true,
  center: true,
};

// Plain-JS consumers get no type check, so an unknown value keeps the default
// placement instead of leaving the glow unplaced.
const position = computed(() =>
  Object.hasOwn(POSITIONS, props.position) ? props.position : 'end',
);
</script>

<template>
  <div class="i9k-glow" :class="`i9k-glow--${position}`" aria-hidden="true">
    <i class="i9k-glow__light" />
  </div>
</template>

<style scoped>
.i9k-glow {
  --i9k-glow-size: clamp(32rem, 80vmax, 80rem);
  --i9k-glow-opacity: 0.5;
  /* Lightened from the brand tokens without losing their chroma, so the green
     stays green instead of turning the grey a white mix gives. */
  --i9k-glow-from: oklch(from var(--primary-color) 0.8 c h);
  --i9k-glow-via: oklch(from hsl(38 84% 68%) 0.86 c h);
  --i9k-glow-to: oklch(from var(--accent-color) 0.78 calc(c * 0.8) h);
  --i9k-glow-from-stop: 25%;
  --i9k-glow-via-stop: 62%;

  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
/* On a dark page a dim amber or orange reads as brown, so the glow leads with
   the green and keeps the orange to its lower rim. */
.i9k-glow:where(.dark *) {
  --i9k-glow-opacity: 0.35;
  --i9k-glow-from: oklch(from var(--primary-color) 0.62 c h);
  --i9k-glow-via: oklch(from var(--primary-color) 0.66 c h);
  --i9k-glow-to: var(--accent-color);
}
/* Anchored at the top, only the lower half shows, so the whole gradient moves
   into it instead of losing the green off-screen. */
.i9k-glow--top,
.i9k-glow--top-start,
.i9k-glow--top-end {
  --i9k-glow-from-stop: 55%;
  --i9k-glow-via-stop: 75%;
}
.i9k-glow__light {
  position: absolute;
  inline-size: var(--i9k-glow-size);
  block-size: var(--i9k-glow-size);
  border-radius: var(--radius-circle);
  /* Grain first, blended into the gradient under it. The soft edge is a mask
     rather than filter: blur, which would smear the grain away and is costly
     to animate on a fixed layer. */
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    linear-gradient(
      to bottom,
      var(--i9k-glow-from) var(--i9k-glow-from-stop),
      var(--i9k-glow-via) var(--i9k-glow-via-stop),
      var(--i9k-glow-to) 92%
    );
  background-blend-mode: overlay, normal;
  mask-image: radial-gradient(closest-side, #000 45%, transparent);
  opacity: var(--i9k-glow-opacity);
  animation: i9k-glow-drift 20s ease-in-out infinite alternate;
}
/* Each position centres the glow on an edge or corner, half of it off-screen. */
.i9k-glow--top .i9k-glow__light {
  inset-block-start: calc(var(--i9k-glow-size) / -2);
  inset-inline: 0;
  margin-inline: auto;
}
.i9k-glow--top-start .i9k-glow__light {
  inset-block-start: calc(var(--i9k-glow-size) / -2);
  inset-inline-start: calc(var(--i9k-glow-size) / -2);
}
.i9k-glow--top-end .i9k-glow__light {
  inset-block-start: calc(var(--i9k-glow-size) / -2);
  inset-inline-end: calc(var(--i9k-glow-size) / -2);
}
.i9k-glow--start .i9k-glow__light {
  inset-block: 0;
  inset-inline-start: calc(var(--i9k-glow-size) / -2);
  margin-block: auto;
}
.i9k-glow--end .i9k-glow__light {
  inset-block: 0;
  inset-inline-end: calc(var(--i9k-glow-size) / -2);
  margin-block: auto;
}
.i9k-glow--center .i9k-glow__light {
  inset: 0;
  margin: auto;
}
@keyframes i9k-glow-drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(-4%, 6%) scale(1.08);
  }
}
@media (prefers-reduced-motion: reduce) {
  .i9k-glow__light {
    animation: none;
  }
}
</style>
