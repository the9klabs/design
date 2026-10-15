<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import I9kNino from './I9kNino.vue';
import {
  DIZZY_FACE_MS,
  DRAG_THRESHOLD,
  RETURN_MS,
  SKY_GRID,
  boopExpression,
  clampPoint,
  createSkyStars,
  createSparkles,
  driftAt,
  easeOutCubic,
  homeOffsetAt,
  isSettled,
  lookToward,
  planetDots,
  recentSamples,
  releaseVelocity,
  starAlpha,
  stepBody,
  type NinoBody,
  type NinoBounds,
  type Point,
  type PointerSample,
  type SkyDot,
  type SkyStar,
  type Sparkle,
} from '../composables/i9kNinoSky';
import type { I9kNinoExposed, I9kNinoExpression, I9kNinoLook } from '../types/components';

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
/** The longest step the motion clock takes between two frames. */
const MAX_STEP_MS = 100;

const root = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const flight = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const ninoFigure = ref<I9kNinoExposed | null>(null);
/** While true, Nino is drawn in window coordinates, outside the sky's clipping. */
const airborne = ref(false);

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
// The drift, the twinkle and the sparkles follow this clock, which only runs
// while the loop does. Nino starts from the centre and picks up where he left
// off, instead of jumping by however long the sky spent off screen.
let motionTime = 0;
let lastTick: number | undefined;
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
let themeObserver: MutationObserver | undefined;

/**
 * Drifting in the sky, held by the pointer, flying after a throw, or swooping
 * back after landing above the sky. Every state but drifting is airborne.
 */
