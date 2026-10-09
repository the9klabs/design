<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

import { NINO_ACTION_DURATIONS, NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../data/nino';
import type {
  I9kNinoAction,
  I9kNinoActionResult,
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoLook,
  I9kNinoSize,
} from '../types/components';

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
    /** While true, the mouth flaps between its own shape and an open frame. */
    talking?: boolean;
    /**
     * A soft shadow under his feet, for a Nino standing on something. Off by
     * default: Nino floating in a sky or sitting in a card has no ground to
     * cast one on.
     */
    shadow?: boolean;
    /**
     * Nino's name is localized by the consumer ("Nino" / "نينو"). With a label
     * he is an image; without one he is decoration and stays out of the
     * accessibility tree entirely.
     */
    label?: string | null;
  }>(),
  {
    expression: 'idle',
    look: 'center',
    size: 'md',
    animated: true,
    talking: false,
    shadow: false,
    label: null,
  },
);

const emit = defineEmits<{ 'action-end': [result: I9kNinoActionResult] }>();

const titleId = `${useId()}-nino-title`;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The CSS stills Nino through the animated class and the media query; this
 * answers the same question for the timers and events, so they never disagree
 * with what is on screen. On the server there is nothing to watch move.
 */
function motionAllowed() {
  if (!props.animated || typeof window === 'undefined') return false;
  return !(window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false);
}

const shownExpression = ref<I9kNinoExpression>(props.expression);
const beating = ref(false);
/**
 * The beat keyframes run once, so a mood that arrives mid-beat flips to the
 * other phase: a different animation name restarts the blink, and the new face
 * still swaps in while the eyes are shut.
 */
const beatPhase = ref<'even' | 'odd'>('odd');
let swapTimer: ReturnType<typeof setTimeout> | undefined;
let beatTimer: ReturnType<typeof setTimeout> | undefined;

function clearBeat() {
  clearTimeout(swapTimer);
  clearTimeout(beatTimer);
}

watch(
  () => props.expression,
  (next) => {
    clearBeat();
    if (!motionAllowed()) {
      beating.value = false;
      shownExpression.value = next;
      return;
    }
    beatPhase.value = beatPhase.value === 'even' ? 'odd' : 'even';
    beating.value = true;
    swapTimer = setTimeout(() => {
      shownExpression.value = next;
    }, NINO_BEAT.swapAt);
    beatTimer = setTimeout(() => {
      beating.value = false;
    }, NINO_BEAT.duration);
  },
);

// Motion switched off mid-beat: the beat is over, and the face it was hiding
// shows now rather than when the swap timer would have fired.
watch(
  () => props.animated,
  (animated) => {
    if (animated) return;
    clearBeat();
    beating.value = false;
    shownExpression.value = props.expression;
  },
);

const activeAction = ref<I9kNinoAction | null>(null);
/** Re-keys the stage, so every play() starts its keyframes at frame 0, even a repeat. */
const run = ref(0);
let actionTimer: ReturnType<typeof setTimeout> | undefined;
let settleAction: ((completed: boolean, notify: boolean) => void) | undefined;

function endAction(completed: boolean, notify = true) {
  const settle = settleAction;
  settleAction = undefined;
  clearTimeout(actionTimer);
  activeAction.value = null;
  settle?.(completed, notify);
}

let playCalls = 0;

/**
 * Plays one action. A newer call cuts the running one off (it settles with
 * completed: false), so every call settles exactly once and an await never
 * hangs. With motion off it moves nothing and reports completion at once.
 */
function play(action: I9kNinoAction): Promise<I9kNinoActionResult> {
  const call = ++playCalls;
  endAction(false);

  // Ending the cut-off call ran its action-end handler, which may already have
  // started a newer action. That newer call wins, and this one never starts. It
  // resolves without emitting: a handler that plays again on every action-end
  // would answer this emit by cutting off its own action, without end.
  if (call !== playCalls) {
    return Promise.resolve({ action, completed: false });
  }

  if (!motionAllowed()) {
    const result = { action, completed: true };
    return Promise.resolve().then(() => {
      emit('action-end', result);
      return result;
    });
  }

  return new Promise((resolve) => {
    activeAction.value = action;
    run.value += 1;
    settleAction = (completed, notify) => {
      const result = { action, completed };
      // Resolve first: a throwing handler must not leave the await hanging.
      resolve(result);
      if (notify) emit('action-end', result);
    };
    actionTimer = setTimeout(() => endAction(true), NINO_ACTION_DURATIONS[action]);
  });
}

onBeforeUnmount(() => {
  clearBeat();
  endAction(false, false);
});

