# Nino's Sky Drag, Throw and Dizzy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor drag Nino out of `I9kNinoSky`, throw him around the window with floaty physics that bounce off the window edges, and send him back into the sky with a new dizzy reaction when he comes to rest above it.

**Architecture:**

- **Physics:** pure functions in `src/composables/i9kNinoSky.ts` (release velocity, one physics step with air drag and bounces, settle test, home-offset decay, easing), unit-tested without a DOM.
- **`I9kNinoSky.vue`:** gains a four-state flight machine (`drifting`, `dragging`, `flying`, `returning`) that runs in its existing animation loop. While airborne, the flight element switches to `position: fixed`, so the sky's `overflow: hidden` does not clip it.
- **`I9kNino`:** gains a `dizzy` expression and a `dizzy` action.

**Tech Stack:** Vue 3 `<script setup>` SFCs with scoped CSS, TypeScript, Vitest with jsdom and Vue Test Utils, Storybook, and the showcase registry.

**Spec:** `docs/superpowers/specs/2026-10-15-nino-sky-drag-physics-design.md`

## Global Constraints

- Nino's art: every coordinate in his 64-unit viewBox is a multiple of 2.
- Every `I9kNino` keyframe animation uses `steps(1, end)` and moves by whole two-unit steps.
- Every animated `I9kNino` selector is repeated in the `prefers-reduced-motion` block, which stays last in the stylesheet.
- An action moves exactly one layer that it owns: `dizzy` moves `upper` only.
- Nothing the server renders carries a `style` attribute: the airborne class and inline transforms only ever exist on the client.
- Tuning numbers, exported once from `src/composables/i9kNinoSky.ts`:

  | value      | constant                 |
  | ---------- | ------------------------ |
  | 4 px       | drag threshold           |
  | 80 ms      | throw window             |
  | 3 px/ms    | maximum throw speed      |
  | 700 ms     | air-drag time constant   |
  | 0.7        | bounce restitution       |
  | 0.05 px/ms | settle speed             |
  | 1000 ms    | home-decay time constant |
  | 300 ms     | return swoop             |
  | 1500 ms    | dizzy face               |

- The `dizzy` action lasts 1200 ms, recorded in `NINO_ACTION_DURATIONS`.
- Window bounds: `0 … documentElement.clientWidth − ninoWidth` by `0 … window.innerHeight − ninoHeight`, re-read every frame.
- No gravity, no keyboard throw, no new props or events on `I9kNinoSky`.
- Prettier: two spaces, single quotes, trailing commas, 100-character lines. Commits use Conventional Commits and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **Window resized smaller mid-flight.** Nino may suddenly sit beyond the new edge. Expected: the next step puts him back on that edge, moving inward. The Task 1 test "pulls a body the window shrank past back inside" pins this.
- **A second finger, or a right-click, on Nino.** Expected: only the primary pointer's primary button starts a drag, and other pointers are ignored mid-drag. The Task 3 test "ignores a right-click and a second finger" pins this.
- **Motion switched off while he flies** (the `animated` prop goes false, or reduced motion turns on). Expected: he lands at once by the motion-off rules, never frozen in mid-air. The Task 4 test "lands at once when motion is switched off mid-flight" pins this.
- **Keyboard activation right after a drag.** Expected: Enter or Space still boops; only the pointer click that ends a drag is swallowed. The Task 3 test "boops from the keyboard right after a drag" pins this.
- **Pointer held still before letting go.** Expected: no throw, so he lands where he was dropped. The Task 1 test "is zero when the pointer stopped before letting go" pins this.

---

### Task 1: Throw physics in the sky maths module

**Files:**

- Modify: `src/composables/i9kNinoSky.ts` (append to the end of the file)
- Test: `tests/i9kNinoSkyMaths.test.ts` (extend the import, append new `describe` blocks)

**Interfaces:**

- Consumes: nothing new.
- Produces:
  - Constants: `DRAG_THRESHOLD`, `THROW_WINDOW_MS`, `MAX_THROW_SPEED`, `AIR_DRAG_MS`, `BOUNCE`, `SETTLE_SPEED`, `HOME_DECAY_MS`, `RETURN_MS`, `DIZZY_FACE_MS`.
  - Types:
    - `Point { x: number; y: number }`
    - `NinoBody extends Point { vx: number; vy: number }`
    - `NinoBounds { width: number; height: number }`: the room for his top-left corner.
    - `PointerSample extends Point { t: number }`
  - Functions:
    - `clampPoint(point: Point, bounds: NinoBounds): Point`
    - `recentSamples(samples: PointerSample[], now: number): PointerSample[]`
    - `releaseVelocity(samples: PointerSample[], now: number, maxSpeed?: number): { vx: number; vy: number }`
    - `stepBody(body: NinoBody, dtMs: number, bounds: NinoBounds): NinoBody`
    - `isSettled(body: NinoBody, threshold?: number): boolean`
    - `homeOffsetAt(start: Point, elapsedMs: number): Point`
    - `easeOutCubic(progress: number): number`

- [ ] **Step 1: Write the failing tests**

In `tests/i9kNinoSkyMaths.test.ts`, replace the import block at the top with:

```ts
import { describe, expect, it } from 'vitest';

import {
  AIR_DRAG_MS,
  BOOP_CYCLE,
  BOUNCE,
  HOME_DECAY_MS,
  MAX_THROW_SPEED,
  SKY_GRID,
  SKY_MAX_STARS,
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
  releaseVelocity,
  starAlpha,
  stepBody,
  type NinoBody,
} from '../src/composables/i9kNinoSky';
```

Append to the end of the file:

```ts
describe('releaseVelocity', () => {
  it('measures the pointer’s speed over the last 80 ms', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 40, x: 20, y: -10 },
      { t: 80, x: 40, y: -20 },
    ];

    expect(releaseVelocity(samples, 80)).toEqual({ vx: 0.5, vy: -0.25 });
  });

  it('ignores movement older than the window', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 500, y: 0 },
      { t: 150, x: 510, y: 0 },
      { t: 180, x: 520, y: 0 },
    ];

    expect(releaseVelocity(samples, 180)).toEqual({ vx: 0.25, vy: 0 });
  });

  it('is zero when the pointer stopped before letting go', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 20, x: 50, y: 0 },
      { t: 200, x: 50, y: 0 },
    ];

    expect(releaseVelocity(samples, 200)).toEqual({ vx: 0, vy: 0 });
  });

  it('is zero with fewer than two samples', () => {
    expect(releaseVelocity([], 0)).toEqual({ vx: 0, vy: 0 });
    expect(releaseVelocity([{ t: 5, x: 9, y: 9 }], 5)).toEqual({ vx: 0, vy: 0 });
  });

  it('caps the speed and keeps the direction', () => {
    const { vx, vy } = releaseVelocity(
      [
        { t: 0, x: 0, y: 0 },
        { t: 10, x: 300, y: 400 },
      ],
      10,
    );

    expect(Math.hypot(vx, vy)).toBeCloseTo(MAX_THROW_SPEED);
    expect(vx / vy).toBeCloseTo(0.75);
  });
});

describe('stepBody', () => {
  const room = { width: 1000, height: 600 };

  it('glides and slows down in the air', () => {
    const next = stepBody({ x: 100, y: 100, vx: 1, vy: 0 }, 16, room);

    expect(next.x).toBeGreaterThan(100);
    expect(next.x).toBeLessThan(116);
    expect(next.vx).toBeCloseTo(Math.exp(-16 / AIR_DRAG_MS));
    expect(next.vy).toBe(0);
  });

  it.each([
    { edge: 'left', body: { x: 4, y: 300, vx: -1, vy: 0.2 }, at: { x: 0 }, axis: 'vx', sign: 1 },
    {
      edge: 'right',
      body: { x: 996, y: 300, vx: 1, vy: 0.2 },
      at: { x: 1000 },
      axis: 'vx',
      sign: -1,
    },
    { edge: 'top', body: { x: 500, y: 4, vx: 0.2, vy: -1 }, at: { y: 0 }, axis: 'vy', sign: 1 },
    {
      edge: 'bottom',
      body: { x: 500, y: 596, vx: 0.2, vy: 1 },
      at: { y: 600 },
      axis: 'vy',
      sign: -1,
    },
  ] as const)('bounces back off the $edge edge, slower', ({ body, at, axis, sign }) => {
    const next = stepBody(body, 16, room);
    const before = Math.abs(body[axis]) * Math.exp(-16 / AIR_DRAG_MS);

    expect(next).toMatchObject(at);
    expect(Math.sign(next[axis])).toBe(sign);
    expect(Math.abs(next[axis])).toBeCloseTo(before * BOUNCE);
  });

  it('keeps its speed along the edge it bounces off', () => {
    const next = stepBody({ x: 4, y: 300, vx: -1, vy: 0.2 }, 16, room);

    expect(next.vy).toBeCloseTo(0.2 * Math.exp(-16 / AIR_DRAG_MS));
  });

  it('pulls a body the window shrank past back inside', () => {
    const next = stepBody({ x: 1200, y: 900, vx: 0, vy: 0 }, 16, room);

    expect(next).toMatchObject({ x: 1000, y: 600 });
  });

  it('never leaves the window, however hard it is thrown, and comes to rest', () => {
    let body: NinoBody = { x: 500, y: 300, vx: MAX_THROW_SPEED, vy: -MAX_THROW_SPEED };
    for (let frame = 0; frame < 600; frame += 1) {
      body = stepBody(body, 16, room);
      expect(body.x).toBeGreaterThanOrEqual(0);
      expect(body.x).toBeLessThanOrEqual(room.width);
      expect(body.y).toBeGreaterThanOrEqual(0);
      expect(body.y).toBeLessThanOrEqual(room.height);
    }

    expect(isSettled(body)).toBe(true);
  });
});

describe('isSettled', () => {
  it('settles once slower than 0.05 px/ms', () => {
    expect(isSettled({ x: 0, y: 0, vx: 0.03, vy: 0.03 })).toBe(true);
    expect(isSettled({ x: 0, y: 0, vx: 0.04, vy: 0.04 })).toBe(false);
  });
});

describe('clampPoint', () => {
  it('keeps a point inside the room and treats a negative room as none', () => {
    expect(clampPoint({ x: -5, y: 700 }, { width: 1000, height: 600 })).toEqual({ x: 0, y: 600 });
    expect(clampPoint({ x: 40, y: 40 }, { width: -10, height: 600 })).toEqual({ x: 0, y: 40 });
  });
});

describe('homeOffsetAt', () => {
  it('starts at the landing offset and fades toward the drift path', () => {
    expect(homeOffsetAt({ x: 100, y: -50 }, 0)).toEqual({ x: 100, y: -50 });
    expect(homeOffsetAt({ x: 100, y: -50 }, HOME_DECAY_MS).x).toBeCloseTo(100 / Math.E);
    const late = homeOffsetAt({ x: 100, y: -50 }, 5000);
    expect(Math.abs(late.x)).toBeLessThan(1);
    expect(Math.abs(late.y)).toBeLessThan(1);
  });
});

describe('easeOutCubic', () => {
  it('runs from 0 to 1, fast first, and clamps outside that range', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/i9kNinoSkyMaths.test.ts`
Expected: FAIL, because `releaseVelocity`, `stepBody` and the other new names are not exported from `i9kNinoSky`.

- [ ] **Step 3: Write the implementation**

Append to the end of `src/composables/i9kNinoSky.ts`:

```ts
/** Pointer travel, in CSS px, that turns a press on Nino into a drag. */
export const DRAG_THRESHOLD = 4;
/** How far back, in ms, the release velocity looks at the pointer. */
export const THROW_WINDOW_MS = 80;
/** The fastest throw, in CSS px per ms. */
export const MAX_THROW_SPEED = 3;
/** Air drag's time constant: a throw keeps about a third of its speed after this many ms. */
export const AIR_DRAG_MS = 700;
/** The share of his speed across a window edge that a bounce keeps. */
export const BOUNCE = 0.7;
/** Below this speed, in CSS px per ms, a throw is over. */
export const SETTLE_SPEED = 0.05;
/** The time constant of the home offset after he lands in the sky. */
export const HOME_DECAY_MS = 1000;
/** The swoop back into the sky after he comes to rest above it. */
export const RETURN_MS = 300;
/** How long the dizzy face stays once he is back. */
export const DIZZY_FACE_MS = 1500;

export interface Point {
  x: number;
  y: number;
}

/** Nino in flight: his top-left corner in window px, and his velocity in px per ms. */
export interface NinoBody extends Point {
  vx: number;
  vy: number;
}

/** The room his top-left corner has: the window less his own size. */
export interface NinoBounds {
  width: number;
  height: number;
}

export interface PointerSample extends Point {
  /** performance.now(), in ms. */
  t: number;
}

export function clampPoint(point: Point, bounds: NinoBounds): Point {
  return {
    x: Math.min(Math.max(point.x, 0), Math.max(bounds.width, 0)),
    y: Math.min(Math.max(point.y, 0), Math.max(bounds.height, 0)),
  };
}

/** The samples still inside the throw window at `now`. */
export function recentSamples(samples: PointerSample[], now: number): PointerSample[] {
  return samples.filter((sample) => now - sample.t <= THROW_WINDOW_MS);
}

/**
 * The throw: how far the pointer moved across the last THROW_WINDOW_MS, over
 * how long it took, capped at maxSpeed. A pointer that stopped before letting
 * go leaves fewer than two recent samples, so it throws nothing.
 */
export function releaseVelocity(
  samples: PointerSample[],
  now: number,
  maxSpeed = MAX_THROW_SPEED,
): { vx: number; vy: number } {
  const recent = recentSamples(samples, now);
  if (recent.length < 2) return { vx: 0, vy: 0 };
  const first = recent[0];
  const last = recent[recent.length - 1];
  const span = last.t - first.t;
  if (span <= 0) return { vx: 0, vy: 0 };
  const vx = (last.x - first.x) / span;
  const vy = (last.y - first.y) / span;
  const speed = Math.hypot(vx, vy);
  const scale = speed > maxSpeed ? maxSpeed / speed : 1;
  return { vx: vx * scale, vy: vy * scale };
}

/**
 * One step of flight in space: no gravity, exponential air drag, and a bounce
 * off each window edge that reverses the speed across it and keeps BOUNCE of
 * it. A body the window shrank past is put back on the edge, moving inward.
 */
export function stepBody(body: NinoBody, dtMs: number, bounds: NinoBounds): NinoBody {
  const drag = Math.exp(-dtMs / AIR_DRAG_MS);
  let vx = body.vx * drag;
  let vy = body.vy * drag;
  let x = body.x + vx * dtMs;
  let y = body.y + vy * dtMs;
  const maxX = Math.max(bounds.width, 0);
  const maxY = Math.max(bounds.height, 0);
  if (x < 0) {
    x = 0;
    vx = Math.abs(vx) * BOUNCE;
  } else if (x > maxX) {
    x = maxX;
    vx = -Math.abs(vx) * BOUNCE;
  }
  if (y < 0) {
    y = 0;
    vy = Math.abs(vy) * BOUNCE;
  } else if (y > maxY) {
    y = maxY;
    vy = -Math.abs(vy) * BOUNCE;
  }
  return { x, y, vx, vy };
}

export function isSettled(body: NinoBody, threshold = SETTLE_SPEED): boolean {
  return Math.hypot(body.vx, body.vy) < threshold;
}

/** Where he stopped against his drift path, fading so he eases back onto it. */
export function homeOffsetAt(start: Point, elapsedMs: number): Point {
  const left = Math.exp(-Math.max(elapsedMs, 0) / HOME_DECAY_MS);
  return { x: start.x * left, y: start.y * left };
}

export function easeOutCubic(progress: number): number {
  const clamped = Math.min(Math.max(progress, 0), 1);
  return 1 - (1 - clamped) ** 3;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/i9kNinoSkyMaths.test.ts`
Expected: PASS for every test in the file, old and new.

- [ ] **Step 5: Commit**

