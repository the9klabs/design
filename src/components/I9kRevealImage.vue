<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import {
  cellsCleared,
  REVEAL_GRID,
  REVEAL_ROOT_MARGIN,
  revealOrder,
  stateAtMount,
  stateOnFirstReport,
  stateOnLoad,
  stateOnReport,
  type I9kRevealImageState,
} from '../utils/revealImage';

const props = withDefaults(
  defineProps<{
    src: string;
    /** The image's alternative text. Pass '' for a decorative image. */
    alt: string;
    /** The image's width, in the units of its `height`: together they set the box's shape. */
    width: number | string;
    height: number | string;
    srcset?: string;
    sizes?: string;
    /**
     * For an image in the first screen: a plain `<img loading="eager" fetchpriority="high">`,
     * with no placeholder, no observer and no reveal.
     */
    eager?: boolean;
  }>(),
  { srcset: undefined, sizes: undefined, eager: false },
);

const emit = defineEmits<{
  /** The image loaded (the native event). */
  load: [event: Event];
  /** The image failed to load (the native event). */
  error: [event: Event];
}>();

const root = useTemplateRef<HTMLElement>('root');
const image = useTemplateRef<HTMLImageElement>('image');
const placeholder = useTemplateRef<HTMLElement>('placeholder');
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');

// `native` on the server and through hydration, so the server's HTML and the first client
// render agree; the image is then left to the browser's own lazy loading until a script runs.
const state = ref<I9kRevealImageState>('native');

// While the image waits, none of its sources is bound, so the browser cannot start it.
const bound = computed(() => state.value !== 'waiting');

// The browser's own lazy loading decides only until the component does: once it has asked for
// the image, the fetch starts then, so the wait it times is the visitor's, not their scrolling.
// The server and hydration render `native`, so the server's HTML stays `loading="lazy"`.
const loadingMode = computed(() =>
  state.value === 'native' || state.value === 'waiting' ? 'lazy' : 'eager',
);

let observer: IntersectionObserver | undefined;
let frame = 0;
let mountedAt = 0;
let requestedAt = 0;
let reported = false;

function stopObserving() {
  observer?.disconnect();
  observer = undefined;
}

function moveTo(next: I9kRevealImageState) {
  if (next === 'loading' && state.value !== 'loading') requestedAt = performance.now();
  state.value = next;
  // Only a waiting or a native image still needs to hear how near it is.
  if (next !== 'waiting' && next !== 'native') stopObserving();
}

