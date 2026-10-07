<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import I9kNino from './I9kNino.vue';
import {
  SKY_GRID,
  boopExpression,
  createSkyStars,
  createSparkles,
  driftAt,
  lookToward,
  planetDots,
  starAlpha,
  type SkyDot,
  type SkyStar,
  type Sparkle,
} from '../composables/i9kNinoSky';
import type { I9kNinoExpression, I9kNinoLook } from '../types/components';

const props = withDefaults(
  defineProps<{
    /**
     * The boop button's accessible name, localized by the consumer ("Say hi to
     * Nino" / "سلّم على نينو"). The sky and Nino himself are decoration, so this
     * is the scene's one name.
     */
    boopLabel: string;
    height?: 'sm' | 'md' | 'lg';
    /**
     * Motion is on by default. Setting this false stops the drift, the twinkle,
     * the spin and the sparkles, beside the prefers-reduced-motion media query,
     * not instead of it. Nino still looks at the pointer and changes his face,
     * because those are state, not motion.
     */
    animated?: boolean;
  }>(),
  { height: 'md', animated: true },
);

const emit = defineEmits<{ boop: [expression: I9kNinoExpression] }>();

const BOOP_SETTLE_MS = 1500;
const LOOK_SETTLE_MS = 2000;
const FRAME_MS = 33;
const SPARKLE_MS = 700;
const MAX_PIXEL_RATIO = 2;

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const flight = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);

const expression = ref<I9kNinoExpression>('idle');
const look = ref<I9kNinoLook>('center');
const spinning = ref(false);

const classes = computed(() => [
  'i9k-nino-sky',
  `i9k-nino-sky--${props.height}`,
  ...(props.animated ? ['i9k-nino-sky--animated'] : []),
]);

interface LiveSparkle extends Sparkle {
  born: number;
}

let boops = 0;
let boopTimer: ReturnType<typeof setTimeout> | undefined;
let lookTimer: ReturnType<typeof setTimeout> | undefined;
let frameId = 0;
let lastDraw = -Infinity;
let skyWidth = 0;
let skyHeight = 0;
let stars: SkyStar[] = [];
let planets: SkyDot[] = [];
let sparkles: LiveSparkle[] = [];
let reducedMotion = false;
let onScreen = true;
let mounted = false;
let motionQuery: MediaQueryList | undefined;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;

function motionAllowed() {
  return props.animated && !reducedMotion;
}

function isRtl() {
  return root.value ? getComputedStyle(root.value).direction === 'rtl' : false;
}

function color(name: string) {
  return root.value ? getComputedStyle(root.value).getPropertyValue(name).trim() : '';
}

function measure() {
  const box = root.value;
  const target = canvas.value;
  if (!box || !target) return;
  skyWidth = box.clientWidth;
  skyHeight = box.clientHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  target.width = Math.round(skyWidth * ratio);
  target.height = Math.round(skyHeight * ratio);
  stars = createSkyStars(skyWidth, skyHeight);

  // Planets sit by the start and end edges, which swap on an Arabic page.
  const rtl = isRtl();
  const fromStart = (share: number) => (rtl ? skyWidth * (1 - share) : skyWidth * share);
  planets = [
    ...planetDots('crescent', fromStart(0.14), skyHeight * 0.32, Math.min(48, skyHeight * 0.18)),
    ...planetDots('ringed', fromStart(0.84), skyHeight * 0.72, Math.min(36, skyHeight * 0.14)),
  ];
}