type FlightState = 'drifting' | 'dragging' | 'flying' | 'returning';
let flightState: FlightState = 'drifting';
let body: NinoBody = { x: 0, y: 0, vx: 0, vy: 0 };
/** Where the pointer holds him, from his top-left, so he never jumps to it. */
let grab: Point = { x: 0, y: 0 };
let pressed: (Point & { id: number }) | undefined;
let samples: PointerSample[] = [];
/** Set by a drag, so the pointer click that ends it does not boop. */
let swallowClick = false;
/** Where he landed against his drift path; it fades from homeSince. */
let home: Point = { x: 0, y: 0 };
let homeSince = 0;
let dizzyTimer: ReturnType<typeof setTimeout> | undefined;
let returnFrom: Point = { x: 0, y: 0 };
let returnStart = 0;

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

  context.globalAlpha = 0.34;
  context.fillStyle = color('--i9k-nino-sky-planet');
  for (const dot of planets) context.fillRect(dot.x, dot.y, SKY_GRID / 2, SKY_GRID / 2);

  // A still sky draws every star at a fixed brightness instead of twinkling.
  const still = !motionAllowed();
  for (const star of stars) {
    const alpha = still ? 0.6 : starAlpha(star, now);
    context.globalAlpha = star.tone === 'faint' ? alpha * 0.45 : alpha;
    context.fillStyle = tones[star.tone];
    const size = star.tone === 'faint' ? SKY_GRID / 2 : (SKY_GRID * 3) / 4;
    context.fillRect(star.x, star.y, size, size);
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
  const offset = homeOffsetAt(home, now - homeSince);
  element.style.transform = `translate(${(x + offset.x).toFixed(1)}px, ${(y + offset.y).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
}

function frame(now: number) {
  frameId = 0;
  const step = lastTick === undefined ? 0 : Math.min(now - lastTick, MAX_STEP_MS);
  motionTime += step;
  lastTick = now;
  if (flightState === 'flying') fly(step);
  else if (flightState === 'returning') swoop();
  if (now - lastDraw >= FRAME_MS) {
    lastDraw = now;
    draw(motionTime);
    if (flightState === 'drifting') place(motionTime);
  }
  schedule();
}

function running() {
  if (!mounted || !motionAllowed() || document.visibilityState === 'hidden') return false;
  // Airborne, he can be anywhere in the window, so the sky being off screen does not stop him.
  return onScreen || flightState !== 'drifting';
}

function schedule() {
  if (frameId || !running() || typeof requestAnimationFrame !== 'function') return;
  frameId = requestAnimationFrame(frame);
}

function stop() {
  if (frameId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameId);
  frameId = 0;
  lastTick = undefined;
}

/** Re-reads whether motion is allowed: the still frame, or the loop. */
function refresh() {
  // Motion went off mid-flight: he lands now, by the still rules, instead of freezing in the air.
  if (!motionAllowed()) {
    if (flightState === 'flying') land();
    else if (flightState === 'returning') finishReturn();
  }
  if (running()) {
    schedule();
    return;
  }
  stop();
  if (motionAllowed()) return;
  // The still frame: Nino back at the centre, where the drift starts again,
  // and no sparkles left frozen mid-flight.
  motionTime = 0;
  sparkles = [];
  // The home offset fades on the motion clock, which just restarted.
  home = { x: 0, y: 0 };
  homeSince = 0;
  // A Nino held by the pointer stays where the pointer has him.
  if (flightState === 'drifting') flight.value?.style.removeProperty('transform');
  draw(motionTime);
}

async function restartSpin() {
  spinning.value = false;
  // The class has to leave the DOM before it comes back, or a boop that lands
  // mid-spin never restarts the animation: wait for the render, force a
  // reflow, then put it back.
  await nextTick();
  void button.value?.offsetWidth;
  spinning.value = true;
}

function onVisibility() {
  refresh();
}

function onMotionChange(event: MediaQueryListEvent) {
  reducedMotion = event.matches;
  refresh();
}

function boop() {
  clearTimeout(dizzyTimer);
  dizzyTimer = undefined;
  expression.value = boopExpression(boops);
  boops += 1;
  emit('boop', expression.value);

  if (motionAllowed()) {
    const nino = button.value;
    void restartSpin();

    const box = root.value?.getBoundingClientRect();
    const centre = nino?.getBoundingClientRect();
    if (box && centre) {
      const burst = createSparkles(
        centre.left - box.left + centre.width / 2,
        centre.top - box.top + centre.height / 2,
        boops,
      );
      sparkles.push(...burst.map((sparkle) => ({ ...sparkle, born: motionTime })));
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
  if (flightState !== 'drifting') return;
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

/** The room his top-left corner has in the window, scrollbar excluded. */
function windowBounds(): NinoBounds {
  const element = flight.value;
  return {
    width: document.documentElement.clientWidth - (element?.offsetWidth ?? 0),
    height: window.innerHeight - (element?.offsetHeight ?? 0),
  };
}

function drawAirborne(tilt = 0) {
  const element = flight.value;
  if (!element) return;
  element.style.transform = `translate(${body.x.toFixed(1)}px, ${body.y.toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
}

function getDizzy() {
  clearTimeout(boopTimer);
  boopTimer = undefined;
  spinning.value = false;
  clearTimeout(dizzyTimer);
  expression.value = 'dizzy';
  void ninoFigure.value?.play('dizzy');
  dizzyTimer = setTimeout(() => {
    dizzyTimer = undefined;
    expression.value = 'idle';
  }, DIZZY_FACE_MS);
}

/** Back in the sky, drifting, and dizzy. */
function finishReturn() {
  flightState = 'drifting';
  airborne.value = false;
  home = { x: 0, y: 0 };
  if (motionAllowed()) place(motionTime);
  else flight.value?.style.removeProperty('transform');
  getDizzy();
  refresh();
}

/** Drifting again from where he stopped, easing home along his drift path. */
function settleInSky(sky: DOMRect, element: HTMLElement) {
  flightState = 'drifting';
  airborne.value = false;
  expression.value = 'idle';
  if (!motionAllowed()) {
    home = { x: 0, y: 0 };
    element.style.removeProperty('transform');
    refresh();
    return;
  }
  const clampTo = (value: number, room: number) => Math.min(Math.max(value, -room), room);
  const roomX = Math.max(0, (sky.width - element.offsetWidth) / 2);
  const roomY = Math.max(0, (sky.height - element.offsetHeight) / 2);
  const drift = driftAt(motionTime, skyWidth, skyHeight, button.value?.offsetHeight ?? 0);
  home = {
    x: clampTo(body.x + element.offsetWidth / 2 - (sky.left + sky.width / 2), roomX) - drift.x,
    y: clampTo(body.y + element.offsetHeight / 2 - (sky.top + sky.height / 2), roomY) - drift.y,
  };
  homeSince = motionTime;
  place(motionTime);
  refresh();
}

/** At rest: above the sky's top edge he goes back dizzy; anywhere else he drifts home. */
function land() {
  const sky = root.value?.getBoundingClientRect();
  const element = flight.value;
  if (!sky || !element) return;
  if (body.y + element.offsetHeight / 2 < sky.top) {
    snapBack();
    return;
  }
  settleInSky(sky, element);
}

/** Where the drift would draw him right now, in window coordinates. */
function driftTarget(): Point & { tilt: number } {
  const sky = root.value?.getBoundingClientRect();
  const element = flight.value;
  if (!sky || !element) return { x: body.x, y: body.y, tilt: 0 };
  const { x, y, tilt } = driftAt(motionTime, skyWidth, skyHeight, button.value?.offsetHeight ?? 0);
  return {
    x: sky.left + sky.width / 2 + x - element.offsetWidth / 2,
    y: sky.top + sky.height / 2 + y - element.offsetHeight / 2,
    tilt,
  };
}

function snapBack() {
  home = { x: 0, y: 0 };
  if (!motionAllowed()) {
    finishReturn();
    return;
  }
  returnFrom = { x: body.x, y: body.y };
  returnStart = motionTime;
  flightState = 'returning';
  schedule();
}

/** The swoop: eased from where he stopped to his drift point, which keeps moving. */
function swoop() {
  const progress = (motionTime - returnStart) / RETURN_MS;
  const eased = easeOutCubic(progress);
  const target = driftTarget();
  body = {
    x: returnFrom.x + (target.x - returnFrom.x) * eased,
    y: returnFrom.y + (target.y - returnFrom.y) * eased,
    vx: 0,
    vy: 0,
  };
  drawAirborne(target.tilt * eased);
  if (progress >= 1) finishReturn();
}

function fly(step: number) {
  body = stepBody(body, step, windowBounds());
  // He leans into the throw; the lean never changes his bounds.
  drawAirborne(Math.min(Math.max(body.vx * 8, -20), 20));
  if (isSettled(body)) land();
}

function throwNino(velocity: { vx: number; vy: number }) {
  samples = [];
  if (!motionAllowed()) {
    land();
    return;
  }
  body = { ...body, ...velocity };
  flightState = 'flying';
  schedule();
}

function pickUp(start: Point) {
  const element = flight.value;
  const nino = button.value;
  if (!element || !nino) return;
  // From his centre, so a tilt or a spin does not shift him as he is picked up.
  const box = nino.getBoundingClientRect();
  body = {
    x: box.left + box.width / 2 - element.offsetWidth / 2,
    y: box.top + box.height / 2 - element.offsetHeight / 2,
    vx: 0,
    vy: 0,
  };
  hold(start);
}

/** Into the pointer's hand, wherever he is, from where the pointer has him. */
function hold(start: Point) {
  grab = { x: start.x - body.x, y: start.y - body.y };
  body = { ...body, vx: 0, vy: 0 };
  samples = [];
  flightState = 'dragging';
  airborne.value = true;
  swallowClick = true;
  clearTimeout(lookTimer);
  lookTimer = undefined;
  look.value = 'center';
  clearTimeout(boopTimer);
  boopTimer = undefined;
  clearTimeout(dizzyTimer);
  dizzyTimer = undefined;
  spinning.value = false;
  expression.value = 'surprised';
  drawAirborne();
  schedule();
}

function onPointerDown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || pressed || flightState === 'dragging') return;
  swallowClick = false;
  pressed = { id: event.pointerId, x: event.clientX, y: event.clientY };
  button.value?.setPointerCapture?.(event.pointerId);
  // Caught in mid-air: he is already out of the sky, so no threshold.
  if (flightState !== 'drifting') hold(pressed);
}