const exposed: I9kNinoExposed = { play };
defineExpose(exposed);

/**
 * Bound as an attribute object rather than `:style`, so an idle Nino carries no
 * style key at all: the server renders `:style="undefined"` as `style=""`, which
 * a strict Content-Security-Policy reports.
 */
const actionAttrs = computed(() =>
  activeAction.value
    ? { style: { '--i9k-nino-action-duration': `${NINO_ACTION_DURATIONS[activeAction.value]}ms` } }
    : {},
);

const face = computed(() => NINO_FACES[shownExpression.value]);
/** The right-hand hand on screen peeks, on every page: hands are drawn, not read. */
const handClasses = (index: number) => [
  'i9k-nino__hand',
  ...(index === 1 ? ['i9k-nino__hand--peek'] : []),
];
const classes = computed(() => [
  'i9k-nino',
  `i9k-nino--${shownExpression.value}`,
  `i9k-nino--look-${props.look}`,
  `i9k-nino--${props.size}`,
  ...(props.animated ? ['i9k-nino--animated'] : []),
  ...(beating.value ? ['i9k-nino--beat', `i9k-nino--beat-${beatPhase.value}`] : []),
  ...(props.talking ? ['i9k-nino--talking'] : []),
  ...(activeAction.value ? ['i9k-nino--acting', `i9k-nino--action-${activeAction.value}`] : []),
]);
</script>

<template>
  <svg
    :class="classes"
    v-bind="actionAttrs"
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
    <g :key="run" class="i9k-nino__stage" data-nino-part="stage">
      <rect
        v-if="shadow"
        class="i9k-nino__shadow"
        data-nino-part="shadow"
        x="14"
        y="58"
        width="36"
        height="2"
      />
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
          <path
            v-if="talking"
            class="i9k-nino__mouth i9k-nino__mouth--talk"
            data-nino-part="talk-mouth"
            :d="face.talkMouth ?? NINO_TALK_MOUTH"
          />
          <template v-for="(hand, index) in face.hands" :key="`hand-${index}`">
            <path
              v-if="'d' in hand"
              :class="handClasses(index)"
              data-nino-part="hand"
              :d="hand.d"
            />
            <rect v-else :class="handClasses(index)" data-nino-part="hand" v-bind="hand" />
          </template>
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
  --i9k-nino-dir: 1;
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

.i9k-nino__hand {
  fill: var(--i9k-nino-body);
}

/* Hiding raises the arms to his face: the side arms go, the hands show. An
   action lowers them again for its length, so a wave still has an arm. */
.i9k-nino--hiding:not(.i9k-nino--acting) .i9k-nino__arm,
.i9k-nino--hiding.i9k-nino--acting .i9k-nino__hand {
  visibility: hidden;
}

/* A glance would slide his eyes out from behind his hands. */
.i9k-nino--hiding .i9k-nino__eyes {
  transform: none;
}

.i9k-nino__eye,
.i9k-nino__brow,
.i9k-nino__antenna {
  fill: var(--i9k-nino-eye);
}

.i9k-nino__mouth {
  fill: var(--i9k-nino-mouth);
}

/* The open frame stays hidden unless the talk keyframes show it, so a still or
   reduced-motion Nino who is talking keeps his ordinary mouth. */
.i9k-nino__mouth--talk {
  visibility: hidden;
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

/* Reading direction as a sign, for keyframes that glance toward start or end. */
[dir='rtl'] .i9k-nino,
.i9k-nino[dir='rtl'] {
  --i9k-nino-dir: -1;
}

/* Motion is stepped, never eased: every keyframe lands on the two-unit grid,
   so Nino moves like a sprite and never blurs between device pixels. A layer
   with several possible animations takes the last matching rule, so the rules
   below run from the most ambient to the most deliberate, and the
   reduced-motion block stays last. Anything that lifts him moves the figure,
   so his feet come along; upper only dips or slides. */

/* Ambient life */
.i9k-nino--animated .i9k-nino__upper {
  animation: i9k-nino-breathe 2.4s steps(1, end) infinite;
}

.i9k-nino--animated .i9k-nino__antenna {
  animation: i9k-nino-antenna 3.2s steps(1, end) infinite;
}

.i9k-nino--animated.i9k-nino--thinking .i9k-nino__antenna {
  animation: i9k-nino-antenna 1.2s steps(1, end) infinite;
}

.i9k-nino--animated:not(.i9k-nino--eyes-closed) .i9k-nino__eye {
  animation: i9k-nino-blink 13s steps(1, end) infinite;
}

/* Only an idle Nino with nowhere to look glances about; a caller's look wins. */
.i9k-nino--animated.i9k-nino--idle.i9k-nino--look-center .i9k-nino__eyes {
  animation: i9k-nino-look-around 9s steps(1, end) infinite;
}

/* Expression motion */
.i9k-nino--animated.i9k-nino--happy .i9k-nino__figure {
  animation: i9k-nino-hop 3.2s steps(1, end) infinite;
}

.i9k-nino--animated.i9k-nino--thinking .i9k-nino__figure {
  animation: i9k-nino-bob 2.4s steps(1, end) infinite;
}

.i9k-nino--animated.i9k-nino--worried .i9k-nino__figure {
  animation: i9k-nino-shiver 0.6s steps(1, end) infinite;
}

/* Hide and seek: now and then the right hand drops far enough for his open eye
   to peek over it, then covers it again. */
.i9k-nino--animated.i9k-nino--hiding .i9k-nino__hand--peek {
  animation: i9k-nino-peek 5s steps(1, end) infinite;
}

@keyframes i9k-nino-breathe {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(2px);
  }
}

