# Nino Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `I9kNino` refined pixel art, ambient life, a reaction beat on mood changes, a `talking` state and imperative one-shot actions (`wave`, `jump`, `nod`, `shake`). Existing consumers must keep working unchanged.

**Architecture:** Face data moves to `src/data/nino.ts`. The SVG gains fixed motion layers: `stage` (re-keyed per action) › `figure` › `upper` › `arm`/`eyes`. Each animation targets one layer, so transforms never collide. Every motion is a CSS keyframe with `steps(1, end)` on a 2-unit grid. The JS only toggles classes and timers, and uses the same "may Nino move?" rule as the CSS.

**Tech Stack:** Vue 3.5 `<script setup>` SFC, scoped CSS keyframes, Vitest 4 + @vue/test-utils (jsdom), PostCSS-inspected Vite builds for CSS contracts, Storybook, and the showcase registry.

**Spec:** `docs/superpowers/specs/2026-10-07-nino-polish-design.md` (it builds on `docs/superpowers/specs/2026-09-11-nino-mascot-design.md`)

## Global Constraints

- viewBox stays `0 0 64 64` with `shape-rendering="crispEdges"`. Every coordinate and every keyframe offset is a multiple of **2** (the shadow's `scaleX` is the one exception).
- Every non-`none` `animation` uses `steps(1, end)`. No easing curves anywhere.
- Every animated selector has a matching `animation: none` inside `@media (prefers-reduced-motion: reduce)`, and that block stays **last** in the stylesheet.
- `animated: false` removes `.i9k-nino--animated`, and every animation rule hangs off that class.
- JS motion gate: `props.animated && !matchMedia('(prefers-reduced-motion: reduce)').matches`. A missing `window` or `matchMedia` counts as no reduced-motion preference, but a missing `window` means no motion.
- Mood beat: `NINO_BEAT = { swapAt: 100, duration: 240 }` (ms).
- Action durations: `wave` 1000 ms, `jump` 800 ms, `nod` 900 ms, `shake` 700 ms, held only in `NINO_ACTION_DURATIONS`.
- Talking cycle: 400 ms.
- New custom properties: `--i9k-nino-cheek: color-mix(in srgb, var(--accent-color) 45%, transparent)`, `--i9k-nino-glint: color-mix(in srgb, var(--white-color) 22%, transparent)`.
- No new runtime dependencies, image files, or JS frame loops.
- Public API is additive: the six expression names, `look`, `size` (including `auto`), `animated`, `label` and all existing `--i9k-nino-*` properties keep their meaning.
- Prettier: 2 spaces, single quotes, trailing commas, 100-column print width. Commits are Conventional Commits and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **`play()` mashed** (several calls before any finishes): every promise settles exactly once, earlier ones with `completed: false`, and only the last completes. Tested in Task 5.
2. **`expression` changes while an action runs:** the face still swaps through the beat and the action keeps playing. Tested in Task 5.
3. **Unmount mid-beat or mid-action:** no timers are left behind, a pending `play()` resolves with `completed: false`, and nothing is emitted after unmount. Tested in Tasks 3 and 5.
4. **`talking` under reduced motion or `animated: false`:** he shows his ordinary mouth, never the open frame stuck on screen. Tested in Task 4.
5. **Look-around on an RTL page:** the glance sequence mirrors with the reading direction. Tested in Task 2.

---

## File Structure

| File                                           | Responsibility                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/data/nino.ts` (create)                    | Pure data: `NinoShape`, `NinoFace`, `NINO_FACES`, `NINO_TALK_MOUTH`, `NINO_BEAT`, `NINO_ACTION_DURATIONS`. |
| `src/types/components.ts` (modify)             | Public action types: `I9K_NINO_ACTIONS`, `I9kNinoAction`, `I9kNinoActionResult`, `I9kNinoExposed`.         |
| `src/components/I9kNino.vue` (modify)          | Template layers, props, mood beat, `play()`, scoped CSS.                                                   |
| `src/index.ts` (modify)                        | Re-exports the new types and constant.                                                                     |
| `tests/I9kNino.test.ts` (modify)               | All Nino behaviour and compiled-CSS contracts.                                                             |
| `tests/I9kComponentContracts.test.ts` (modify) | Pins the new export statements.                                                                            |
| `stories/I9kNino.stories.ts` (modify)          | Actions, talking and ambient stories.                                                                      |
| `showcase/registry/I9kNino.ts` (modify)        | Agent prompt, gotchas and demos.                                                                           |
| `AGENTS.md` (modify)                           | One convention bullet for Nino's imperative actions.                                                       |

---

### Task 1: Refined art and face data

**Files:**

- Create: `src/data/nino.ts`
- Modify: `src/components/I9kNino.vue` (whole file below)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Produces: `NinoShape`, `NinoFace`, `NINO_FACES: Record<I9kNinoExpression, NinoFace>`, `NINO_TALK_MOUTH: string` from `src/data/nino.ts`.
- Produces the DOM contract later tasks rely on:
  - `data-nino-part` values `stage`, `shadow`, `figure`, `leg`, `foot`, `upper`, `arm`, `antenna-stem`, `antenna`, `head`, `screen`, `glint`, `cheek`, `brow`, `eyes`, `eye`, `mouth`.
  - Classes `i9k-nino__stage`, `__shadow`, `__figure`, `__upper`, `__arm`, `__arm--left`, `__arm--right`, `__body`, `__antenna`, `__screen`, `__glint`, `__cheek`, `__brow`, `__eyes`, `__eye`, `__mouth`.

- [ ] **Step 1: Write the failing tests**

In `tests/I9kNino.test.ts`, change the `@vue/test-utils` import to:

```ts
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils';
```

Add these helpers directly below `isReducedMotionRule`:

```ts
/** Every number in a drawn part's geometry: a rect's box or a path's coordinates. */
function coordinatesOf(part: DOMWrapper<Element>): number[] {
  const d = part.attributes('d');
  if (d !== undefined) return (d.match(/\d+/g) ?? []).map(Number);
  return (['x', 'y', 'width', 'height'] as const).map((name) => Number(part.attributes(name)));
}

/** The height of a rect, or of a path drawn with absolute M, H and V commands. */
function verticalExtent(part: DOMWrapper<Element>): number {
  const d = part.attributes('d');
  if (d === undefined) return Number(part.attributes('height'));
  const ys: number[] = [];
  for (const [, command, args] of d.matchAll(/([MHVZ])([^MHVZ]*)/g)) {
    const numbers = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (command === 'M') ys.push(numbers[1]);
    if (command === 'V') ys.push(numbers[0]);
  }
  return Math.max(...ys) - Math.min(...ys);
}

function drawnParts(wrapper: VueWrapper) {
  return wrapper
    .findAll('[data-nino-part]')
    .filter((part) => ['rect', 'path'].includes(part.element.tagName.toLowerCase()));
}
```

Replace the test `'draws brows only for the expression that declares them'` with:

```ts
it('draws brows only for the moods that raise or knit them', () => {
  for (const expression of I9K_NINO_EXPRESSIONS) {
    const brows = mount(I9kNino, { props: { expression } }).findAll('[data-nino-part="brow"]');
    expect(brows).toHaveLength(expression === 'thinking' || expression === 'worried' ? 2 : 0);
  }
});
```

In `'closes the eyes into flatter shapes than the open ones'`, replace the two height lines with:

```ts
const openHeight = verticalExtent(open[0]);
const closedHeight = verticalExtent(closed[0]);
```

In `'moves only the eyes when it looks somewhere'`, compare the head's path instead of its `x`:

```ts
expect(wrapper.get('[data-nino-part="head"]').attributes('d')).toBe(
  mount(I9kNino).get('[data-nino-part="head"]').attributes('d'),
);
```

Replace both grid tests (`'draws on a whole-number pixel grid…'` and the `it.each` `'keeps every %s coordinate on the four-unit grid'`) with:

```ts
it('draws on a crisp 64-unit canvas', () => {
  const wrapper = mount(I9kNino);

  expect(wrapper.get('svg').attributes('shape-rendering')).toBe('crispEdges');
  expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 64 64');
});

// The grid is what keeps Nino crisp at 32px, and a single stray coordinate in
// one path is invisible in review but not on screen.
it.each(I9K_NINO_EXPRESSIONS)('keeps every %s coordinate on the two-unit grid', (expression) => {
  const wrapper = mount(I9kNino, { props: { expression } });
  const parts = drawnParts(wrapper);

  expect(parts.length).toBeGreaterThan(10);
  expect(parts.flatMap(coordinatesOf).filter((value) => value % 2 !== 0)).toEqual([]);
});

it.each(I9K_NINO_EXPRESSIONS)('keeps his body whole when %s', (expression) => {
  const wrapper = mount(I9kNino, { props: { expression } });

  for (const part of ['antenna', 'antenna-stem', 'glint', 'shadow', 'head', 'screen']) {
    expect(wrapper.findAll(`[data-nino-part="${part}"]`)).toHaveLength(1);
  }
  expect(wrapper.findAll('[data-nino-part="leg"]')).toHaveLength(2);
  expect(wrapper.findAll('[data-nino-part="foot"]')).toHaveLength(2);
  expect(wrapper.findAll('[data-nino-part="arm"]')).toHaveLength(2);
});

it('blushes only when happy or resting his eyes', () => {
  for (const expression of I9K_NINO_EXPRESSIONS) {
    const cheeks = mount(I9kNino, { props: { expression } }).findAll('[data-nino-part="cheek"]');
    expect(cheeks).toHaveLength(expression === 'happy' || expression === 'eyes-closed' ? 2 : 0);
  }
});
```

In the `'I9kNino compiled styles'` describe, extend `'reads its colours from overridable custom properties'` with:

```ts
expect(source).toContain('--i9k-nino-cheek');
expect(source).toContain('--i9k-nino-glint');
```

and add:

```ts
it('lets a jump or a raised arm leave his box', async () => {
  const stylesheet = await buildComponentStylesheet('I9kNino');
  let visible = false;

  stylesheet.walkDecls('overflow', (decl) => {
    const rule = decl.parent as Rule;
    if (/^\.i9k-nino\[data-v-[\w-]+\]$/.test(rule.selector) && decl.value === 'visible') {
      visible = true;
    }
  });

  expect(visible).toBe(true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: FAIL. The new antenna, legs, glint and shadow tests, the cheeks test, the thinking brows, the head `d` comparison, and the overflow and colour tests fail because the parts don't exist yet.

- [ ] **Step 3: Create the face data**

Create `src/data/nino.ts`:

```ts
import type { I9kNinoExpression } from '../types/components';

/**
 * A rectangle or a path in Nino's 64-unit viewBox. Every coordinate is a
 * multiple of two: the viewBox holds a 32x32 pixel grid, so nothing lands
 * between device pixels when he is drawn at 32px.
 */
export type NinoShape = { x: number; y: number; width: number; height: number } | { d: string };

/**
 * One mood. Expressions change only the eyes, brows, cheeks and mouth; the
 * body never changes, which is what keeps one character recognisable across
 * six moods. Adding an expression is adding a row, never editing the template.
 */
export interface NinoFace {
  eyes: [NinoShape, NinoShape];
  brows?: [NinoShape, NinoShape];
  cheeks?: boolean;
  /** Path data. Every expression owns a mouth; no expression borrows another's. */
  mouth: string;
  /** The open frame while talking. Falls back to NINO_TALK_MOUTH. */
  talkMouth?: string;
}

const box = (x: number, y: number, width: number, height: number): NinoShape => ({
  x,
  y,
  width,
  height,
});

export const NINO_FACES: Record<I9kNinoExpression, NinoFace> = {
  idle: {
    eyes: [box(18, 16, 12, 12), box(34, 16, 12, 12)],
    mouth: 'M18 32H22V34H42V32H46V36H44V38H40V40H24V38H20V36H18Z',
  },
  happy: {
    eyes: [
      { d: 'M20 20H28V22H30V28H26V24H22V28H18V22H20Z' },
      { d: 'M36 20H44V22H46V28H42V24H38V28H34V22H36Z' },
    ],
    cheeks: true,
    mouth: 'M18 32H46V34H44V38H40V40H24V38H20V34H18Z',
  },
  thinking: {
    eyes: [box(18, 22, 12, 4), box(34, 16, 12, 12)],
    brows: [box(18, 18, 10, 2), box(34, 12, 12, 2)],
    mouth: 'M32 34H42V38H32Z',
  },
  worried: {
    eyes: [box(20, 22, 8, 8), box(36, 22, 8, 8)],
    brows: [{ d: 'M18 18H22V16H28V18H22V20H18Z' }, { d: 'M36 16H42V18H46V20H42V18H36Z' }],
    mouth: 'M20 40V36H24V34H40V36H44V40H40V38H24V40Z',
  },
  surprised: {
    eyes: [box(18, 14, 12, 16), box(34, 14, 12, 16)],
    mouth: 'M28 34H36V36H38V40H36V42H28V40H26V36H28Z',
  },
  'eyes-closed': {
    eyes: [{ d: 'M18 22H20V24H28V22H30V26H18Z' }, { d: 'M34 22H36V24H44V22H46V26H34Z' }],
    cheeks: true,
    mouth: 'M22 34H26V36H38V34H42V38H38V40H26V38H22Z',
  },
};

/** The shared open-mouth frame Nino talks with. */
export const NINO_TALK_MOUTH = 'M22 32H42V34H44V38H42V40H22V38H20V34H22Z';
```

- [ ] **Step 4: Rewrite the component with the refined art**

Replace `src/components/I9kNino.vue` with:

```vue
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
```

(The animation rules are unchanged in this task. Task 2 replaces them.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts tests/I9kChat.test.ts`
Expected: PASS.

Then run `npm run typecheck`. Expected: no errors. vue-tsc must narrow `'d' in brow` / `'d' in eye` in the `v-if`/`v-else` pair. If it does not, replace the `v-else` `v-bind="brow"` with explicit `:x`/`:y`/`:width`/`:height` bindings behind an `isPath(shape): shape is { d: string }` type guard exported from `src/data/nino.ts`.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: refine Nino's pixel art on a two-unit grid

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Ambient life

**Files:**

- Modify: `src/components/I9kNino.vue` (style block only)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: the layer classes from Task 1.
- Produces:
  - The root custom property `--i9k-nino-dir` (`1`, or `-1` under RTL).
  - The ordering rule the remaining tasks follow: animation rules run from the most ambient to the most deliberate, and the reduced-motion block stays last, listing every animated selector in one rule.

- [ ] **Step 1: Write the failing tests**

Add `beforeAll` to the `vitest` import in `tests/I9kNino.test.ts`. Add this helper below `drawnParts`:

```ts
/** Every `animation` declaration outside the reduced-motion block, with its selector. */
function animationRules(stylesheet: Root) {
  const found: { selector: string; value: string }[] = [];
  stylesheet.walkDecls('animation', (decl) => {
    const rule = decl.parent as Rule;
    if (!isReducedMotionRule(rule)) found.push({ selector: rule.selector, value: decl.value });
  });
  return found;
}
```

Append this describe to the end of the file:

```ts
describe('I9kNino ambient life', () => {
  let stylesheet: Root;

  beforeAll(async () => {
    stylesheet = await buildComponentStylesheet('I9kNino');
  });

  it('moves like a sprite: every animation is stepped, never eased', () => {
    const moving = animationRules(stylesheet).filter(({ value }) => value !== 'none');

    expect(moving.length).toBeGreaterThan(0);
    for (const { selector, value } of moving) {
      expect(value, selector).toMatch(/steps\(1,\s*end\)/);
    }
  });

  it('breathes, blinks and pulses his antenna in every mood', () => {
    const rules = animationRules(stylesheet);
    const valueFor = (fragment: string) =>
      rules.find(({ selector }) => selector.includes(fragment))?.value;

    expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('i9k-nino-breathe');
    expect(valueFor('.i9k-nino--animated .i9k-nino__antenna')).toContain('i9k-nino-antenna');
    expect(valueFor(':not(.i9k-nino--eyes-closed) .i9k-nino__eye')).toContain('i9k-nino-blink');
  });

  it('glances about only when idle and free to look', () => {
    const glances = animationRules(stylesheet).filter(
      ({ selector, value }) => selector.includes('.i9k-nino__eyes') && value !== 'none',
    );

    expect(glances.length).toBeGreaterThan(0);
    for (const { selector } of glances) {
      expect(selector).toContain('.i9k-nino--idle');
      expect(selector).toContain('.i9k-nino--look-center');
    }
  });

  it('glances the other way first on a right-to-left page', () => {
    const flips: string[] = [];
    stylesheet.walkDecls('--i9k-nino-dir', (decl) => {
      if (decl.value.trim() === '-1') flips.push((decl.parent as Rule).selector);
    });

    expect(flips.join(' ')).toContain('rtl');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts -t 'ambient life'`
Expected: FAIL. The bob and shiver are `ease-in-out`, and there are no breathe, antenna, look-around or `--i9k-nino-dir` rules.

- [ ] **Step 3: Implement ambient motion**

In the `.i9k-nino` root rule, add `--i9k-nino-dir: 1;` after `--i9k-nino-look-y: 0;`.

Directly after the two `[dir='rtl'] .i9k-nino--look-…` rules, add:

```css
/* Reading direction as a sign, for keyframes that glance toward start or end. */
[dir='rtl'] .i9k-nino,
.i9k-nino[dir='rtl'] {
  --i9k-nino-dir: -1;
}
```

Replace everything from `.i9k-nino--animated:not(.i9k-nino--eyes-closed) .i9k-nino__eye {` to the end of the `<style>` block with:

```css
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
  .i9k-nino--animated.i9k-nino--worried .i9k-nino__figure {
    animation: none;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: PASS, including the existing `'stops every animation under prefers-reduced-motion'`.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: give Nino stepped ambient life

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Mood beat

**Files:**

- Modify: `src/data/nino.ts`, `src/components/I9kNino.vue`
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Produces:
  - `NINO_BEAT = { swapAt: 100, duration: 240 } as const` from `src/data/nino.ts`.
  - The component-internal `motionAllowed(): boolean`, which Task 5 reuses.
  - The root class `i9k-nino--beat`.
  - The root expression class `i9k-nino--<expression>`, which now follows `shownExpression`. Task 5's tests rely on that.

- [ ] **Step 1: Write the failing tests**

In `tests/I9kNino.test.ts`:

- Change the vitest import to `import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';`.
- Add `import { nextTick } from 'vue';`.
- Add `import { NINO_BEAT } from '../src/data/nino';`.

Add these helpers below `animationRules`:

```ts
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// jsdom has never implemented window.matchMedia.
function stubReducedMotion() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches: media === REDUCED_MOTION_QUERY,
    addEventListener() {},
    removeEventListener() {},
  }));
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await nextTick();
}
```

Append:

```ts
describe('I9kNino mood beat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('blinks the old face shut and swaps the new one in behind its eyes', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'worried' });
    expect(wrapper.classes()).toContain('i9k-nino--beat');
    expect(wrapper.classes()).toContain('i9k-nino--idle');
    expect(wrapper.findAll('[data-nino-part="brow"]')).toHaveLength(0);

    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toContain('i9k-nino--worried');
    expect(wrapper.findAll('[data-nino-part="brow"]')).toHaveLength(2);
    expect(wrapper.classes()).toContain('i9k-nino--beat');

    await advance(NINO_BEAT.duration - NINO_BEAT.swapAt);
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('lands on the latest mood when moods change mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'worried' });
    await advance(NINO_BEAT.swapAt / 2);
    await wrapper.setProps({ expression: 'happy' });
    await advance(NINO_BEAT.swapAt / 2);
    expect(wrapper.classes()).toContain('i9k-nino--idle');

    await advance(NINO_BEAT.swapAt / 2);
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--worried');
  });

  it('swaps at once when it is not animating', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle', animated: false } });

    await wrapper.setProps({ expression: 'happy' });
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('swaps at once for a visitor who prefers reduced motion', async () => {
    stubReducedMotion();
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'happy' });
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('leaves no timer behind when it is unmounted mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'happy' });
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts -t 'mood beat'`
Expected: FAIL. `NINO_BEAT` is not exported, and the face swaps synchronously with no `i9k-nino--beat` class.

- [ ] **Step 3: Implement the beat**

Append to `src/data/nino.ts`:

```ts
/**
 * A change of mood plays as a beat rather than a cut: the eyes shut and the
 * body hops for `duration` ms, and the new face swaps in at `swapAt`, while the
 * eyes are closed. The CSS keyframes use the same 240ms.
 */
export const NINO_BEAT = { swapAt: 100, duration: 240 } as const;
```

In `I9kNino.vue`'s script:

- Change the Vue import to `import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';`.
- Change the data import to `import { NINO_BEAT, NINO_FACES } from '../data/nino';`.
- Replace the `face` and `classes` computeds with:

```ts
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
    beating.value = true;
    swapTimer = setTimeout(() => {
      shownExpression.value = next;
    }, NINO_BEAT.swapAt);
    beatTimer = setTimeout(() => {
      beating.value = false;
    }, NINO_BEAT.duration);
  },
);

onBeforeUnmount(clearBeat);

const face = computed(() => NINO_FACES[shownExpression.value]);
const classes = computed(() => [
  'i9k-nino',
  `i9k-nino--${shownExpression.value}`,
  `i9k-nino--look-${props.look}`,
  `i9k-nino--${props.size}`,
  ...(props.animated ? ['i9k-nino--animated'] : []),
  ...(beating.value ? ['i9k-nino--beat'] : []),
]);
```

In the style block, insert directly before the closing reduced-motion comment and `@media` block:

```css
/* Mood beat: the eyes shut and the body hops while the face is swapped behind
   them. 240ms and the swap at 100ms are NINO_BEAT in src/data/nino.ts. */
.i9k-nino--animated.i9k-nino--beat .i9k-nino__eye {
  animation: i9k-nino-beat-blink 240ms steps(1, end);
}

.i9k-nino--animated.i9k-nino--beat .i9k-nino__figure {
  animation: i9k-nino-beat-hop 240ms steps(1, end);
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

@keyframes i9k-nino-beat-hop {
  0% {
    transform: translateY(-2px);
  }

  60%,
  100% {
    transform: translateY(0);
  }
}
```

Then add these two selectors to the comma list in the reduced-motion rule:

```css
  .i9k-nino--animated.i9k-nino--beat .i9k-nino__eye,
  .i9k-nino--animated.i9k-nino--beat .i9k-nino__figure,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts tests/I9kChat.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: play a reaction beat when Nino's mood changes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Talking

**Files:**

- Modify: `src/components/I9kNino.vue`
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: `NINO_FACES` and `NINO_TALK_MOUTH` from Task 1.
- Produces:
  - The prop `talking?: boolean` (default `false`).
  - The root class `i9k-nino--talking`.
  - `data-nino-part="talk-mouth"` with classes `i9k-nino__mouth i9k-nino__mouth--talk`.

- [ ] **Step 1: Write the failing tests**

Change the data import in the test file to `import { NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../src/data/nino';` and append:

```ts
describe('I9kNino talking', () => {
  it('adds an open-mouth frame while talking', () => {
    const wrapper = mount(I9kNino, { props: { talking: true } });

    expect(wrapper.classes()).toContain('i9k-nino--talking');
    expect(wrapper.get('[data-nino-part="talk-mouth"]').attributes('d')).toBe(NINO_TALK_MOUTH);
    expect(wrapper.findAll('[data-nino-part="mouth"]')).toHaveLength(1);
  });

  it('keeps one plain mouth when quiet', () => {
    const wrapper = mount(I9kNino);

    expect(wrapper.classes()).not.toContain('i9k-nino--talking');
    expect(wrapper.find('[data-nino-part="talk-mouth"]').exists()).toBe(false);
  });

  it.each(I9K_NINO_EXPRESSIONS)('talks while %s and keeps the mouth of that mood', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression, talking: true } });

    expect(wrapper.get('[data-nino-part="mouth"]').attributes('d')).toBe(
      NINO_FACES[expression].mouth,
    );
    expect(wrapper.find('[data-nino-part="talk-mouth"]').exists()).toBe(true);
  });

  // With motion off, the talk keyframes never run, so the open frame must be
  // hidden by default rather than shown by default.
  it('keeps his ordinary mouth showing when talking cannot animate', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const hidden: string[] = [];

    stylesheet.walkDecls('visibility', (decl) => {
      const rule = decl.parent as Rule;
      if (rule.parent?.type === 'root' && decl.value === 'hidden') hidden.push(rule.selector);
    });

    expect(
      hidden.some((selector) => /^\.i9k-nino__mouth--talk\[data-v-[\w-]+\]$/.test(selector)),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts -t 'talking'`
Expected: FAIL. There's no `talking` prop, no talk-mouth part, and no hidden-by-default rule.

- [ ] **Step 3: Implement talking**

In the props type, after `animated?: boolean;` and its comment, add:

```ts
    /** While true, the mouth flaps between its own shape and an open frame. */
    talking?: boolean;
```

Add `talking: false` to the defaults object. Change the data import to `import { NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../data/nino';`. In `classes`, add after the beat line:

```ts
  ...(props.talking ? ['i9k-nino--talking'] : []),
```

In the template, directly after the mouth `<path>`, add:

```vue
<path
  v-if="talking"
  class="i9k-nino__mouth i9k-nino__mouth--talk"
  data-nino-part="talk-mouth"
  :d="face.talkMouth ?? NINO_TALK_MOUTH"
/>
```

In the style block, after the `.i9k-nino__mouth` fill rule, add:

```css
/* The open frame stays hidden unless the talk keyframes show it, so a still or
   reduced-motion Nino who is talking keeps his ordinary mouth. */
.i9k-nino__mouth--talk {
  visibility: hidden;
}
```

Before the reduced-motion comment and block (after the beat keyframes), add:

```css
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
```

Add to the reduced-motion comma list:

```css
  .i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth,
  .i9k-nino--animated.i9k-nino--talking .i9k-nino__mouth--talk,
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: let Nino talk

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Actions and `play()`

**Files:**

- Modify: `src/types/components.ts`, `src/data/nino.ts`, `src/components/I9kNino.vue`, `src/index.ts`
- Test: `tests/I9kNino.test.ts`, `tests/I9kComponentContracts.test.ts`

**Interfaces:**

- Consumes: `motionAllowed()`, `clearBeat()`, `shownExpression` and the `onBeforeUnmount` hook from Task 3.
- Produces:
  - `I9K_NINO_ACTIONS = ['wave', 'jump', 'nod', 'shake'] as const`.
  - `I9kNinoAction`.
  - `I9kNinoActionResult { action: I9kNinoAction; completed: boolean }`.
  - `I9kNinoExposed { play: (action: I9kNinoAction) => Promise<I9kNinoActionResult> }`.
  - `NINO_ACTION_DURATIONS: Record<I9kNinoAction, number>`.
  - The emit `action-end: [result: I9kNinoActionResult]`.
  - The root classes `i9k-nino--acting` and `i9k-nino--action-<name>`, and the root style `--i9k-nino-action-duration: <n>ms`.

- [ ] **Step 1: Write the failing tests**

In `tests/I9kNino.test.ts`:

- Change the types import to `import { I9K_NINO_ACTIONS, I9K_NINO_EXPRESSIONS, type I9kNinoExposed } from '../src/types/components';`.
- Change the data import to `import { NINO_ACTION_DURATIONS, NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../src/data/nino';`.

In `'stops every animation under prefers-reduced-motion'`, change the `else if` so an outright `animation: none` (the rule that pauses ambient motion during an action) is not mistaken for an animation:

```ts
        else if (!isReducedMotionRule(rule) && node.value !== 'none') animated.push(rule.selector);
```

Append:

```ts
describe('I9kNino actions', () => {
  const ninoOf = (wrapper: VueWrapper) => wrapper.vm as unknown as I9kNinoExposed;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(I9K_NINO_ACTIONS)('plays %s to the end and reports it', async (action) => {
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play(action);
    await nextTick();

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-nino--acting', `i9k-nino--action-${action}`]),
    );
    expect(wrapper.attributes('style')).toContain(
      `--i9k-nino-action-duration: ${NINO_ACTION_DURATIONS[action]}ms`,
    );

    await advance(NINO_ACTION_DURATIONS[action] - 1);
    expect(wrapper.emitted('action-end')).toBeUndefined();

    await advance(1);
    await expect(done).resolves.toEqual({ action, completed: true });
    expect(wrapper.emitted('action-end')).toEqual([[{ action, completed: true }]]);
    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
  });

  it('cuts a running action off when another starts', async () => {
    const wrapper = mount(I9kNino);
    const wave = ninoOf(wrapper).play('wave');
    await advance(100);
    const shake = ninoOf(wrapper).play('shake');

    await expect(wave).resolves.toEqual({ action: 'wave', completed: false });
    await nextTick();
    expect(wrapper.classes()).toContain('i9k-nino--action-shake');
    expect(wrapper.classes()).not.toContain('i9k-nino--action-wave');

    await advance(NINO_ACTION_DURATIONS.shake);
    await expect(shake).resolves.toEqual({ action: 'shake', completed: true });
    expect(wrapper.emitted('action-end')).toEqual([
      [{ action: 'wave', completed: false }],
      [{ action: 'shake', completed: true }],
    ]);
  });

  it('settles every call exactly once when the button is mashed', async () => {
    const wrapper = mount(I9kNino);
    const calls = [
      ninoOf(wrapper).play('jump'),
      ninoOf(wrapper).play('jump'),
      ninoOf(wrapper).play('jump'),
    ];

    await advance(NINO_ACTION_DURATIONS.jump);
    await expect(Promise.all(calls)).resolves.toEqual([
      { action: 'jump', completed: false },
      { action: 'jump', completed: false },
      { action: 'jump', completed: true },
    ]);
    expect(wrapper.emitted('action-end')).toHaveLength(3);
  });

  it('restarts the same action from its first frame', async () => {
    const wrapper = mount(I9kNino);
    void ninoOf(wrapper).play('nod');
    await nextTick();
    const firstStage = wrapper.get('[data-nino-part="stage"]').element;

    void ninoOf(wrapper).play('nod');
    await nextTick();
    expect(wrapper.get('[data-nino-part="stage"]').element).not.toBe(firstStage);
  });

  it('keeps acting while his mood changes', async () => {
    const wrapper = mount(I9kNino);
    void ninoOf(wrapper).play('jump');

    await wrapper.setProps({ expression: 'happy' });
    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-nino--happy', 'i9k-nino--action-jump']),
    );
  });

  it('reports at once and moves nothing when it is not animating', async () => {
    const wrapper = mount(I9kNino, { props: { animated: false } });
    const done = ninoOf(wrapper).play('wave');
    await nextTick();

    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
    await expect(done).resolves.toEqual({ action: 'wave', completed: true });
    expect(wrapper.emitted('action-end')).toEqual([[{ action: 'wave', completed: true }]]);
  });

  it('reports at once for a visitor who prefers reduced motion', async () => {
    stubReducedMotion();
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play('jump');
    await nextTick();

    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
    await expect(done).resolves.toEqual({ action: 'jump', completed: true });
  });

  it('settles a pending action quietly when unmounted', async () => {
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play('wave');

    wrapper.unmount();
    await expect(done).resolves.toEqual({ action: 'wave', completed: false });
    expect(wrapper.emitted('action-end')).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

In `tests/I9kComponentContracts.test.ts`, add after `levelMeterExports`:

```ts
const ninoExports = [
  `export type {
  I9kNinoAction,
  I9kNinoActionResult,
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoLook,
  I9kNinoSize,
} from './types/components';`,
  "export { I9K_NINO_ACTIONS, I9K_NINO_EXPRESSIONS } from './types/components';",
] as const;
```

and inside the describe, after the `levelMeterExports` case:

```ts
it.each(ninoExports)('exports %s', (statement) => {
  expect(indexSource).toContain(statement);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts tests/I9kComponentContracts.test.ts`
Expected: FAIL. `I9K_NINO_ACTIONS` and `NINO_ACTION_DURATIONS` don't exist, there's no `play`, and the export statements are missing.

- [ ] **Step 3: Add the public types**

In `src/types/components.ts`, directly after `export type I9kNinoSize = …;`, add:

```ts
/**
 * Nino's one-shot actions, played through the exposed `play()`. A runtime
 * array for the same reason as I9K_NINO_EXPRESSIONS.
 */
export const I9K_NINO_ACTIONS = ['wave', 'jump', 'nod', 'shake'] as const;

export type I9kNinoAction = (typeof I9K_NINO_ACTIONS)[number];

/** How a `play()` call ended: `completed` is false when another action or an unmount cut it off. */
export interface I9kNinoActionResult {
  action: I9kNinoAction;
  completed: boolean;
}

/** What a template ref to I9kNino exposes. */
export interface I9kNinoExposed {
  play: (action: I9kNinoAction) => Promise<I9kNinoActionResult>;
}
```

In `src/index.ts`, replace

```ts
export type { I9kNinoExpression, I9kNinoLook, I9kNinoSize } from './types/components';
export { I9K_NINO_EXPRESSIONS } from './types/components';
```

with

```ts
export type {
  I9kNinoAction,
  I9kNinoActionResult,
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoLook,
  I9kNinoSize,
} from './types/components';
export { I9K_NINO_ACTIONS, I9K_NINO_EXPRESSIONS } from './types/components';
```

In `src/data/nino.ts`, change the import to `import type { I9kNinoAction, I9kNinoExpression } from '../types/components';` and append:

```ts
/**
 * The one place an action's length lives. The component writes it to
 * --i9k-nino-action-duration for the keyframes and uses it for the timer that
 * ends the action, so the two can never drift apart.
 */
export const NINO_ACTION_DURATIONS: Record<I9kNinoAction, number> = {
  wave: 1000,
  jump: 800,
  nod: 900,
  shake: 700,
};
```

- [ ] **Step 4: Implement `play()`**

In `I9kNino.vue`'s script:

- Change the data import to `import { NINO_ACTION_DURATIONS, NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../data/nino';`.
- Change the types import to:

```ts
import type {
  I9kNinoAction,
  I9kNinoActionResult,
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoLook,
  I9kNinoSize,
} from '../types/components';
```

After `withDefaults(...)`, add:

```ts
const emit = defineEmits<{ 'action-end': [result: I9kNinoActionResult] }>();
```

Replace `onBeforeUnmount(clearBeat);` with:

```ts
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

/**
 * Plays one action. A newer call cuts the running one off (it settles with
 * completed: false), so every call settles exactly once and an await never
 * hangs. With motion off it moves nothing and reports completion at once.
 */
function play(action: I9kNinoAction): Promise<I9kNinoActionResult> {
  endAction(false);

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
      if (notify) emit('action-end', result);
      resolve(result);
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

const actionStyle = computed(() =>
  activeAction.value
    ? { '--i9k-nino-action-duration': `${NINO_ACTION_DURATIONS[activeAction.value]}ms` }
    : undefined,
);
```

In `classes`, add after the talking line:

```ts
  ...(activeAction.value ? ['i9k-nino--acting', `i9k-nino--action-${activeAction.value}`] : []),
```

In the template:

- Add `:style="actionStyle"` to the `<svg>` after `:class="classes"`.
- Change the stage group to `<g :key="run" class="i9k-nino__stage" data-nino-part="stage">`.

In the style block, insert before the reduced-motion comment and block (after the talking keyframes):

```css
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
```

Add to the reduced-motion comma list:

```css
  .i9k-nino--animated.i9k-nino--action-wave .i9k-nino__arm--right,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__figure,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__arm,
  .i9k-nino--animated.i9k-nino--action-jump .i9k-nino__shadow,
  .i9k-nino--animated.i9k-nino--action-nod .i9k-nino__upper,
  .i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper,
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts tests/I9kComponentContracts.test.ts tests/I9kChat.test.ts tests/showcaseRegistry.test.ts`
Expected: PASS. If `showcaseRegistry`'s prop or emit extraction fails on the new `defineEmits` type literal, stop and report it rather than reshaping the emit. The extractor already reads `defineEmits<{ … }>()` type literals (`showcase/extract/props.ts`, `readEmits`).

If jsdom drops the custom property from the serialized `style` attribute, assert on `(wrapper.element as SVGElement).style.getPropertyValue('--i9k-nino-action-duration')` instead. That is the same contract read through the CSSOM.

Then run `npm run typecheck`. Expected: no errors.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src tests
git add src/types/components.ts src/data/nino.ts src/components/I9kNino.vue src/index.ts tests/I9kNino.test.ts tests/I9kComponentContracts.test.ts
git commit -m "feat: add Nino actions played through play()

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Stories, showcase and repository guidance

**Files:**

- Modify: `stories/I9kNino.stories.ts`, `showcase/registry/I9kNino.ts`, `AGENTS.md`
- Test: `tests/showcaseRegistry.test.ts`, `tests/showcaseDemos.test.ts` (existing; no edits expected)

**Interfaces:**

- Consumes: `I9K_NINO_ACTIONS`, `I9kNinoAction`, `I9kNinoExposed`, the `talking` prop, and `play()`.

- [ ] **Step 1: Add the stories**

In `stories/I9kNino.stories.ts`:

- Change the imports to:

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import I9kNino from '../src/components/I9kNino.vue';
import {
  I9K_NINO_ACTIONS,
  I9K_NINO_EXPRESSIONS,
  type I9kNinoAction,
  type I9kNinoExposed,
} from '../src/types/components';
```

- Add `talking: false` to `meta.args`, and `talking: { control: 'boolean' }` to `argTypes`.
- Append:

```ts
// play() is imperative on purpose: pressing the same button twice replays the
// action, and the readout shows how each call ended.
export const Actions: Story = {
  render: () => ({
    components: { I9kNino },
    setup() {
      const nino = ref<I9kNinoExposed | null>(null);
      const last = ref('');
      const play = async (action: I9kNinoAction) => {
        const result = await nino.value?.play(action);
        if (result) last.value = `${result.action}: ${result.completed ? 'completed' : 'cut off'}`;
      };
      return { nino, play, actions: I9K_NINO_ACTIONS, last };
    },
    template: `<div style="${row}"><I9kNino ref="nino" size="lg" /><button v-for="action in actions" :key="action" type="button" @click="play(action)">{{ action }}</button><output>{{ last }}</output></div>`,
  }),
};

export const Talking: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div style="${row}"><I9kNino size="lg" talking /><I9kNino size="lg" expression="worried" talking /><I9kNino size="lg" expression="happy" talking /></div>`,
  }),
};

// Every mood with its ambient motion: breathing, blinking, the antenna, the
// idle glance, the happy hop, the thinking bob and the worried shiver.
export const AmbientLife: Story = {
  render: () => ({
    components: { I9kNino },
    setup: () => ({ expressions: I9K_NINO_EXPRESSIONS }),
    template: `<div style="${row}"><I9kNino v-for="expression in expressions" :key="expression" :expression="expression" size="lg" /></div>`,
  }),
};

export const GlancingRtl: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div dir="rtl" style="${row}"><I9kNino size="lg" /></div>`,
  }),
};
```

- [ ] **Step 2: Update the showcase entry**

In `showcase/registry/I9kNino.ts`, replace `summary`, `agentPrompt` and `gotchas`, and append two demos.

`summary`:

```ts
    'Nino, the 9k pixel mascot: an inline-SVG character with six expressions, stepped ambient life, a reaction beat on mood changes, one-shot actions (wave, jump, nod, shake), a talking state, a logical gaze direction, and motion that switches itself off for reduced-motion visitors.',
```

`agentPrompt`:

```ts
  agentPrompt: `Use I9kNino from @9klabs/design to put the 9k mascot on a page. He is drawn entirely from rectangles and paths on a 32x32 pixel grid, so there is no image to load and nothing blurs at small sizes. Every motion is stepped like a sprite.

import { I9kNino, I9K_NINO_EXPRESSIONS, I9K_NINO_ACTIONS, type I9kNinoExposed } from '@9klabs/design';

Props:
- expression?: 'idle' | 'happy' | 'thinking' | 'worried' | 'surprised' | 'eyes-closed' (default 'idle'). Only the eyes, brows, cheeks and mouth change. A change plays a 240ms beat: his eyes shut, he hops, and the new face swaps in at 100ms.
- look?: 'center' | 'up' | 'down' | 'start' | 'end' (default 'center') — moves the eyes only. 'start' and 'end' follow the reading direction and swap under [dir="rtl"]. An idle Nino left at 'center' glances around on his own.
- size?: 'sm' | 'md' | 'lg' | 'auto' (default 'md') — 2rem / 3rem / 4.5rem, or 'auto' to drop the component's own CSS sizing.
- animated?: boolean (default true) — removes the class every animation rule hangs off when false.
- talking?: boolean (default false) — flaps his mouth between its own shape and an open frame.
- label?: string | null (default null) — the localized name, e.g. 'Nino' or 'نينو'.

Emits: action-end with { action, completed } once per play() call.
Exposes: play(action: 'wave' | 'jump' | 'nod' | 'shake'): Promise<{ action, completed }>. Hold a template ref and call it from your own events, e.g. a wave when the login page opens, a jump on success, a shake on a wrong password. A newer call cuts the running one off, and the cut-off call settles with completed: false. With animated false or prefers-reduced-motion, play() moves nothing and resolves at once with completed: true.

Accessibility: with a \`label\` he renders role="img" and a <title>; without one he is aria-hidden="true". Pass \`label\` only when the mascot is content the reader would miss.

Colours are component-local custom properties you can override on one instance: --i9k-nino-body, --i9k-nino-screen, --i9k-nino-eye, --i9k-nino-mouth, --i9k-nino-cheek, --i9k-nino-glint.

IMPORTANT: to nest Nino inside your own <svg> and position him with x/y/width/height, pass size="auto". A jump or a raised arm draws outside his box on purpose (overflow: visible), so leave him some room above.

Usage:
<I9kNino ref="nino" expression="thinking" :talking="typing" size="lg" label="نينو" />
await nino.value.play('wave');`,
```

`gotchas`:

```ts
  gotchas: [
    'Nested inside a host <svg>, pass size="auto" — otherwise the component\'s CSS inline-size and block-size override the x/y/width/height attributes you are positioning him with.',
    'Without a `label` he is aria-hidden, so a screen reader never announces him. That is the intended default for decoration; pass the localized name when he is content.',
    '`animated: false` and prefers-reduced-motion are two independent switches. Turning the prop off does not make the media query redundant, and the media query does not make the prop redundant.',
    '`look` moves only the eyes, and start/end are reading-direction, not left/right — they swap on an Arabic page.',
    'Actions are imperative: hold a template ref and call play(). There is no action prop, so replaying the same action is just calling play() again.',
    'A changed expression shows 100ms later, after his eyes blink shut. Read the prop, not the rendered class, when you test what mood you asked for.',
    'Jumps and waves leave his box. Give him headroom instead of clipping his container with overflow: hidden.',
  ],
```

Append to `demos`:

```ts
    {
      label: 'Actions, played from your own events',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--component-gap-md)">
  <I9kNino ref="nino" size="lg" />
  <I9kButton size="sm" @click="$refs.nino.play('wave')">Wave</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('jump')">Jump</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('nod')">Nod</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('shake')">Shake</I9kButton>
</div>`,
    },
    {
      label: 'Talking in any mood',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)">
  <I9kNino size="lg" talking />
  <I9kNino size="lg" expression="worried" talking />
</div>`,
    },
```

- [ ] **Step 3: Add the repository convention**

In `AGENTS.md` under "Component conventions worth knowing", add after the `I9kIcon` bullet:

```markdown
- `I9kNino` takes one-shot actions imperatively: hold a template ref and call
  `play('wave' | 'jump' | 'nod' | 'shake')`, which resolves (and emits `action-end`) with
  `{ action, completed }` — `completed` is false when a newer call or an unmount cut it off. Each
  duration lives once, in `NINO_ACTION_DURATIONS` (`src/data/nino.ts`), and reaches the keyframes
  through `--i9k-nino-action-duration`. His SVG is layered (`stage` › `figure` › `upper` › arms and
  eyes) so that each animation owns one layer's transform; anything that lifts him moves `figure`,
  so his feet come along. Every keyframe is `steps(1, end)` on the two-unit grid, and every
  animated selector is repeated in the reduced-motion block at the end of the stylesheet.
```

- [ ] **Step 4: Run the showcase and full pipeline**

Run: `npx vitest run tests/showcaseRegistry.test.ts tests/showcaseDemos.test.ts`
Expected: PASS.

Run: `npm run check`
Expected: test, format, lint, typecheck, library build, Storybook build and showcase build all succeed. Fix any Prettier or ESLint findings in the touched files only.

- [ ] **Step 5: Commit**

```bash
git add stories/I9kNino.stories.ts showcase/registry/I9kNino.ts AGENTS.md
git commit -m "docs: document Nino's actions, talking and ambient life

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Visual verification

**Files:** none expected. Fix forward in `src/components/I9kNino.vue` or `src/data/nino.ts` only if something renders wrong, and re-run Task 6 Step 4 after any fix.

- [ ] **Step 1: Open Storybook**

Start the `storybook` configuration from `.claude/launch.json` with the preview tools (port 6006). Open `Components/I9kNino`.

- [ ] **Step 2: Check each story in light and dark themes**

Check `ExpressionSet`, `AmbientLife`, `Actions` (press each button, and press one twice quickly), `Talking`, `Sizes`, `Still` and `NestedInAHostSvg`. Toggle the theme with Storybook's theme control, or by adding and removing `dark` on `<html>` through `javascript_tool`.

Confirm:

- No part blurs at `sm`.
- The antenna, cheeks and glint read in both themes.
- Jumps and waves draw outside the box without being clipped.
- The face swap during a beat happens while his eyes are shut.

- [ ] **Step 3: Check RTL and reduced motion**

Open `LookingAroundRtl` and `GlancingRtl`. Confirm the glances mirror.

Emulate reduced motion with `matchMedia`-dependent behaviour and confirm all of these are true:

- Nothing animates.
- `Actions` buttons still update the readout to `completed`.
- `Talking` shows each mood's ordinary mouth.

Use the browser pane's media emulation if available. Otherwise, inject a `<style>` that applies the reduced-motion block's selectors through `javascript_tool`.

- [ ] **Step 4: Capture evidence**

Take one screenshot each of `AmbientLife` (light), `AmbientLife` (dark) and `Actions` mid-jump, for the pull request.

- [ ] **Step 5: Ask about the 9k.school check**

The spec asks for a look at 9k.school's login page and 404 maze with this branch linked. That means temporarily changing 9k.school's dependency, which is another repository. **Ask the user** whether to do it now. If they decline, list it as a follow-up in the pull request body.