function onDragMove(event: PointerEvent) {
  if (!pressed || event.pointerId !== pressed.id) return;
  // A mouse released outside the window never sends pointerup; let go here.
  if (event.pointerType === 'mouse' && event.buttons === 0) {
    onPointerCancel(event);
    return;
  }
  if (flightState === 'drifting') {
    if (Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) <= DRAG_THRESHOLD) return;
    pickUp(pressed);
  }
  if (flightState !== 'dragging') return;
  const t = performance.now();
  const at = clampPoint({ x: event.clientX - grab.x, y: event.clientY - grab.y }, windowBounds());
  body = { ...at, vx: 0, vy: 0 };
  samples = recentSamples([...samples, { t, ...at }], t);
  drawAirborne();
}

function onPointerUp(event: PointerEvent) {
  if (!pressed || event.pointerId !== pressed.id) return;
  pressed = undefined;
  if (flightState !== 'dragging') return;
  const t = performance.now();
  samples.push({ t, x: body.x, y: body.y });
  throwNino(releaseVelocity(samples, t));
}

/** pointercancel and lostpointercapture: let go where he is, without a throw. */
function onPointerCancel(event: PointerEvent) {
  if (!pressed || event.pointerId !== pressed.id) return;
  pressed = undefined;
  if (flightState === 'dragging') throwNino({ vx: 0, vy: 0 });
}

