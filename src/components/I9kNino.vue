<script setup lang="ts">
import { computed, useId } from 'vue';

import type { I9kNinoExpression, I9kNinoLook, I9kNinoSize } from '../types/components';

interface NinoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface NinoFace {
  eyes: [NinoRect, NinoRect];
  brows?: [NinoRect, NinoRect];
  /** Path data. Every expression owns a mouth; no expression borrows another's. */
  mouth: string;
}

/**
 * Nino is drawn on a 16x16 pixel grid scaled to a 64-unit viewBox, so every
 * coordinate is a multiple of four and nothing blurs when he is rendered at
 * 16px. Expressions change only the eyes, the brows and the mouth: the head,
 * screen, arms and feet never move, which is what keeps one character
 * recognisable across six moods.
 */
const FACES: Record<I9kNinoExpression, NinoFace> = {
  idle: {
    eyes: [
      { x: 16, y: 12, width: 12, height: 12 },
      { x: 36, y: 12, width: 12, height: 12 },
    ],
    mouth: 'M16 28H20V32H44V28H48V36H44V40H20V36H16V28Z',
  },
  happy: {
    eyes: [
      { x: 16, y: 16, width: 12, height: 8 },
      { x: 36, y: 16, width: 12, height: 8 },
    ],
    mouth: 'M16 28H48V32H44V36H40V40H24V36H20V32H16V28Z',
  },
  thinking: {
    eyes: [
      { x: 16, y: 16, width: 12, height: 8 },
      { x: 36, y: 12, width: 12, height: 12 },
    ],
    mouth: 'M32 28H44V36H32V28Z',
  },
  worried: {
    eyes: [
      { x: 16, y: 16, width: 8, height: 8 },
      { x: 40, y: 16, width: 8, height: 8 },
    ],
    brows: [
      { x: 16, y: 12, width: 12, height: 4 },
      { x: 36, y: 12, width: 12, height: 4 },
    ],
    mouth: 'M16 40H20V36H44V40H48V32H44V28H20V32H16V40Z',
  },
  surprised: {
    eyes: [
      { x: 16, y: 8, width: 12, height: 16 },
      { x: 36, y: 8, width: 12, height: 16 },
    ],
    mouth: 'M28 28H36V40H28V28Z',
  },
  'eyes-closed': {
    eyes: [
      { x: 16, y: 20, width: 12, height: 4 },
      { x: 36, y: 20, width: 12, height: 4 },
    ],
    mouth: 'M20 28H24V32H40V28H44V36H40V40H24V36H20V28Z',
  },
};

const props = withDefaults(
  defineProps<{
    expression?: I9kNinoExpression;
    look?: I9kNinoLook;
    size?: I9kNinoSize;
    /**
     * Motion is on by default. Setting this false removes the class every
     * animation rule hangs off, which is a second switch beside the
     * prefers-reduced-motion media query, not a replacement for it.
     */
    animated?: boolean;
    /**
     * Nino's name is localized by the consumer ("Nino" / "نينو"). With a label
     * he is an image; without one he is decoration and stays out of the
     * accessibility tree entirely.
     */
    label?: string | null;
  }>(),
  { expression: 'idle', look: 'center', size: 'md', animated: true, label: null },
);

const titleId = `${useId()}-nino-title`;
const face = computed(() => FACES[props.expression]);
const classes = computed(() => [
  'i9k-nino',
  `i9k-nino--${props.expression}`,
  `i9k-nino--look-${props.look}`,
  `i9k-nino--${props.size}`,
  ...(props.animated ? ['i9k-nino--animated'] : []),
]);
</script>

<template>
  <svg
    :class="classes"
    viewBox="0 0 64 64"
    shape-rendering="crispEdges"
    focusable="false"
    :role="label ? 'img' : undefined"
    :aria-hidden="label ? undefined : 'true'"
    :aria-labelledby="label ? titleId : undefined"
  >
    <title v-if="label" :id="titleId">{{ label }}</title>
    <g class="i9k-nino__figure" data-nino-part="figure">
      <rect class="i9k-nino__limb" data-nino-part="arm" x="0" y="20" width="8" height="16" />
      <rect class="i9k-nino__limb" data-nino-part="arm" x="56" y="20" width="8" height="16" />
      <rect class="i9k-nino__limb" data-nino-part="foot" x="16" y="48" width="12" height="8" />
      <rect class="i9k-nino__limb" data-nino-part="foot" x="36" y="48" width="12" height="8" />
      <rect class="i9k-nino__head" data-nino-part="head" x="8" y="4" width="48" height="44" />
      <rect class="i9k-nino__screen" data-nino-part="screen" x="12" y="8" width="40" height="36" />
      <rect
        v-for="(brow, index) in face.brows"
        :key="`brow-${index}`"
        class="i9k-nino__brow"
        data-nino-part="brow"
        :x="brow.x"
        :y="brow.y"
        :width="brow.width"
        :height="brow.height"
      />
      <g class="i9k-nino__eyes" data-nino-part="eyes">
        <rect
          v-for="(eye, index) in face.eyes"
          :key="`eye-${index}`"
          class="i9k-nino__eye"
          data-nino-part="eye"
          :x="eye.x"
          :y="eye.y"
          :width="eye.width"
          :height="eye.height"
        />
      </g>
      <path class="i9k-nino__mouth" data-nino-part="mouth" :d="face.mouth" />
    </g>
  </svg>