@keyframes i9k-nino-antenna {
  0%,
  90%,
  100% {
    opacity: 1;
  }

  82% {
    opacity: 0.3;
  }
}

/* Two single blinks and a double one per cycle, so it never feels metronomic. */
@keyframes i9k-nino-blink {
  0%,
  31%,
  63%,
  93%,
  95.5%,
  100% {
    transform: scaleY(1);
  }

  30%,
  62%,
  92%,
  94.5% {
    transform: scaleY(0.15);
  }
}

@keyframes i9k-nino-look-around {
  0%,
  78%,
  100% {
    transform: translateX(0);
  }

  62% {
    transform: translateX(calc(var(--i9k-nino-dir) * -4px));
  }

  70% {
    transform: translateX(calc(var(--i9k-nino-dir) * 4px));
  }
}

@keyframes i9k-nino-hop {
  0%,
  90%,
  100% {
    transform: translateY(0);
  }

  85% {
    transform: translateY(-2px);
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

@keyframes i9k-nino-peek {
  0%,
  88%,
  100% {
    transform: translateY(0);
  }

  76% {
    transform: translateY(10px);
  }
}

@keyframes i9k-nino-shiver {
  0%,
  50%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-2px);
  }

  75% {
    transform: translateX(2px);
  }
}

/* Mood beat: the eyes shut and the body hops while the face is swapped behind
   them. 240ms and the swap at 100ms are NINO_BEAT in src/data/nino.ts. The two
   phases are identical; alternating between them restarts the keyframes when a
   mood arrives mid-beat. */
.i9k-nino--animated.i9k-nino--beat-even .i9k-nino__eye {
  animation: i9k-nino-beat-blink 240ms steps(1, end);
}

.i9k-nino--animated.i9k-nino--beat-odd .i9k-nino__eye {
  animation: i9k-nino-beat-blink-again 240ms steps(1, end);
}

.i9k-nino--animated.i9k-nino--beat-even .i9k-nino__figure {
  animation: i9k-nino-beat-hop 240ms steps(1, end);
}

.i9k-nino--animated.i9k-nino--beat-odd .i9k-nino__figure {
  animation: i9k-nino-beat-hop-again 240ms steps(1, end);
}

@keyframes i9k-nino-beat-blink {
  0% {
    transform: scaleY(0.15);
  }

  60%,
  100% {
    transform: scaleY(1);
  }
}

@keyframes i9k-nino-beat-blink-again {
  0% {
    transform: scaleY(0.15);
  }

  60%,
  100% {
    transform: scaleY(1);
  }
}

@keyframes i9k-nino-beat-hop {
  0% {
    transform: translateY(-2px);
  }

  60%,
  100% {
    transform: translateY(0);
  }
}

@keyframes i9k-nino-beat-hop-again {
  0% {
    transform: translateY(-2px);
  }

  60%,
  100% {
    transform: translateY(0);
  }
}

/* Talking swaps two mouth frames rather than scaling one, so it stays on the grid. */
.i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth {
  animation: i9k-nino-talk-closed 400ms steps(1, end) infinite;
}

.i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth--talk {
  animation: i9k-nino-talk-open 400ms steps(1, end) infinite;
}

@keyframes i9k-nino-talk-closed {
  0%,
  100% {
    visibility: visible;
  }

  50% {
    visibility: hidden;
  }
}

@keyframes i9k-nino-talk-open {
  0%,
  100% {
    visibility: hidden;
  }

  50% {
    visibility: visible;
  }
}