function draw(now: number) {
  const target = canvas.value;
  const context = target?.getContext('2d');
  if (!target || !context || skyWidth === 0) return;

  const ratio = target.width / skyWidth;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, skyWidth, skyHeight);

  const tones = {
    faint: color('--i9k-nino-sky-star'),
    warm: color('--i9k-nino-sky-warm'),
    cool: color('--i9k-nino-sky-cool'),
  };

  context.globalAlpha = 0.28;
  context.fillStyle = color('--i9k-nino-sky-planet');
  for (const dot of planets) context.fillRect(dot.x, dot.y, SKY_GRID / 2, SKY_GRID / 2);

  // A still sky draws every star at a fixed brightness instead of twinkling.
  const still = !motionAllowed();
  for (const star of stars) {
    const alpha = still ? 0.6 : starAlpha(star, now);
    context.globalAlpha = star.tone === 'faint' ? alpha * 0.45 : alpha;
    context.fillStyle = tones[star.tone];
    context.fillRect(star.x, star.y, SKY_GRID / 2, SKY_GRID / 2);
  }

  sparkles = sparkles.filter((sparkle) => now - sparkle.born < SPARKLE_MS);
  for (const sparkle of sparkles) {
    const age = now - sparkle.born;
    context.globalAlpha = 1 - age / SPARKLE_MS;
    context.fillStyle = tones[sparkle.tone];
    const x = Math.round((sparkle.x + sparkle.vx * age) / SKY_GRID) * SKY_GRID;
    const y = Math.round((sparkle.y + sparkle.vy * age) / SKY_GRID) * SKY_GRID;
    context.fillRect(x, y, SKY_GRID, SKY_GRID);
  }
  context.globalAlpha = 1;
}

function place(now: number) {
  const element = flight.value;
  const nino = button.value;
  if (!element || !nino) return;
  const { x, y, tilt } = driftAt(now, skyWidth, skyHeight, nino.offsetHeight);
  element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
}

function frame(now: number) {
  frameId = 0;
  if (now - lastDraw >= FRAME_MS) {
    lastDraw = now;
    draw(now);
    place(now);
  }
  schedule();
}

function running() {
  return mounted && motionAllowed() && onScreen && document.visibilityState !== 'hidden';
}

function schedule() {
  if (frameId || !running() || typeof requestAnimationFrame !== 'function') return;
  frameId = requestAnimationFrame(frame);
}

function stop() {
  if (frameId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameId);
  frameId = 0;
}

/** Re-reads whether motion is allowed: the still frame, or the loop. */
function refresh() {
  if (running()) {
    schedule();
    return;
  }
  stop();
  if (!motionAllowed()) flight.value?.style.removeProperty('transform');
  draw(0);
}

function onVisibility() {
  refresh();
}

function onMotionChange(event: MediaQueryListEvent) {
  reducedMotion = event.matches;
  refresh();
}

function boop() {
  expression.value = boopExpression(boops);
  boops += 1;
  emit('boop', expression.value);

  if (motionAllowed()) {
    const nino = button.value;
    spinning.value = false;
    // Restarts the spin when a boop lands mid-spin: the class comes off, a
    // reflow is forced, and it goes back on.
    if (nino) void nino.offsetWidth;
    spinning.value = true;

    const box = root.value?.getBoundingClientRect();
    const centre = nino?.getBoundingClientRect();
    if (box && centre) {
      const now = performance.now();
      const burst = createSparkles(
        centre.left - box.left + centre.width / 2,
        centre.top - box.top + centre.height / 2,
        boops,
      );
      sparkles.push(...burst.map((sparkle) => ({ ...sparkle, born: now })));
    }
    schedule();
  }

  clearTimeout(boopTimer);
  boopTimer = setTimeout(() => {
    boopTimer = undefined;
    expression.value = 'idle';
    spinning.value = false;
  }, BOOP_SETTLE_MS);
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return;
  const nino = button.value?.getBoundingClientRect();
  if (!nino) return;
  look.value = lookToward(
    event.clientX - (nino.left + nino.width / 2),
    event.clientY - (nino.top + nino.height / 2),
    isRtl(),
  );
  clearTimeout(lookTimer);
  lookTimer = setTimeout(() => {
    lookTimer = undefined;
    look.value = 'center';
  }, LOOK_SETTLE_MS);
}