</template>

<style scoped>
.i9k-nino {
  /* Overridable per instance: a consumer can retheme one Nino without forking
     the component. --primary-text-color is already redefined by html.dark, so
     Nino follows the theme with no dark-mode rule of his own. */
  --i9k-nino-size: 3rem;
  --i9k-nino-body: var(--primary-text-color);
  --i9k-nino-screen: var(--dark-color);
  --i9k-nino-eye: var(--accent-color);
  --i9k-nino-mouth: var(--primary-text-color);
  --i9k-nino-look-x: 0;
  --i9k-nino-look-y: 0;
  display: block;
  inline-size: var(--i9k-nino-size);
  block-size: var(--i9k-nino-size);
}

.i9k-nino--sm {
  --i9k-nino-size: 2rem;
}

.i9k-nino--lg {
  --i9k-nino-size: 4.5rem;
}

/* The escape hatch for nesting Nino inside a host <svg>: a CSS length would
   beat the x/y/width/height attributes the host needs to position him with. */
.i9k-nino--auto {
  inline-size: auto;
  block-size: auto;
}

.i9k-nino__head,
.i9k-nino__limb {
  fill: var(--i9k-nino-body);
}

.i9k-nino__screen {
  fill: var(--i9k-nino-screen);
}

.i9k-nino__eye,
.i9k-nino__brow {
  fill: var(--i9k-nino-eye);
}

.i9k-nino__mouth {
  fill: var(--i9k-nino-mouth);
}

/* The glance moves the eye group; the blink scales each eye. Two elements, so
   the two transforms never overwrite one another. */
.i9k-nino__eyes {
  transform: translate(calc(var(--i9k-nino-look-x) * 4px), calc(var(--i9k-nino-look-y) * 4px));
}

.i9k-nino__eye {
  transform-box: fill-box;
  transform-origin: center;
}

.i9k-nino--look-up {
  --i9k-nino-look-y: -1;
}

.i9k-nino--look-down {
  --i9k-nino-look-y: 1;
}

.i9k-nino--look-start {
  --i9k-nino-look-x: -1;
}

.i9k-nino--look-end {
  --i9k-nino-look-x: 1;
}

/* start and end are reading-direction, so they swap on an Arabic page. */
[dir='rtl'] .i9k-nino--look-start,
.i9k-nino--look-start[dir='rtl'] {
  --i9k-nino-look-x: 1;
}

[dir='rtl'] .i9k-nino--look-end,
.i9k-nino--look-end[dir='rtl'] {
  --i9k-nino-look-x: -1;
}

.i9k-nino--animated:not(.i9k-nino--eyes-closed) .i9k-nino__eye {
  animation: i9k-nino-blink 5.4s steps(1, end) infinite;
}

.i9k-nino--animated.i9k-nino--thinking .i9k-nino__figure {
  animation: i9k-nino-bob 2.4s ease-in-out infinite;
}

.i9k-nino--animated.i9k-nino--worried .i9k-nino__figure {
  animation: i9k-nino-shiver 0.6s ease-in-out infinite;
}

@keyframes i9k-nino-blink {
  0%,
  93% {
    transform: scaleY(1);
  }

  94%,
  96% {
    transform: scaleY(0.15);
  }

  97%,
  100% {
    transform: scaleY(1);
  }
}

@keyframes i9k-nino-bob {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-2px);
  }
}

@keyframes i9k-nino-shiver {
  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-1px);
  }

  75% {
    transform: translateX(1px);
  }
}

/* The expression lives in the markup, never in a keyframe, so switching motion
   off leaves the chosen face exactly as it was drawn. */
@media (prefers-reduced-motion: reduce) {
  .i9k-nino--animated:not(.i9k-nino--eyes-closed) .i9k-nino__eye {
    animation: none;
  }

  .i9k-nino--animated.i9k-nino--thinking .i9k-nino__figure {
    animation: none;
  }

  .i9k-nino--animated.i9k-nino--worried .i9k-nino__figure {
    animation: none;
  }
}
</style>