function onReport(entries: IntersectionObserverEntry[]) {
  const entry = entries.at(-1);
  if (!entry) return;
  const next = reported
    ? stateOnReport(state.value, entry.isIntersecting)
    : stateOnFirstReport(state.value, entry.isIntersecting);
  reported = true;
  if (next !== state.value) moveTo(next);
}

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function reveal() {
  // Read before the state changes: the placeholder's fill turns transparent while revealing.
  const fill = placeholder.value ? getComputedStyle(placeholder.value).backgroundColor : '';
  moveTo('revealing');
  await nextTick();

  const surface = canvas.value;
  const context = surface?.getContext('2d') ?? null;
  if (!surface || !context || state.value !== 'revealing') {
    if (state.value === 'revealing') moveTo('shown');
    return;
  }

  // One canvas pixel per cell, scaled up by the stylesheet with crisp edges.
  const { columns, rows } = REVEAL_GRID;
  const cells = columns * rows;
  surface.width = columns;
  surface.height = rows;
  context.fillStyle = fill || 'transparent';
  context.fillRect(0, 0, columns, rows);

  const order = revealOrder(cells, Math.random);
  const startedAt = performance.now();
  let cleared = 0;

  const step = () => {
    const target = cellsCleared(performance.now() - startedAt, cells);
    for (; cleared < target; cleared += 1) {
      const cell = order[cleared]!;
      context.clearRect(cell % columns, Math.floor(cell / columns), 1, 1);
    }
    if (cleared >= cells) {
      frame = 0;
      moveTo('shown');
      return;
    }
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
}

function onLoad(event: Event) {
  emit('load', event);
  if (props.eager) return;
  // A load before the first report was the browser's own lazy loading, timed from the mount.
  if (state.value === 'native') requestedAt = mountedAt;
  else if (state.value !== 'loading') return;

  const next = stateOnLoad(performance.now() - requestedAt, prefersReducedMotion());
  if (next === 'revealing') void reveal();
  else moveTo('shown');
}

function onError(event: Event) {
  emit('error', event);
  // A waiting image has no source, so an error then is only its source being taken away; and
  // an image that has loaded stays, even when a later srcset candidate fails.
  if (props.eager || ['waiting', 'revealing', 'shown'].includes(state.value)) return;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  moveTo('failed');
}

onMounted(() => {
  if (props.eager || !root.value || !image.value) return;

  // Set from the script, never as a style attribute in the server's HTML (style-src 'self'), so
  // the box keeps the image's shape once its source is taken away.
  root.value.style.aspectRatio = `${props.width} / ${props.height}`;

  mountedAt = performance.now();
  const hasObserver = typeof IntersectionObserver === 'function';
  const start = stateAtMount(image.value, hasObserver);
  if (start === 'loading') requestedAt = mountedAt;
  state.value = start;
  if (start !== 'native') return;

  observer = new IntersectionObserver(onReport, { rootMargin: REVEAL_ROOT_MARGIN });
  observer.observe(root.value);
});

onBeforeUnmount(() => {
  stopObserving();
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
});
</script>

<template>
  <img
    v-if="eager"
    :sizes="sizes"
    :srcset="srcset"
    :src="src"
    :width="width"
    :height="height"
    :alt="alt"
    loading="eager"
    fetchpriority="high"
    decoding="async"
    @load="onLoad"
    @error="onError"
  />
  <span v-else ref="root" class="i9k-reveal-image" :data-state="state">
    <span ref="placeholder" class="i9k-reveal-image__placeholder" aria-hidden="true">
      <!-- The 9k mark: the favicon's two orange squares over the green smile. -->
      <svg
        class="i9k-reveal-image__mark"
        viewBox="8 12 48 40"
        shape-rendering="crispEdges"
        focusable="false"
      >
        <rect class="i9k-reveal-image__square" x="10" y="12" width="10" height="10" />
        <rect
          class="i9k-reveal-image__square i9k-reveal-image__square--late"
          x="44"
          y="12"
          width="10"
          height="10"
        />
        <path class="i9k-reveal-image__smile" d="M8 34H18V40H46V34H56V46H50V52H14V46H8V34Z" />
      </svg>
    </span>
    <img
      ref="image"
      class="i9k-reveal-image__image"
      :loading="loadingMode"
      :sizes.attr="bound ? sizes : undefined"
      :srcset.attr="bound ? srcset : undefined"
      :src.attr="bound ? src : undefined"
      :width="width"
      :height="height"
      :alt="alt"
      decoding="async"
      @load="onLoad"
      @error="onError"
    />
    <canvas
      v-if="state === 'revealing'"
      ref="canvas"
      class="i9k-reveal-image__canvas"
      aria-hidden="true"
    />
  </span>
</template>

<style scoped>
/* An image that loads as it comes near the view. Until it arrives, a placeholder of its exact
   size shows the 9k mark, whose squares blink; when the visitor waited for it, the placeholder
   breaks into squares that clear in a random order. The state is the root's data-state.

   Stacking: the placeholder sits under the image while the state is `native`, so an image the
   browser loads on its own (before or without the script) always covers it, and above the image
   while the component holds it back, so no alt text or half-decoded image shows through. */
.i9k-reveal-image {
  --i9k-reveal-image-fill: var(--surface-sunken-color, hsl(0 0% 96%));
  --i9k-reveal-image-mark-size: clamp(1.5rem, 18%, 4rem);

  position: relative;
  display: block;
  overflow: hidden;
}

.i9k-reveal-image__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--i9k-reveal-image-fill);
  pointer-events: none;
}

.i9k-reveal-image__mark {
  width: var(--i9k-reveal-image-mark-size);
  height: auto;
  overflow: visible;
  transition: opacity 180ms ease-out;
}

.i9k-reveal-image__square {
  fill: #e85a02;
  animation: i9k-reveal-image-blink 1.6s ease-in-out infinite alternate;
}

.i9k-reveal-image__square--late {
  animation-delay: 0.8s;
}

.i9k-reveal-image__smile {
  fill: #4ade80;
}

/* Positioned, so it paints over the placeholder in source order. Its height is the root's once
   the script has set the root's aspect-ratio, and its own attributes' shape before that. */
.i9k-reveal-image__image {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.i9k-reveal-image__canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.i9k-reveal-image:is(
    [data-state='waiting'],
    [data-state='loading'],
    [data-state='revealing'],
    [data-state='failed']
  )
  .i9k-reveal-image__placeholder {
  z-index: 2;
}

.i9k-reveal-image:is([data-state='waiting'], [data-state='loading'], [data-state='failed'])
  .i9k-reveal-image__image {
  opacity: 0;
}

/* The canvas carries the fill now; the mark fades as the squares start to clear. */
.i9k-reveal-image[data-state='revealing'] .i9k-reveal-image__placeholder {
  background: transparent;
}

.i9k-reveal-image[data-state='revealing'] .i9k-reveal-image__mark {
  opacity: 0;
}

.i9k-reveal-image[data-state='shown'] .i9k-reveal-image__placeholder {
  display: none;
}

.i9k-reveal-image[data-state='failed'] .i9k-reveal-image__square {
  animation: none;
}

@keyframes i9k-reveal-image-blink {
  from {
    opacity: 1;
  }

  to {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-reveal-image__square,
  .i9k-reveal-image__square--late {
    animation: none;
  }

  .i9k-reveal-image__mark {
    transition: none;
  }
}
</style>