onMounted(() => {
  mounted = true;
  if (typeof window.matchMedia === 'function') {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = motionQuery.matches;
    motionQuery.addEventListener?.('change', onMotionChange);
  }

  measure();
  if (typeof ResizeObserver === 'function' && root.value) {
    resizeObserver = new ResizeObserver(() => {
      measure();
      draw(lastDraw > 0 ? lastDraw : 0);
    });
    resizeObserver.observe(root.value);
  }
  if (typeof IntersectionObserver === 'function' && root.value) {
    intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      refresh();
    });
    intersectionObserver.observe(root.value);
  }
  document.addEventListener('visibilitychange', onVisibility);
  refresh();
});

onBeforeUnmount(() => {
  mounted = false;
  stop();
  clearTimeout(boopTimer);
  clearTimeout(lookTimer);
  boopTimer = undefined;
  lookTimer = undefined;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  motionQuery?.removeEventListener?.('change', onMotionChange);
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <div ref="root" :class="classes" @pointermove="onPointerMove">
    <canvas ref="canvas" class="i9k-nino-sky__canvas" aria-hidden="true" />
    <div ref="flight" class="i9k-nino-sky__flight">
      <button
        ref="button"
        type="button"
        class="i9k-nino-sky__nino"
        :class="{ 'i9k-nino-sky__nino--spin': spinning }"
        :aria-label="boopLabel"
        @click="boop"
      >
        <I9kNino :expression="expression" :look="look" size="lg" :animated="animated" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Always night, whatever the page theme: the sky and Nino's colours are pinned
   here rather than read from the theme tokens, which turn light on a light
   page. The canvas reads the star colours back from these properties. */
.i9k-nino-sky {
  --i9k-nino-sky-height: 18rem;
  --i9k-nino-sky-bg: var(--dark-color);
  --i9k-nino-sky-star: var(--white-color);
  --i9k-nino-sky-warm: var(--accent-color);
  --i9k-nino-sky-cool: hsl(142 69% 58%);
  --i9k-nino-sky-planet: var(--white-color);
  --i9k-nino-sky-nino: hsl(143 58% 44%);
  --i9k-nino-sky-focus: hsl(143 58% 60%);
  position: relative;
  overflow: hidden;
  block-size: var(--i9k-nino-sky-height);
  background: var(--i9k-nino-sky-bg);
}

.i9k-nino-sky--sm {
  --i9k-nino-sky-height: 12rem;
}

.i9k-nino-sky--lg {
  --i9k-nino-sky-height: 24rem;
}

.i9k-nino-sky__canvas {
  position: absolute;
  inset: 0;
  display: block;
  inline-size: 100%;
  block-size: 100%;
}

/* Centred by `translate`, so the drift the script writes to `transform`
   composes with it instead of replacing it. Physical left on purpose: the
   drift is symmetric, and inline-start would push the centre off in Arabic. */
.i9k-nino-sky__flight {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  will-change: transform;
}

.i9k-nino-sky__nino {
  display: block;
  padding: 0.25rem;
  border: 0;
  border-radius: 0.5rem;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.i9k-nino-sky__nino:focus-visible {
  outline: 2px solid var(--i9k-nino-sky-focus);
  outline-offset: 4px;
}

.i9k-nino-sky__nino :deep(.i9k-nino) {
  --i9k-nino-size: 5rem;
  --i9k-nino-body: var(--i9k-nino-sky-nino);
  --i9k-nino-screen: var(--dark-color);
  --i9k-nino-eye: var(--accent-color);
  --i9k-nino-mouth: var(--i9k-nino-sky-nino);
}

.i9k-nino-sky--animated .i9k-nino-sky__nino--spin {
  animation: i9k-nino-sky-spin 600ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes i9k-nino-sky-spin {
  from {
    transform: rotate(0deg) scale(1);
  }

  50% {
    transform: rotate(180deg) scale(1.15);
  }

  to {
    transform: rotate(360deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-nino-sky--animated .i9k-nino-sky__nino--spin {
    animation: none;
  }
}
</style>