function onClick(event: MouseEvent) {
  // The pointer click that ends a drag is not a boop. A keyboard click
  // (detail 0, from Enter or Space) always is.
  if (swallowClick && event.detail !== 0) {
    swallowClick = false;
    return;
  }
  if (flightState !== 'drifting') return;
  boop();
}

watch(() => props.animated, refresh);

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
      draw(motionTime);
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
  // The sky takes its colours from the page theme, a class on <html>. A
  // running loop picks a new theme up on its next frame; a still sky needs
  // drawing again.
  if (typeof MutationObserver === 'function') {
    themeObserver = new MutationObserver(() => {
      if (!running()) draw(motionTime);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
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
  clearTimeout(dizzyTimer);
  dizzyTimer = undefined;
  pressed = undefined;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  themeObserver?.disconnect();
  motionQuery?.removeEventListener?.('change', onMotionChange);
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <div ref="root" :class="classes" @pointermove="onPointerMove">
    <canvas ref="canvas" class="i9k-nino-sky__canvas" aria-hidden="true" />
    <div
      ref="flight"
      class="i9k-nino-sky__flight"
      :class="{ 'i9k-nino-sky__flight--airborne': airborne }"
    >
      <button
        ref="button"
        type="button"
        class="i9k-nino-sky__nino"
        :class="{ 'i9k-nino-sky__nino--spin': spinning }"
        :aria-label="boopLabel"
        @click="onClick"
        @pointerdown="onPointerDown"
        @pointermove="onDragMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerCancel"
        @lostpointercapture="onPointerCancel"
      >
        <I9kNino
          ref="ninoFigure"
          :expression="expression"
          :look="look"
          size="lg"
          :animated="animated"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* No background of its own: the sky is drawn over whatever page sits behind
   it, in the page theme's colours, so it reads as light stars on a dark page
   and dark dots on a light one. The canvas reads the dot colours back from
   these properties. */
.i9k-nino-sky {
  --i9k-nino-sky-height: 18rem;
  --i9k-nino-sky-star: var(--theme-text-color);
  --i9k-nino-sky-warm: var(--accent-color);
  --i9k-nino-sky-cool: var(--primary-text-color);
  --i9k-nino-sky-planet: var(--theme-text-color);
  position: relative;
  overflow: hidden;
  block-size: var(--i9k-nino-sky-height);
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
  /* The stars and planets fade in from the top edge, so the sky has no line
     where it begins. */
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 45%);
  mask-image: linear-gradient(to bottom, transparent, #000 45%);
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

/* Airborne, Nino is placed in the window rather than the sky, so the sky's
   overflow: hidden no longer clips him; the script writes his window position
   to transform. Above the navigation (100) and its menus (200). An ancestor
   with a transform, filter or contain: paint would bound him to itself
   instead of the window. */
.i9k-nino-sky__flight--airborne {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 300;
  translate: none;
}

.i9k-nino-sky__nino {
  display: block;
  padding: 0.25rem;
  border: 0;
  border-radius: 0.5rem;
  background: none;
  cursor: grab;
  /* A drag that starts on Nino moves him instead of scrolling the page. */
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.i9k-nino-sky__nino:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 4px;
}

.i9k-nino-sky__flight--airborne .i9k-nino-sky__nino {
  cursor: grabbing;
}

.i9k-nino-sky__nino :deep(.i9k-nino) {
  --i9k-nino-size: 5rem;
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