/* Actions: one-shots from play(). Each pauses the ambient motion of the layers
   it shares, and its length comes from NINO_ACTION_DURATIONS through
   --i9k-nino-action-duration. The look-center part of the eyes selector only
   matches the look-around rule's specificity. */
.i9k-nino--animated.i9k-nino--acting .i9k-nino__upper,
.i9k-nino--animated.i9k-nino--acting .i9k-nino__figure,
.i9k-nino--animated.i9k-nino--acting.i9k-nino--look-center .i9k-nino__eyes {
  animation: none;
}

/* The wave uses the right-hand arm on every page: arms are drawn, not read. */
.i9k-nino--animated.i9k-nino--action-wave .i9k-nino__arm--right {
  animation: i9k-nino-wave var(--i9k-nino-action-duration) steps(1, end);
}

.i9k-nino--animated.i9k-nino--action-jump .i9k-nino__figure {
  animation: i9k-nino-jump var(--i9k-nino-action-duration) steps(1, end);
}

.i9k-nino--animated.i9k-nino--action-jump .i9k-nino__arm {
  animation: i9k-nino-jump-arms var(--i9k-nino-action-duration) steps(1, end);
}

.i9k-nino--animated.i9k-nino--action-jump .i9k-nino__shadow {
  animation: i9k-nino-jump-shadow var(--i9k-nino-action-duration) steps(1, end);
}

.i9k-nino--animated.i9k-nino--action-nod .i9k-nino__upper {
  animation: i9k-nino-nod var(--i9k-nino-action-duration) steps(1, end);
}

.i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper {
  animation: i9k-nino-shake var(--i9k-nino-action-duration) steps(1, end);
}

@keyframes i9k-nino-wave {
  0%,
  28%,
  56% {
    transform: translate(0, -16px);
  }

  14%,
  42%,
  70% {
    transform: translate(-2px, -18px);
  }

  86%,
  100% {
    transform: translate(0, 0);
  }
}

@keyframes i9k-nino-jump {
  0%,
  70% {
    transform: translateY(2px);
  }

  15%,
  55% {
    transform: translateY(-6px);
  }

  30% {
    transform: translateY(-12px);
  }

  82%,
  100% {
    transform: translateY(0);
  }
}

@keyframes i9k-nino-jump-arms {
  0%,
  70%,
  100% {
    transform: translateY(0);
  }

  15% {
    transform: translateY(-14px);
  }
}

/* The shadow is the one part off the grid: it is a soft hint, not a pixel. */
@keyframes i9k-nino-jump-shadow {
  0%,
  70% {
    transform: scaleX(1.1);
  }

  15%,
  55% {
    transform: scaleX(0.8);
  }

  30% {
    transform: scaleX(0.6);
  }

  82%,
  100% {
    transform: scaleX(1);
  }
}

@keyframes i9k-nino-nod {
  0%,
  40% {
    transform: translateY(4px);
  }

  20%,
  60%,
  100% {
    transform: translateY(0);
  }
}

@keyframes i9k-nino-shake {
  0%,
  33%,
  66% {
    transform: translateX(-2px);
  }

  16%,
  50% {
    transform: translateX(2px);
  }

  83%,
  100% {
    transform: translateX(0);
  }
}

/* The expression lives in the markup, never in a keyframe, so switching motion
   off leaves the chosen face exactly as it was drawn. Every animated selector
   above is listed here; keep this block last. */
@media (prefers-reduced-motion: reduce) {
  .i9k-nino--animated .i9k-nino__upper,
  .i9k-nino--animated .i9k-nino__antenna,
  .i9k-nino--animated.i9k-nino--thinking .i9k-nino__antenna,
  .i9k-nino--animated:not(.i9k-nino--eyes-closed) .i9k-nino__eye,
  .i9k-nino--animated.i9k-nino--idle.i9k-nino--look-center .i9k-nino__eyes,
  .i9k-nino--animated.i9k-nino--happy .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--thinking .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--worried .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--hiding .i9k-nino__hand--peek,
  .i9k-nino--animated.i9k-nino--beat-even .i9k-nino__eye,
  .i9k-nino--animated.i9k-nino--beat-odd .i9k-nino__eye,
  .i9k-nino--animated.i9k-nino--beat-even .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--beat-odd .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth,
  .i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth--talk,
  .i9k-nino--animated.i9k-nino--action-wave .i9k-nino__arm--right,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__arm,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__shadow,
  .i9k-nino--animated.i9k-nino--action-nod .i9k-nino__upper,
  .i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper {
    animation: none;
  }
}
</style>
