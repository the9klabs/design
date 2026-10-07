<script setup lang="ts">
import { computed, useId } from 'vue';

import { NINO_FACES } from '../data/nino';
import type { I9kNinoExpression, I9kNinoLook, I9kNinoSize } from '../types/components';

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
const face = computed(() => NINO_FACES[props.expression]);
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
    <!--
      Layers, outermost first. Each animation moves exactly one layer, so two
      motions never fight over the same transform: stage is re-created per
      action, figure lifts the whole body, upper dips or slides the head and
      arms, and eyes glances. (Kept inside the svg: a comment beside the root
      would make the component a fragment in development builds.)
    -->
    <g class="i9k-nino__stage" data-nino-part="stage">
      <rect class="i9k-nino__shadow" data-nino-part="shadow" x="14" y="58" width="36" height="2" />
      <g class="i9k-nino__figure" data-nino-part="figure">
        <rect class="i9k-nino__body" data-nino-part="leg" x="20" y="48" width="4" height="2" />
        <rect class="i9k-nino__body" data-nino-part="leg" x="40" y="48" width="4" height="2" />
        <rect class="i9k-nino__body" data-nino-part="foot" x="16" y="50" width="12" height="6" />
        <rect class="i9k-nino__body" data-nino-part="foot" x="36" y="50" width="12" height="6" />
        <g class="i9k-nino__upper" data-nino-part="upper">
          <g class="i9k-nino__arm i9k-nino__arm--left">
            <rect class="i9k-nino__body" data-nino-part="arm" x="2" y="24" width="6" height="14" />
          </g>
          <g class="i9k-nino__arm i9k-nino__arm--right">
            <rect class="i9k-nino__body" data-nino-part="arm" x="56" y="24" width="6" height="14" />
          </g>
          <rect
            class="i9k-nino__body"
            data-nino-part="antenna-stem"
            x="30"
            y="4"
            width="4"
            height="4"
          />
          <rect
            class="i9k-nino__antenna"
            data-nino-part="antenna"
            x="28"
            y="0"
            width="8"
            height="4"
          />
          <path
            class="i9k-nino__body"
            data-nino-part="head"
            d="M10 8H54V10H56V46H54V48H10V46H8V10H10Z"
          />
          <path
            class="i9k-nino__screen"
            data-nino-part="screen"
            d="M14 12H50V14H52V42H50V44H14V42H12V14H14Z"
          />
          <path class="i9k-nino__glint" data-nino-part="glint" d="M14 14H18V16H16V18H14V14Z" />
          <template v-if="face.cheeks">
            <rect
              class="i9k-nino__cheek"
              data-nino-part="cheek"
              x="14"
              y="32"
              width="4"
              height="2"
            />
            <rect
              class="i9k-nino__cheek"
              data-nino-part="cheek"
              x="46"
              y="32"
              width="4"
              height="2"
            />
          </template>
          <template v-for="(brow, index) in face.brows" :key="`brow-${index}`">
            <path v-if="'d' in brow" class="i9k-nino__brow" data-nino-part="brow" :d="brow.d" />
            <rect v-else class="i9k-nino__brow" data-nino-part="brow" v-bind="brow" />
          </template>
          <g class="i9k-nino__eyes" data-nino-part="eyes">
            <template v-for="(eye, index) in face.eyes" :key="`eye-${index}`">
              <path v-if="'d' in eye" class="i9k-nino__eye" data-nino-part="eye" :d="eye.d" />
              <rect v-else class="i9k-nino__eye" data-nino-part="eye" v-bind="eye" />
            </template>
          </g>
          <path class="i9k-nino__mouth" data-nino-part="mouth" :d="face.mouth" />
        </g>
      </g>
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
  --i9k-nino-cheek: color-mix(in srgb, var(--accent-color) 45%, transparent);
  --i9k-nino-glint: color-mix(in srgb, var(--white-color) 22%, transparent);
  --i9k-nino-look-x: 0;
  --i9k-nino-look-y: 0;
  display: block;
  /* A jump or a raised arm leaves the box on purpose. */
  overflow: visible;
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

.i9k-nino__body {
  fill: var(--i9k-nino-body);
}

.i9k-nino__screen {
  fill: var(--i9k-nino-screen);
}

.i9k-nino__eye,
.i9k-nino__brow,
.i9k-nino__antenna {
  fill: var(--i9k-nino-eye);
}

.i9k-nino__mouth {
  fill: var(--i9k-nino-mouth);
}

.i9k-nino__cheek {
  fill: var(--i9k-nino-cheek);
}

.i9k-nino__glint {
  fill: var(--i9k-nino-glint);
}

.i9k-nino__shadow {
  fill: currentColor;
  opacity: 0.12;
  transform-box: fill-box;
  transform-origin: center;
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