```bash
npx prettier --write src/composables/i9kNinoSky.ts tests/i9kNinoSkyMaths.test.ts
git add src/composables/i9kNinoSky.ts tests/i9kNinoSkyMaths.test.ts
git commit -m "feat: add throw physics for Nino's sky

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Nino's `dizzy` expression and action

**Files:**

- Modify: `src/types/components.ts` (`I9K_NINO_EXPRESSIONS`, `I9K_NINO_ACTIONS`)
- Modify: `src/data/nino.ts` (`NINO_FACES`, `NINO_ACTION_DURATIONS`)
- Modify: `src/components/I9kNino.vue` (the actions CSS block and the reduced-motion block)
- Modify: `showcase/registry/I9kNino.ts`
- Modify: `AGENTS.md` (the `I9kNino` bullet)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces:
  - `'dizzy'` is a member of `I9kNinoExpression` and of `I9kNinoAction`.
  - `play('dizzy')` resolves after `NINO_ACTION_DURATIONS.dizzy === 1200` ms.
  - Task 3 relies on these.

These existing tests iterate the two arrays and now cover `dizzy` automatically:

- two eyes and a mouth of its own;
- the two-unit grid;
- the body stays whole;
- no brows, cheeks or hands;
- the `it.each(I9K_NINO_ACTIONS)` play test;
- the reduced-motion stylesheet test.

- [ ] **Step 1: Write the failing tests**

In `tests/I9kNino.test.ts`, add this test inside `describe('I9kNino', …)`, right after the `'peeks with the right-hand hand on screen'` test:

```ts
it('swirls a mirrored pair of eyes in the open eyes’ boxes when dizzy', () => {
  const [left, right] = mount(I9kNino, { props: { expression: 'dizzy' } })
    .findAll('[data-nino-part="eye"]')
    .map(boundsOf);

  expect(left).toEqual({ left: 18, top: 16, right: 30, bottom: 28 });
  expect(right).toEqual({ left: 34, top: 16, right: 46, bottom: 28 });
  expect(NINO_FACES.dizzy.eyes[1]).toEqual({
    d: (NINO_FACES.dizzy.eyes[0] as { d: string }).d.replace(
      /([MH])(\d+)/g,
      (_, command: string, x: string) => `${command}${64 - Number(x)}`,
    ),
  });
});
```

Add these two tests inside `describe('I9kNino ambient life', …)`, after `'glances the other way first on a right-to-left page'`:

```ts
it('sways only his head and arms when dizzy', () => {
  const dizzy = animationRules(stylesheet).filter(({ selector }) =>
    selector.includes('action-dizzy'),
  );

  expect(dizzy).toHaveLength(1);
  expect(dizzy[0].selector).toContain('.i9k-nino__upper');
  expect(dizzy[0].value).toContain('i9k-nino-dizzy');
});

it('sways in two-unit steps and ends the dizzy spell at rest', () => {
  const frames: { at: string; numbers: number[] }[] = [];
  stylesheet.walkAtRules(/keyframes$/, (atRule) => {
    // Scoped styles suffix keyframe names with the component's id.
    if (!atRule.params.startsWith('i9k-nino-dizzy')) return;
    atRule.walkDecls('transform', (decl) => {
      frames.push({
        at: (decl.parent as Rule).selector,
        numbers: (decl.value.match(/-?\d+(\.\d+)?/g) ?? []).map(Number),
      });
    });
  });

  expect(frames.length).toBeGreaterThan(4);
  for (const { numbers } of frames) {
    expect(numbers.filter((value) => value % 2 !== 0)).toEqual([]);
  }
  const last = frames.find(({ at }) =>
    at.split(',').some((part) => ['to', '100%'].includes(part.trim())),
  );
  expect(last?.numbers.every((value) => value === 0)).toBe(true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: FAIL. TypeScript and Vitest report `'dizzy'` as not assignable to the expression type, `NINO_FACES.dizzy` is undefined, and no `action-dizzy` rule exists.

- [ ] **Step 3: Add `dizzy` to the type arrays**

In `src/types/components.ts`:

```ts
export const I9K_NINO_EXPRESSIONS = [
  'idle',
  'happy',
  'thinking',
  'worried',
  'surprised',
  'eyes-closed',
  'hiding',
  'dizzy',
] as const;
```

```ts
export const I9K_NINO_ACTIONS = ['wave', 'jump', 'nod', 'shake', 'dizzy'] as const;
```

- [ ] **Step 4: Draw the dizzy face and record the action's length**

In `src/data/nino.ts`, add this row to `NINO_FACES` after `hiding`:

```ts
  // Thrown out of the sky. Each eye is a square spiral in the open eye's box,
  // the right one the left one mirrored, and the mouth wobbles.
  dizzy: {
    eyes: [
      { d: 'M18 16H30V28H18V20H26V24H24V22H20V26H28V18H18Z' },
      { d: 'M46 16H34V28H46V20H38V24H40V22H44V26H36V18H46Z' },
    ],
    mouth: 'M18 36H22V34H26V36H30V34H34V36H38V34H42V36H46V40H42V38H38V40H34V38H30V40H26V38H22V40H18Z',
  },
```

Add `dizzy` to `NINO_ACTION_DURATIONS`:

```ts
export const NINO_ACTION_DURATIONS: Record<I9kNinoAction, number> = {
  wave: 1000,
  jump: 800,
  nod: 900,
  shake: 700,
  dizzy: 1200,
};
```

- [ ] **Step 5: Add the sway keyframes**

In `src/components/I9kNino.vue`, after the `.i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper` rule, add:

```css
.i9k-nino--animated.i9k-nino--action-dizzy .i9k-nino__upper {
  animation: i9k-nino-dizzy var(--i9k-nino-action-duration) steps(1, end);
}
```

After `@keyframes i9k-nino-shake { … }`, add:

```css
/* Three small circles of the head and arms, then rest. */
@keyframes i9k-nino-dizzy {
  0%,
  32%,
  64% {
    transform: translate(2px, 0);
  }

  8%,
  40%,
  72% {
    transform: translate(0, 2px);
  }

  16%,
  48%,
  80% {
    transform: translate(-2px, 0);
  }

  24%,
  56%,
  88% {
    transform: translate(0, -2px);
  }

  96%,
  100% {
    transform: translate(0, 0);
  }
}
```

In the reduced-motion block at the end, add this selector after `.i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper`, and change the shake line's trailing ` {` to `,`:

```css
.i9k-nino--animated.i9k-nino--action-shake .i9k-nino__upper,
.i9k-nino--animated.i9k-nino--action-dizzy .i9k-nino__upper {
  animation: none;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts tests/I9kComponentContracts.test.ts`
Expected: PASS, including the new dizzy cases of every `it.each`.

- [ ] **Step 7: Update the showcase entry and AGENTS.md**

In `showcase/registry/I9kNino.ts`:

- **summary:** replace `seven expressions (one of them hide and seek)` with `eight expressions (one of them hide and seek, one dizzy)`, and replace `(wave, jump, nod, shake)` with `(wave, jump, nod, shake, dizzy)`.
- **agentPrompt, `expression` prop line:** replace `'eyes-closed' | 'hiding' (default 'idle').` with `'eyes-closed' | 'hiding' | 'dizzy' (default 'idle').`. After the sentence that ends `peeks over the right one.`, insert ` 'dizzy' swirls his eyes into spirals and wobbles his mouth.`
- **agentPrompt, `Exposes` line:** replace `play(action: 'wave' | 'jump' | 'nod' | 'shake')` with `play(action: 'wave' | 'jump' | 'nod' | 'shake' | 'dizzy')`, and replace `a shake on a wrong password.` with `a shake on a wrong password, a dizzy sway after a tumble.`
- **'Expression set' demo:** add `  <I9kNino expression="dizzy" />` after the `hiding` line.
- **'Actions' demo:** add `  <I9kButton size="sm" @click="$refs.nino.play('dizzy')">Dizzy</I9kButton>` after the Shake button.

In `AGENTS.md`, in the `I9kNino` bullet, replace `` `play('wave' | 'jump' | 'nod' | 'shake')` `` with `` `play('wave' | 'jump' | 'nod' | 'shake' | 'dizzy')` ``. Rewrap the paragraph to 100 columns if the line grows past it.

- [ ] **Step 8: Run the showcase registry test**

Run: `npx vitest run tests/showcaseRegistry.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
npx prettier --write src/types/components.ts src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts showcase/registry/I9kNino.ts AGENTS.md
git add src/types/components.ts src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts showcase/registry/I9kNino.ts AGENTS.md
git commit -m "feat: give Nino a dizzy expression and action

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Drag Nino out of the sky and drop him

In this task a release always lands Nino at once, with no throw. Task 4 adds the flight.

**Files:**

- Modify: `src/components/I9kNinoSky.vue`
- Test: `tests/I9kNinoSky.test.ts`

**Interfaces:**

- Consumes:
  - From Task 1: `DRAG_THRESHOLD`, `DIZZY_FACE_MS`, `clampPoint`, `recentSamples`, `homeOffsetAt`, and the types `NinoBody`, `NinoBounds`, `Point`, `PointerSample`.
  - From Task 2: the `'dizzy'` expression and action, and `I9kNinoExposed.play`.
- Produces, used by Task 4 (all inside `I9kNinoSky.vue`):
  - the `FlightState` type and the `flightState`, `body`, `samples` and `home` / `homeSince` variables;
  - the `airborne` ref and the `ninoFigure` ref;
  - the functions `windowBounds()`, `drawAirborne(tilt?)`, `throwNino(velocity)`, `land()`, `settleInSky(sky, element)`, `snapBack()`, `finishReturn()` and `getDizzy()`.

- [ ] **Step 1: Write the failing tests**

In `tests/I9kNinoSky.test.ts`, change the imports to:

```ts
import { flushPromises, mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { computeAccessibleName } from 'dom-accessibility-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';

import I9kNinoSky from '../src/components/I9kNinoSky.vue';
import { DIZZY_FACE_MS } from '../src/composables/i9kNinoSky';
import { NINO_BEAT } from '../src/data/nino';
```

Append to the end of the file:

```ts
/** A pointer event as jsdom can build one: a MouseEvent carrying the pointer fields. */
function pointer(
  type: string,
  x: number,
  y: number,
  init: { id?: number; button?: number; primary?: boolean } = {},
) {
  const event = new MouseEvent(type, {
    clientX: x,
    clientY: y,
    button: init.button ?? 0,
    bubbles: true,
  });
  Object.defineProperty(event, 'pointerId', { value: init.id ?? 1 });
  Object.defineProperty(event, 'isPrimary', { value: init.primary ?? true });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  return event;
}

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

type SkyWrapper = ReturnType<typeof mount>;

/** The sky on screen: 300px tall, its top edge 500px down a 1000px-wide window. */
function placeSky(wrapper: SkyWrapper) {
  vi.spyOn(wrapper.element as HTMLElement, 'getBoundingClientRect').mockReturnValue(
    rect(0, 500, 1000, 300),
  );
}

const flightOf = (wrapper: SkyWrapper) =>
  wrapper.get('.i9k-nino-sky__flight').element as HTMLElement;
const isAirborne = (wrapper: SkyWrapper) =>
  wrapper.get('.i9k-nino-sky__flight').classes().includes('i9k-nino-sky__flight--airborne');

async function press(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointerdown', x, y, init));
  await nextTick();
}

async function move(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointermove', x, y, init));
  await nextTick();
}

async function release(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointerup', x, y, init));
  await nextTick();
}

async function pointerClick(wrapper: SkyWrapper) {
  wrapper
    .get('button')
    .element.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
  await nextTick();
}

// jsdom lays Nino out at (0, 0) with no size, so pressing at (0, 0) grabs his
// top-left corner and his top-left then follows the pointer exactly.
describe('I9kNinoSky drag', () => {
  it('picks Nino up only once the pointer moves past the threshold', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 3, 0);
    expect(isAirborne(wrapper)).toBe(false);

    await move(wrapper, 30, 620);
    expect(isAirborne(wrapper)).toBe(true);
    expect(nino(wrapper).classes()).toContain('i9k-nino--surprised');
    expect(nino(wrapper).classes()).toContain('i9k-nino--look-center');
  });

  it('keeps him inside the window while he is dragged', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 5000, 5000);

    expect(flightOf(wrapper).style.transform).toBe(
      `translate(1000.0px, ${window.innerHeight}.0px) rotate(0.00deg)`,
    );
  });

  it('does not boop when a drag ends in a click', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    await release(wrapper, 40, 650);
    await pointerClick(wrapper);

    expect(wrapper.emitted('boop')).toBeUndefined();
  });

  it('still boops on a tap', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await release(wrapper, 1, 1);
    await pointerClick(wrapper);

    expect(wrapper.emitted('boop')).toEqual([['happy']]);
  });

  it('boops from the keyboard right after a drag', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    await release(wrapper, 40, 650);
    // Enter and Space fire a click with detail 0.
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('boop')).toEqual([['happy']]);
  });

  it('sends Nino back and makes him dizzy when he is dropped above the sky', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 0, 100);
    await release(wrapper, 0, 100);

    expect(isAirborne(wrapper)).toBe(false);
    expect(flightOf(wrapper).style.transform).toBe('');
    expect(nino(wrapper).classes()).toContain('i9k-nino--dizzy');

    await vi.advanceTimersByTimeAsync(DIZZY_FACE_MS);
    expect(nino(wrapper).classes()).toContain('i9k-nino--idle');
  });

  it('lets him settle without fuss when he is dropped inside the sky', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 0, 650);
    await release(wrapper, 0, 650);

    expect(isAirborne(wrapper)).toBe(false);
    expect(nino(wrapper).classes()).toContain('i9k-nino--idle');
  });

  it('ignores a right-click and a second finger', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0, { button: 2 });
    await move(wrapper, 300, 300);
    expect(isAirborne(wrapper)).toBe(false);

    await press(wrapper, 0, 0);
    await move(wrapper, 300, 300, { id: 2, primary: false });
    expect(isAirborne(wrapper)).toBe(false);
  });

  it('lands him when the drag is cancelled', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    wrapper.get('button').element.dispatchEvent(pointer('pointercancel', 40, 650));
    await nextTick();

    expect(isAirborne(wrapper)).toBe(false);
  });

  it('lets go of every timer and frame when it unmounts mid-drag', async () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 11),
    );
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    wrapper.unmount();

    expect(cancel).toHaveBeenCalledWith(11);
    expect(vi.getTimerCount()).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNinoSky.test.ts`
Expected: the new `I9kNinoSky drag` tests FAIL. There is no airborne class, a click after a drag boops, and there is no dizzy face. Every older test still passes.

- [ ] **Step 3: Implement drag and drop in `src/components/I9kNinoSky.vue`**

Replace the import from `'../composables/i9kNinoSky'` and the types import with:

```ts
import {
  DIZZY_FACE_MS,
  DRAG_THRESHOLD,
  SKY_GRID,
  boopExpression,
  clampPoint,
  createSkyStars,
  createSparkles,
  driftAt,
  homeOffsetAt,
  lookToward,
  planetDots,
  recentSamples,
  starAlpha,
  type NinoBody,
  type NinoBounds,
  type Point,
  type PointerSample,
  type SkyDot,
  type SkyStar,
  type Sparkle,
} from '../composables/i9kNinoSky';
import type { I9kNinoExposed, I9kNinoExpression, I9kNinoLook } from '../types/components';
```

After `const button = ref<HTMLButtonElement | null>(null);`, add:

```ts
const ninoFigure = ref<I9kNinoExposed | null>(null);
/** While true, Nino is drawn in window coordinates, outside the sky's clipping. */
const airborne = ref(false);
```

After `let themeObserver: MutationObserver | undefined;`, add:

```ts
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
```

Replace `place` with:

```ts
function place(now: number) {
  const element = flight.value;
  const nino = button.value;
  if (!element || !nino) return;
  const { x, y, tilt } = driftAt(now, skyWidth, skyHeight, nino.offsetHeight);
  const offset = homeOffsetAt(home, now - homeSince);
  element.style.transform = `translate(${(x + offset.x).toFixed(1)}px, ${(y + offset.y).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
}
```

In `frame`, change the line `place(motionTime);` to:

```ts
if (flightState === 'drifting') place(motionTime);
```

Replace `running` with:

```ts
function running() {
  if (!mounted || !motionAllowed() || document.visibilityState === 'hidden') return false;
  // Airborne, he can be anywhere in the window, so the sky being off screen does not stop him.
  return onScreen || flightState !== 'drifting';
}
```

In `refresh`, change the still-frame line `flight.value?.style.removeProperty('transform');` to:

```ts
// A Nino held by the pointer stays where the pointer has him.
if (flightState === 'drifting') flight.value?.style.removeProperty('transform');
```

In `boop`, add as its first two lines:

```ts
clearTimeout(dizzyTimer);
dizzyTimer = undefined;
```

In `onPointerMove` (the eyes), add as its first line:

```ts
if (flightState !== 'drifting') return;
```

Add these functions after `onPointerMove`:

```ts
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

function snapBack() {
  finishReturn();
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

function throwNino() {
  samples = [];
  land();
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
  grab = { x: start.x - body.x, y: start.y - body.y };
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
  if (!event.isPrimary || event.button !== 0 || pressed || flightState !== 'drifting') return;
  swallowClick = false;
  pressed = { id: event.pointerId, x: event.clientX, y: event.clientY };
  button.value?.setPointerCapture?.(event.pointerId);
}

function onDragMove(event: PointerEvent) {
  if (!pressed || event.pointerId !== pressed.id) return;
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
  throwNino();
}

/** pointercancel and lostpointercapture: let go where he is, without a throw. */
function onPointerCancel(event: PointerEvent) {
  if (!pressed || event.pointerId !== pressed.id) return;
  pressed = undefined;
  if (flightState === 'dragging') throwNino();
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
```

In `onBeforeUnmount`, after `lookTimer = undefined;`, add:

```ts
clearTimeout(dizzyTimer);
dizzyTimer = undefined;
pressed = undefined;
```

Replace the `<div ref="flight" …>` element and its button in the template with:

```html
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
```

In the `<style scoped>` block, after the `.i9k-nino-sky__flight` rule, add:

```css
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
```

In the `.i9k-nino-sky__nino` rule, replace `cursor: pointer;` with:

```css
cursor: grab;
/* A drag that starts on Nino moves him instead of scrolling the page. */
touch-action: none;
user-select: none;
```

After the `.i9k-nino-sky__nino:focus-visible` rule, add:

```css
.i9k-nino-sky__flight--airborne .i9k-nino-sky__nino {
  cursor: grabbing;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNinoSky.test.ts`
Expected: PASS for every test, old and new. The server-render tests still find no `style=` attribute.

- [ ] **Step 5: Type-check and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/components/I9kNinoSky.vue tests/I9kNinoSky.test.ts
git add src/components/I9kNinoSky.vue tests/I9kNinoSky.test.ts
git commit -m "feat: let visitors drag Nino out of his sky and drop him

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Throw, flight, bounces and the swoop home

**Files:**

- Modify: `src/components/I9kNinoSky.vue`
- Test: `tests/I9kNinoSky.test.ts`

**Interfaces:**

- Consumes:
  - From Task 1: `releaseVelocity`, `stepBody`, `isSettled`, `easeOutCubic`, `RETURN_MS`.
  - From Task 3: everything listed in its Produces line.
- Produces: the final behaviour of the component. No new names leave the file.

- [ ] **Step 1: Write the failing tests**

Append to `tests/I9kNinoSky.test.ts`:

```ts
describe('I9kNinoSky throw', () => {
  let frames: FrameRequestCallback[];
  let clock: number;

  beforeEach(() => {
    frames = [];
    clock = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
  });

  /** Runs `count` animation frames, `ms` apart. */
  async function runFrames(count: number, ms = 16) {
    for (let index = 0; index < count; index += 1) {
      clock += ms;
      for (const callback of frames.splice(0)) callback(clock);
    }
    await nextTick();
  }

  const xOf = (wrapper: SkyWrapper) =>
    Number(/translate\((-?[\d.]+)px/.exec(flightOf(wrapper).style.transform)?.[1]);

  /** Nino drawn at (480, y) in the window, 0 × 0 as jsdom lays him out. */
  function placeNino(wrapper: SkyWrapper, y: number) {
    vi.spyOn(wrapper.get('button').element, 'getBoundingClientRect').mockReturnValue(
      rect(480, y, 0, 0),
    );
  }

  it('throws Nino the way the pointer moved, bounces him off the window edge, and lets him settle in the sky', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    placeSky(wrapper);
    placeNino(wrapper, 620);
    await runFrames(1);

    await press(wrapper, 480, 620);
    await move(wrapper, 490, 620);
    clock += 40;
    await move(wrapper, 690, 620);
    clock += 40;
    await move(wrapper, 890, 620);
    await release(wrapper, 890, 620);
    expect(isAirborne(wrapper)).toBe(true);

    const xs: number[] = [];
    for (let index = 0; index < 60; index += 1) {
      await runFrames(1);
      if (isAirborne(wrapper)) xs.push(xOf(wrapper));
    }
    expect(Math.max(...xs)).toBe(1000);
    expect(xs[xs.length - 1]).toBeLessThan(1000);

    await runFrames(400);
    expect(isAirborne(wrapper)).toBe(false);
    expect(nino(wrapper).classes()).not.toContain('i9k-nino--dizzy');
  });

  it('swoops back into the sky and gets dizzy when a throw comes to rest above it', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    placeSky(wrapper);
    placeNino(wrapper, 100);
    await runFrames(1);

    await press(wrapper, 480, 100);
    await move(wrapper, 490, 100);
    clock += 200;
    await release(wrapper, 490, 100);

    await runFrames(2);
    expect(isAirborne(wrapper)).toBe(true);

    await runFrames(25);
    expect(isAirborne(wrapper)).toBe(false);
    await vi.advanceTimersByTimeAsync(NINO_BEAT.duration);
    expect(nino(wrapper).classes()).toContain('i9k-nino--dizzy');
  });

  it('lands at once when motion is switched off mid-flight', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    placeSky(wrapper);
    placeNino(wrapper, 620);
    await runFrames(1);

    await press(wrapper, 480, 620);
    await move(wrapper, 490, 620);
    clock += 40;
    await move(wrapper, 690, 620);
    await release(wrapper, 690, 620);
    await runFrames(2);
    expect(isAirborne(wrapper)).toBe(true);

    await wrapper.setProps({ animated: false });
    expect(isAirborne(wrapper)).toBe(false);
    expect(flightOf(wrapper).style.transform).toBe('');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNinoSky.test.ts -t 'I9kNinoSky throw'`
Expected: FAIL. In Task 3 a release lands Nino at once, so he is never airborne after the release, and the first and third tests fail on `isAirborne`.

- [ ] **Step 3: Implement the flight**

In `src/components/I9kNinoSky.vue`, add to the `'../composables/i9kNinoSky'` import, keeping it alphabetical:

- constants: `RETURN_MS`;
- functions: `easeOutCubic`, `isSettled`, `releaseVelocity` and `stepBody`.

After `let dizzyTimer …;`, add:

```ts
let returnFrom: Point = { x: 0, y: 0 };
let returnStart = 0;
```

In `frame`, after `lastTick = now;`, insert:

```ts
if (flightState === 'flying') fly(step);
else if (flightState === 'returning') swoop();
```

Rename the step there: the line

```ts
motionTime += lastTick === undefined ? 0 : Math.min(now - lastTick, MAX_STEP_MS);
```

becomes

```ts
const step = lastTick === undefined ? 0 : Math.min(now - lastTick, MAX_STEP_MS);
motionTime += step;
```

In `refresh`, add as its first line:

```ts
// Motion went off mid-flight: he lands now, by the still rules, instead of freezing in the air.
if (!motionAllowed()) {
  if (flightState === 'flying') land();
  else if (flightState === 'returning') finishReturn();
}
```

Replace `snapBack` and `throwNino` with:

```ts
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
```

In `onPointerUp`, replace `throwNino();` with:

```ts
throwNino(releaseVelocity(samples, t));
```

In `onPointerCancel`, replace `throwNino();` with `throwNino({ vx: 0, vy: 0 });`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNinoSky.test.ts tests/i9kNinoSkyMaths.test.ts`
Expected: PASS for every test.

In the first throw test, the release speed (400 px in 80 ms) is capped at 3 px/ms. Nino reaches the 1000 px edge within a few frames, and his last airborne x is below 1000 because he bounced. If that test settles before 60 frames, the bounce assertions still hold as long as the collected `xs` include the edge frame. Do not loosen them.

- [ ] **Step 5: Type-check and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
npx prettier --write src/components/I9kNinoSky.vue tests/I9kNinoSky.test.ts
git add src/components/I9kNinoSky.vue tests/I9kNinoSky.test.ts
git commit -m "feat: throw Nino around the window and swoop him home

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Story, showcase, AGENTS.md, full check and a hands-on pass

**Files:**

- Modify: `stories/I9kNinoSky.stories.ts`
- Modify: `showcase/registry/I9kNinoSky.ts`
- Modify: `AGENTS.md` (add an `I9kNinoSky` bullet under component conventions)

**Interfaces:**

- Consumes: the finished component from Task 4.
- Produces: documentation only.

- [ ] **Step 1: Add a story that leaves room above the sky**

Append to `stories/I9kNinoSky.stories.ts`:

```ts
// Page content above the sky, so a drop above it has somewhere to land: drag
// Nino up into the text and let go, or throw him at the window's edges.
export const UnderAPage: Story = {
  render: (args) => ({
    components: { I9kNinoSky },
    setup: () => ({ args }),
    template: `<div><div style="min-block-size: 70vh; padding: 2rem"><h2>Page content</h2><p>Drag Nino up here and let go: he swoops back to his sky, dizzy. Throw him and he bounces off the window's edges.</p></div><I9kNinoSky v-bind="args" /></div>`,
  }),
};
```

- [ ] **Step 2: Document the drag in the showcase entry**

In `showcase/registry/I9kNinoSky.ts`:

- **summary:** replace `and a boop (a new face, a spin and a burst of sparkles) on click, tap, Enter or Space.` with `a boop (a new face, a spin and a burst of sparkles) on click, tap, Enter or Space, and a drag: pick Nino up, throw him around the window, and if he comes to rest above the sky he swoops back to it, dizzy.`
- **agentPrompt:** after the `Behavior:` paragraph, add this paragraph, preceded by a blank line:

  ```
  Drag and throw: pressing Nino and moving more than 4px picks him up; he follows the pointer anywhere in the window and is thrown with the pointer's speed when let go. In flight he floats (no gravity), slows down, and bounces off the window's edges. Coming to rest inside the sky, he drifts home; above it, he swoops straight back and plays I9kNino's dizzy expression and action. With animated false or reduced motion he can still be dragged, but there is no throw. A drag never boops; Enter and Space always do.
  ```

- **gotchas:** append two entries:

  ```ts
    'While airborne, Nino is `position: fixed` with z-index 300, so he flies over the page. An ancestor with a transform, filter, perspective, `contain: paint` or `will-change: transform` becomes his containing block and bounds him to itself instead of the window, so keep the sky out of one.',
    'The Nino button sets `touch-action: none`: a swipe that starts on him drags him instead of scrolling the page. Swipes elsewhere in the sky still scroll.',
  ```

- [ ] **Step 3: Add the AGENTS.md convention**

In `AGENTS.md`, under `### Component conventions worth knowing`, after the `I9kNino` bullet, add:

```markdown
- `I9kNinoSky` lets a visitor drag Nino and throw him around the window. The physics (release
  velocity, air drag, bounces off the window's edges, the home offset) lives as pure functions in
  `src/composables/i9kNinoSky.ts`, which also holds every tuning constant. The component only runs
  the state machine (`drifting`, `dragging`, `flying`, `returning`). While airborne, the flight
  element is `position: fixed` so the sky's `overflow: hidden` cannot clip it, which means an
  ancestor with a transform or filter would trap him; keep the sky out of one. Landing above the
  sky's top edge swoops him back and plays the `dizzy` expression and action.
```

- [ ] **Step 4: Run the whole pipeline**

Run: `npm run check`
Expected: test, format, lint, typecheck, library build, Storybook build and showcase build all succeed. If `format:check` fails, run `npx prettier --write` on the files it lists and rerun.

- [ ] **Step 5: Hands-on pass in Storybook**

Run `npm run storybook` and open `Components/I9kNinoSky` › `UnderAPage`. Check each of these:

1. A tap boops, and a drag never does.
2. A hard throw into each of the four window edges bounces him back, and he never leaves the window.
3. Dropping him in the page text swoops him back to the sky, where he shows a spiral-eyed, swaying dizzy reaction.
4. A throw from above the sky into it lands normally, with no dizzy.
5. After landing in the sky, he eases back to his drift within about 3 s, with no jump.
6. Resizing the window mid-flight keeps him inside it.
7. With the `animated` control off, dragging still works and release puts him straight back at the centre; a drop above the sky shows the dizzy face.
8. In dark mode (the toolbar theme) and in the `Arabic` story, all of the above still holds.
9. On a touch emulator (DevTools device mode), dragging Nino does not scroll the page, and swiping elsewhere does.

- [ ] **Step 6: Commit**

```bash
npx prettier --write stories/I9kNinoSky.stories.ts showcase/registry/I9kNinoSky.ts AGENTS.md
git add stories/I9kNinoSky.stories.ts showcase/registry/I9kNinoSky.ts AGENTS.md
git commit -m "docs: document dragging and throwing Nino's sky

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
