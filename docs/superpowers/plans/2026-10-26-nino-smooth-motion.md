# Nino Smooth Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every stepped motion in `I9kNino` with eased motion — a two-phase face morph on mood changes, a gliding glance, continuous breathing, eased blinks, ambient loops and one-shot actions — without changing his art, his API or his timing contract.

**Architecture:** The template changes in one place (the eye shapes move into a new `glance` group inside `eyes`, so the caller's look transition and the ambient glance animation never share an element). The script's `beating` flag and even/odd phase become one `beatPhase: 'shut' | 'open' | null` driven by the same two timers. Everything else is the scoped stylesheet: every `steps(1, end)` becomes one of four curves (`cubic-bezier(0.23, 1, 0.32, 1)` to settle, `ease-in` to shut or fall, `ease-in-out` to sway, `linear` for the tremor), the beat becomes `--beat-shut` / `--beat-open` rules on each face part, and the reduced-motion block stills every animation _and_ transition.

**Tech Stack:** Vue 3.5 `<script setup>` SFC, scoped CSS keyframes and transitions on inline SVG, Vitest 4 + @vue/test-utils (jsdom) with fake timers, PostCSS inspection of a Vite build for CSS contracts, Storybook 10, the showcase registry.

**Spec:** `docs/superpowers/specs/2026-10-26-nino-smooth-motion-design.md`
Intent-Issue: #23 — https://github.com/the9klabs/design/issues/23

## Global Constraints

- No `steps(`, `step-end` or `step-start` anywhere in `I9kNino.vue`'s stylesheet. Timing functions are only `cubic-bezier(0.23, 1, 0.32, 1)`, `ease-in`, `ease-in-out`, `linear`, or the shorthand default.
- Drawn coordinates, the viewBox `0 0 64 64` and `shape-rendering="crispEdges"` are untouched. Held keyframe stops are multiples of 2 units; only the worried tremor (±1 unit) and the shadow's `scaleX` are off-grid.
- `NINO_BEAT = { swapAt: 120, duration: 300 }`. `NINO_ACTION_DURATIONS` is unchanged (`wave 1000, jump 800, nod 900, shake 700, dizzy 1200`).
- Every selector that declares a non-`none` `animation` or `transition` outside `@media (prefers-reduced-motion: reduce)` has a `none` twin inside it, and that block stays last in the stylesheet.
- Every animation and transition rule hangs off `.i9k-nino--animated`. The JS motion gate (`motionAllowed()`) is unchanged.
- Stylesheet rule order: ambient, expression motion, talking, beat, actions, reduced-motion block.
- No public API change: props, emits, `play()`, exports in `src/index.ts`, `data-nino-part` values (`glance` is added, none removed) and every class a consumer may target (`i9k-nino--<expression>`, `--look-*`, `--beat`, `--acting`, `--action-*`, `--talking`) keep their meaning. `i9k-nino--beat-even` / `--beat-odd` are removed.
- No new dependencies, image files or JS frame loops.
- The worktree has no `node_modules`: run `pnpm install` once before the first test run.
- Prettier: 2 spaces, single quotes, trailing commas, 100 columns. Conventional Commits, each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. **A mood change while `talking`:** the mouth must squash shut and open with the face, not flap through the swap. Pinned in Task 3 (`'lets the beat take the mouth from the talk loop'`).
2. **A `play()` while `hiding`:** hands fade out and the side arms fade in for the action, then back; nothing pops. Pinned in Task 3 (the opacity assertions in `'lifts his arms off his sides to hide, and lowers his hands to act'`).
3. **`animated` turned off mid-beat:** no phase class survives, the pending face shows at once. Pinned in Task 3 (`'shows the new mood at once when motion is switched off mid-beat'`).
4. **Parts that only the new face has** (hands for `hiding`, brows for `thinking`) must mount while `--beat-open` is set, so they start shut. Pinned in Task 3 (`'raises his hands while the face opens'`).
5. **The caller's look and the ambient glance on one element** would snap instead of glide. Pinned in Task 1 (`'glides his eyes to a new look'` asserts no animation ever targets `.i9k-nino__eyes`).

---

## File Structure

| File                                    | Responsibility                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/components/I9kNino.vue` (modify)   | Template: the `glance` group. Script: `beatPhase`. Styles: every motion rule, rewritten task by task.               |
| `src/data/nino.ts` (modify)             | `NINO_BEAT` values and comment.                                                                                     |
| `tests/I9kNino.test.ts` (modify)        | All Nino behaviour and compiled-CSS contracts: inverted sprite test, phase tests, transition twins, new assertions. |
| `stories/I9kNino.stories.ts` (modify)   | Comments, and the `MoodMorph` story.                                                                                |
| `showcase/registry/I9kNino.ts` (modify) | Summary, agent prompt and the delayed-face gotcha.                                                                  |
| `AGENTS.md` (modify)                    | The `I9kNino` convention bullet.                                                                                    |

Test helpers already in `tests/I9kNino.test.ts` and reused throughout: `buildComponentStylesheet('I9kNino')` (a real Vite build parsed with PostCSS), `isReducedMotionRule(rule)`, `animationRules(stylesheet)` (every `animation` declaration outside the reduced-motion block, with its selector), `stubReducedMotion()`, `advance(ms)`. The build minifies CSS: `200ms` may appear as `.2s`, `cubic-bezier(0.23, 1, 0.32, 1)` as `cubic-bezier(.23,1,.32,1)`, `0.1` as `.1`; assertions below allow both forms. Scoped keyframes are renamed `<name>-<hash>`.

---

### Task 1: The glance glides on its own layer

**Files:**

- Modify: `src/components/I9kNino.vue` (template lines 295–300; styles around lines 417–419, 484–486, 715–719, 890–915)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Produces: the DOM contract `[data-nino-part="eyes"] > [data-nino-part="glance"] > eye shapes`, with classes `i9k-nino__eyes` (look translate + transition) and `i9k-nino__glance` (idle look-around animation). Later tasks put the blink and beat on `.i9k-nino__eye` and never touch `.i9k-nino__eyes` with an animation.
- Produces: the test helper `transitionRules(stylesheet)`, same shape as `animationRules`, and the extended reduced-motion twin test that later tasks rely on to catch a missing `transition: none` or `animation: none`.

- [ ] **Step 1: Install dependencies**

Run: `pnpm install`
Expected: completes with no lockfile change (`git status` shows nothing new under the repo; `node_modules/` is ignored).

- [ ] **Step 2: Write the failing tests**

In `tests/I9kNino.test.ts`, add below `animationRules`:

```ts
/** Every `transition` declaration outside the reduced-motion block, with its selector. */
function transitionRules(stylesheet: Root) {
  const found: { selector: string; value: string }[] = [];
  stylesheet.walkDecls('transition', (decl) => {
    const rule = decl.parent as Rule;
    if (!isReducedMotionRule(rule)) found.push({ selector: rule.selector, value: decl.value });
  });
  return found;
}

/** A rule inside an @keyframes block: its declarations describe one frame, not a motion. */
function isKeyframeRule(rule: Rule) {
  return rule.parent?.type === 'atrule' && /keyframes$/.test((rule.parent as AtRule).name);
}
```

Rewrite `'stops every animation under prefers-reduced-motion'` so it covers transitions and ignores keyframe-level `animation-timing-function` declarations:

```ts
it('stops every animation and transition under prefers-reduced-motion', async () => {
  const stylesheet = await buildComponentStylesheet('I9kNino');
  const moving: string[] = [];
  const stilled: string[] = [];

  stylesheet.walkRules((rule) => {
    if (isKeyframeRule(rule)) return;
    for (const node of rule.nodes) {
      if (node.type !== 'decl') continue;
      if (!/^(animation|transition)(-|$)/.test(node.prop)) continue;
      if (isReducedMotionRule(rule) && node.value === 'none') stilled.push(rule.selector);
      else if (!isReducedMotionRule(rule) && node.value !== 'none') moving.push(rule.selector);
    }
  });

  expect(moving.length).toBeGreaterThan(0);
  for (const selector of moving) {
    expect(
      stilled.some((stilledSelector) => stilledSelector.includes(selector)),
      selector,
    ).toBe(true);
  }
});
```

In the `'I9kNino ambient life'` describe, change `'glances about only when idle and free to look'` to look at the new layer, and add two tests:

```ts
it('glances about only when idle and free to look', () => {
  const glances = animationRules(stylesheet).filter(
    ({ selector, value }) => selector.includes('.i9k-nino__glance') && value !== 'none',
  );

  expect(glances.length).toBeGreaterThan(0);
  for (const { selector } of glances) {
    expect(selector).toContain('.i9k-nino--idle');
    expect(selector).toContain('.i9k-nino--look-center');
  }
});

// A transition cannot hand over to an animation created or cancelled in the same
// style change, so the look and the ambient glance must live on different elements.
it('glides his eyes to a new look', () => {
  const glide = transitionRules(stylesheet).find(({ selector }) =>
    selector.includes('.i9k-nino--animated .i9k-nino__eyes'),
  );

  expect(glide?.value).toContain('transform');
  expect(glide?.value).toMatch(/200ms|\.2s/);
  expect(glide?.value).toMatch(/cubic-bezier\(0?\.23,\s*1,\s*0?\.32,\s*1\)/);
  expect(
    animationRules(stylesheet).filter(({ selector }) => /\.i9k-nino__eyes\[/.test(selector)),
  ).toEqual([]);
});
```

In the first describe (`'I9kNino'`), after `'moves only the eyes when it looks somewhere'`:

```ts
it("keeps the caller's look and his own glance on separate layers", () => {
  const wrapper = mount(I9kNino);
  const eyes = wrapper.get('[data-nino-part="eyes"]');
  const glance = eyes.get('[data-nino-part="glance"]');

  expect(glance.classes()).toContain('i9k-nino__glance');
  expect(glance.findAll('[data-nino-part="eye"]')).toHaveLength(2);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm exec vitest run tests/I9kNino.test.ts -t 'glance|glides|separate layers|reduced-motion'`
Expected: FAIL — no `glance` part, the look-around rule still targets `.i9k-nino__eyes`, and there is no transition.

- [ ] **Step 4: Split the eye layer and add the transition**

In the template, wrap the eye `<template v-for>` in a new group inside the existing eyes group:

```vue
<g class="i9k-nino__eyes" data-nino-part="eyes">
  <g class="i9k-nino__glance" data-nino-part="glance">
    <template v-for="(eye, index) in face.eyes" :key="`eye-${index}`">
      ...unchanged...
    </template>
  </g>
</g>
```

In the styles:

- Directly after the `.i9k-nino__eyes { transform: translate(...) }` rule add
  `.i9k-nino--animated .i9k-nino__eyes { transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1); }`
  with a comment that the look glides and that the ambient glance lives one layer in for the reason in the test comment.
- Change the look-around rule's target from `.i9k-nino__eyes` to `.i9k-nino__glance`
  (`.i9k-nino--animated.i9k-nino--idle.i9k-nino--look-center .i9k-nino__glance`), and the acting pause rule's third selector likewise (`.i9k-nino--animated.i9k-nino--acting.i9k-nino--look-center .i9k-nino__glance`).
- In the reduced-motion block, change the look-around twin to `.i9k-nino__glance` and add a second rule inside the same `@media`:
  `.i9k-nino--animated .i9k-nino__eyes { transition: none; }`.
- Update the layer comment inside the `<svg>` to end "…and eyes glances, with glance inside it carrying the idle look-around so the look's transition never meets an animation."

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/I9kNino.test.ts tests/I9kNinoSky.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: glide Nino's eyes to a new look on their own layer

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Eased ambient life, expression motion and talking

**Files:**

- Modify: `src/components/I9kNino.vue` (styles: the ambient, expression and talking rules and their keyframes)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: `.i9k-nino__glance` from Task 1.
- Produces: eased keyframes `i9k-nino-breathe`, `i9k-nino-antenna`, `i9k-nino-blink`, `i9k-nino-look-around`, `i9k-nino-hop`, `i9k-nino-bob`, `i9k-nino-tremor` (replaces `i9k-nino-shiver`), `i9k-nino-peek`, `i9k-nino-talk-closed`, `i9k-nino-talk-open`. The transform-origin rule now covers `.i9k-nino__eye, .i9k-nino__brow, .i9k-nino__mouth, .i9k-nino__hand`, which Task 3's beat relies on.

- [ ] **Step 1: Write the failing tests**

In the `'I9kNino ambient life'` describe, delete `'moves like a sprite: every animation is stepped, never eased'` (Task 4 adds the inverse once the actions are eased too) and add:

```ts
it('breathes and bobs continuously rather than in steps', () => {
  const rules = animationRules(stylesheet);
  const valueFor = (fragment: string) =>
    rules.find(({ selector }) => selector.includes(fragment))?.value ?? '';

  expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('alternate');
  expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('ease-in-out');
  expect(valueFor('.i9k-nino--thinking .i9k-nino__figure')).toContain('alternate');
  expect(valueFor('.i9k-nino--worried .i9k-nino__figure')).toContain('linear');
});

it('eases each blink shut and open', () => {
  const timings: string[] = [];
  stylesheet.walkAtRules(/keyframes$/, (atRule) => {
    if (!atRule.params.startsWith('i9k-nino-blink')) return;
    atRule.walkDecls('animation-timing-function', (decl) => timings.push(decl.value));
  });

  expect(timings).toContain('ease-in');
  expect(timings.some((value) => /cubic-bezier\(0?\.23,\s*1,\s*0?\.32,\s*1\)/.test(value))).toBe(
    true,
  );
});

it('keeps the ambient motion it had, now eased', () => {
  for (const { value } of animationRules(stylesheet)) {
    expect(value).not.toMatch(/steps\(|step-end|step-start/);
  }
});
```

Note the last test will fail until Task 4 for the beat and action rules; that is expected. Write it now so Tasks 2–4 each shrink the failure list, and keep it (it becomes the file-wide check in Task 4).

In the `'I9kNino talking'` describe add:

```ts
it('trades mouth heights instead of cutting between frames', async () => {
  const stylesheet = await buildComponentStylesheet('I9kNino');
  const frames: { name: string; prop: string; value: string }[] = [];
  stylesheet.walkAtRules(/keyframes$/, (atRule) => {
    if (!atRule.params.startsWith('i9k-nino-talk-')) return;
    atRule.walkDecls((decl) =>
      frames.push({ name: atRule.params, prop: decl.prop, value: decl.value }),
    );
  });

  const open = frames.filter(({ name }) => name.startsWith('i9k-nino-talk-open'));
  expect(
    open.filter(({ prop }) => prop === 'visibility').every(({ value }) => value === 'visible'),
  ).toBe(true);
  expect(
    open.some(({ prop, value }) => prop === 'transform' && /scaleY\(0?\.2\)/.test(value)),
  ).toBe(true);
  expect(
    frames.some(
      ({ name, prop, value }) =>
        name.startsWith('i9k-nino-talk-closed') &&
        prop === 'transform' &&
        /scaleY\(0?\.2\)/.test(value),
    ),
  ).toBe(true);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run tests/I9kNino.test.ts -t 'continuously|each blink|now eased|mouth heights'`
Expected: FAIL — the loops are stepped, there is no `alternate`, no keyframe timing functions, and talking toggles `visibility`.

- [ ] **Step 3: Rewrite the ambient, expression and talking rules**

Replace the stylesheet's header comment ("Motion is stepped, never eased…") with one naming the four curves and their jobs (settle `cubic-bezier(0.23, 1, 0.32, 1)` for anything that arrives; `ease-in` for anything that shuts or falls; `ease-in-out` for anything that sways; `linear` for the tremor), that held stops stay on the two-unit grid while parts travel between cells, and that the rule order is ambient → expression → talking → beat → actions → reduced motion.

Grow the origin rule to `.i9k-nino__eye, .i9k-nino__brow, .i9k-nino__mouth, .i9k-nino__hand { transform-box: fill-box; transform-origin: center; }`.

Animation shorthands (selectors unchanged except where noted):

| selector                                                    | animation                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `.i9k-nino--animated .i9k-nino__upper`                      | `i9k-nino-breathe 2.4s ease-in-out infinite alternate`                |
| `.i9k-nino--animated .i9k-nino__antenna`                    | `i9k-nino-antenna 3.2s ease-in-out infinite`                          |
| `.i9k-nino--animated.i9k-nino--thinking .i9k-nino__antenna` | `i9k-nino-antenna 1.2s ease-in-out infinite`                          |
| `…:not(.i9k-nino--eyes-closed) .i9k-nino__eye`              | `i9k-nino-blink 13s linear infinite` (each frame sets its own timing) |
| `….i9k-nino--idle.i9k-nino--look-center .i9k-nino__glance`  | `i9k-nino-look-around 9s cubic-bezier(0.23, 1, 0.32, 1) infinite`     |
| `….i9k-nino--happy .i9k-nino__figure`                       | `i9k-nino-hop 3.2s linear infinite` (each frame sets its own timing)  |
| `….i9k-nino--thinking .i9k-nino__figure`                    | `i9k-nino-bob 1.2s ease-in-out infinite alternate`                    |
| `….i9k-nino--worried .i9k-nino__figure`                     | `i9k-nino-tremor 160ms linear infinite`                               |
| `….i9k-nino--hiding .i9k-nino__hand--peek`                  | `i9k-nino-peek 5s ease-in-out infinite`                               |
| `….i9k-nino--talking .i9k-nino__mouth`                      | `i9k-nino-talk-closed 400ms ease-in-out infinite`                     |
| `….i9k-nino--talking .i9k-nino__mouth--talk`                | `i9k-nino-talk-open 400ms ease-in-out infinite`                       |

Keyframes (a stop's timing function applies to the segment that starts at it):

- `i9k-nino-breathe`: `from { transform: translateY(0) } to { transform: translateY(2px) }`.
- `i9k-nino-antenna`: `0%, 78%, 88%, 100% { opacity: 1 }` `83% { opacity: 0.3 }`.
- `i9k-nino-blink`: `0%, 30%, 31.3%, 62%, 63.3%, 92%, 93.3%, 94.6%, 100% { transform: scaleY(1); animation-timing-function: ease-in; }` and `30.5%, 62.5%, 92.5%, 93.8% { transform: scaleY(0.1); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }` — two single blinks and a double, each shutting in 65 ms and opening in 105 ms.
- `i9k-nino-look-around`: `0%, 60%, 77.1%, 100% { transform: translateX(0) }`, `61.1%, 68% { transform: translateX(calc(var(--i9k-nino-dir) * -4px)) }`, `69.1%, 76% { transform: translateX(calc(var(--i9k-nino-dir) * 4px)) }` — fixations held, 100 ms flicks.
- `i9k-nino-hop`: `0%, 84%, 93%, 100% { transform: translateY(0); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); }` `88% { transform: translateY(-4px); animation-timing-function: ease-in; }`.
- `i9k-nino-bob`: `from { transform: translateY(0) } to { transform: translateY(-2px) }`.
- `i9k-nino-tremor` (delete `i9k-nino-shiver`): `0%, 100% { transform: translate(1px, -0.5px) }` `25% { transform: translate(-1px, 0.5px) }` `50% { transform: translate(0.5px, 1px) }` `75% { transform: translate(-0.5px, -1px) }`.
- `i9k-nino-peek`: `0%, 72%, 88%, 100% { transform: translateY(0) }` `76%, 84% { transform: translateY(10px) }`.
- `i9k-nino-talk-closed`: `0%, 100% { transform: scaleY(1) }` `50% { transform: scaleY(0.2) }`.
- `i9k-nino-talk-open`: `0%, 100% { transform: scaleY(0.2); visibility: visible; }` `50% { transform: scaleY(1); visibility: visible; }`. The base `.i9k-nino__mouth--talk { visibility: hidden }` rule stays.

Move the two talking rules and their keyframes to sit directly **before** the mood-beat block (Task 3 rewrites that block; the order must already be talking → beat). The reduced-motion list is unchanged by this task (same selectors).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/I9kNino.test.ts`
Expected: everything passes except `'keeps the ambient motion it had, now eased'`, which fails only on beat and action selectors (`--beat-even`, `--beat-odd`, `--action-*`). Any ambient, expression or talking selector in its failure output is a bug in this task.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: ease Nino's ambient life and talking

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The two-phase mood morph, and fading arms and hands

**Files:**

- Modify: `src/data/nino.ts` (`NINO_BEAT`), `src/components/I9kNino.vue` (script lines 66–112 and 193–202; the beat block and the hiding rules in the styles)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: the origin rule and talking-before-beat order from Task 2.
- Produces: `NINO_BEAT = { swapAt: 120, duration: 300 } as const`; root classes `i9k-nino--beat` plus exactly one of `i9k-nino--beat-shut` / `i9k-nino--beat-open` while a beat runs; keyframes `i9k-nino-beat-shut`, `i9k-nino-beat-fade`, `i9k-nino-beat-open`, `i9k-nino-beat-unfade`, `i9k-nino-beat-hop`; `opacity: 0` (not `visibility`) for hidden arms and hands.

- [ ] **Step 1: Write the failing tests**

In `'I9kNino mood beat'`:

Extend `'blinks the old face shut and swaps the new one in behind its eyes'`: after the `setProps`, also `expect(wrapper.classes()).toContain('i9k-nino--beat-shut')`; after `advance(NINO_BEAT.swapAt)`, also `expect(wrapper.classes()).toContain('i9k-nino--beat-open')` and `not.toContain('i9k-nino--beat-shut')`; after the final advance, `expect(wrapper.classes().filter((name) => name.startsWith('i9k-nino--beat'))).toEqual([])`.

Replace `'blinks again when a second mood arrives mid-beat'` with:

```ts
it('shuts again when a second mood arrives mid-beat', async () => {
  const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

  await wrapper.setProps({ expression: 'thinking' });
  await advance(NINO_BEAT.swapAt + 20);
  expect(wrapper.classes()).toContain('i9k-nino--beat-open');

  await wrapper.setProps({ expression: 'worried' });
  expect(wrapper.classes()).toContain('i9k-nino--beat-shut');
  expect(wrapper.classes()).not.toContain('i9k-nino--beat-open');
  expect(wrapper.classes()).toContain('i9k-nino--thinking');

  await advance(NINO_BEAT.swapAt);
  expect(wrapper.classes()).toContain('i9k-nino--worried');
  expect(wrapper.classes()).toContain('i9k-nino--beat-open');

  await advance(NINO_BEAT.duration - NINO_BEAT.swapAt);
  expect(wrapper.classes()).not.toContain('i9k-nino--beat');
});
```

Replace `'runs a whole blink-and-hop for either beat phase'` with:

```ts
it('shuts and opens every face part through the beat', async () => {
  const stylesheet = await buildComponentStylesheet('I9kNino');
  const rules = animationRules(stylesheet);

  for (const part of ['eye', 'brow', 'mouth', 'hand', 'cheek']) {
    const shut = rules.find(({ selector }) => selector.includes(`--beat-shut .i9k-nino__${part}[`));
    const open = rules.find(({ selector }) => selector.includes(`--beat-open .i9k-nino__${part}[`));
    expect(shut?.value, `${part} shut`).toContain('forwards');
    expect(shut?.value, `${part} shut`).toMatch(/120ms|\.12s/);
    expect(open?.value, `${part} open`).toMatch(/180ms|\.18s/);
    expect(open?.value, `${part} open`).not.toContain('forwards');
  }
  const hop = rules.find(({ selector }) => selector.includes('--beat .i9k-nino__figure['));
  expect(hop?.value).toContain('i9k-nino-beat-hop');
  expect(hop?.value).toMatch(/300ms|\.3s/);
});

// The talk frame carries the mouth class too, so the beat's rules must come later
// in the stylesheet than talking's to win at equal specificity.
it('lets the beat take the mouth from the talk loop', async () => {
  const stylesheet = await buildComponentStylesheet('I9kNino');
  const order: string[] = [];
  stylesheet.walkRules((rule) => {
    if (!isReducedMotionRule(rule) && !isKeyframeRule(rule)) order.push(rule.selector);
  });
  const talking = order.findIndex((selector) => selector.includes('--talking .i9k-nino__mouth['));
  const beat = order.findIndex((selector) => selector.includes('--beat-shut .i9k-nino__mouth['));

  expect(talking).toBeGreaterThan(-1);
  expect(beat).toBeGreaterThan(talking);
});

it('raises his hands while the face opens', async () => {
  const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

  await wrapper.setProps({ expression: 'hiding' });
  expect(wrapper.findAll('[data-nino-part="hand"]')).toHaveLength(0);

  await advance(NINO_BEAT.swapAt);
  expect(wrapper.classes()).toContain('i9k-nino--beat-open');
  expect(wrapper.findAll('[data-nino-part="hand"]')).toHaveLength(2);
});
```

Extend `'shows the new mood at once when motion is switched off mid-beat'` with
`expect(wrapper.classes().filter((name) => name.startsWith('i9k-nino--beat'))).toEqual([]);`.

In `'I9kNino ambient life'`, rewrite `'lifts his arms off his sides to hide, and lowers his hands to act'` to collect `opacity` declarations whose value is `0` instead of `visibility: hidden` (same two selector assertions), and add:

```ts
it('fades his arms and hands rather than popping them', () => {
  const fades = transitionRules(stylesheet).filter(({ value }) => value.includes('opacity'));

  expect(fades.some(({ selector }) => selector.includes('.i9k-nino__arm['))).toBe(true);
  expect(fades.some(({ selector }) => selector.includes('.i9k-nino__hand['))).toBe(true);
  for (const { selector } of fades) expect(selector).toContain('.i9k-nino--animated');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run tests/I9kNino.test.ts -t 'mood beat|arms|hands'`
Expected: FAIL — no `--beat-shut` / `--beat-open` classes, no shut/open rules, arms still use `visibility`.

- [ ] **Step 3: Update the data**

In `src/data/nino.ts`, set `NINO_BEAT = { swapAt: 120, duration: 300 } as const` and rewrite its comment: a change of mood plays as a two-phase morph — the face squashes shut for `swapAt` ms, swaps, and opens over the rest of `duration`; the CSS uses the same 120 ms, 180 ms and 300 ms.

- [ ] **Step 4: Replace the beat state in the script**

Replace `beating` and `beatPhase: 'even' | 'odd'` with one ref:

```ts
/**
 * The two phases of a mood change. shut squashes every face part closed and
 * holds it; open grows the new face from closed. Parts that only the new face
 * has mount during open, so they start closed too.
 */
const beatPhase = ref<'shut' | 'open' | null>(null);
```

The `expression` watcher: `clearBeat()`; with motion off, `beatPhase.value = null` and swap synchronously; otherwise `beatPhase.value = 'shut'`, the swap timer (at `NINO_BEAT.swapAt`) sets `shownExpression` _and_ `beatPhase.value = 'open'`, the beat timer (at `NINO_BEAT.duration`) sets `beatPhase.value = null`. The `animated` watcher sets `beatPhase.value = null`. In `classes`, replace the beat entry with
`...(beatPhase.value ? ['i9k-nino--beat', `i9k-nino--beat-${beatPhase.value}`] : [])`.

- [ ] **Step 5: Rewrite the beat block and the hiding rules in the styles**

Hiding rules (near the top): replace `visibility: hidden` with `opacity: 0` in the rule that pairs `.i9k-nino--hiding:not(.i9k-nino--acting) .i9k-nino__arm` with `.i9k-nino--hiding.i9k-nino--acting .i9k-nino__hand`, and add
`.i9k-nino--animated .i9k-nino__arm, .i9k-nino--animated .i9k-nino__hand { transition: opacity 120ms ease-in-out; }`.

Beat block (after talking, before actions; delete the even/odd rules and the `-again` keyframes):

```css
.i9k-nino--animated.i9k-nino--beat-shut .i9k-nino__eye,
.i9k-nino--animated.i9k-nino--beat-shut .i9k-nino__brow,
.i9k-nino--animated.i9k-nino--beat-shut .i9k-nino__mouth,
.i9k-nino--animated.i9k-nino--beat-shut .i9k-nino__hand {
  animation: i9k-nino-beat-shut 120ms ease-in forwards;
}

.i9k-nino--animated.i9k-nino--beat-shut .i9k-nino__cheek {
  animation: i9k-nino-beat-fade 120ms ease-in forwards;
}

.i9k-nino--animated.i9k-nino--beat-open .i9k-nino__eye,
.i9k-nino--animated.i9k-nino--beat-open .i9k-nino__brow,
.i9k-nino--animated.i9k-nino--beat-open .i9k-nino__mouth,
.i9k-nino--animated.i9k-nino--beat-open .i9k-nino__hand {
  animation: i9k-nino-beat-open 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.i9k-nino--animated.i9k-nino--beat-open .i9k-nino__cheek {
  animation: i9k-nino-beat-unfade 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.i9k-nino--animated.i9k-nino--beat .i9k-nino__figure {
  animation: i9k-nino-beat-hop 300ms;
}
```

Keyframes: `i9k-nino-beat-shut { to { transform: scaleY(0.1) } }`, `i9k-nino-beat-fade { to { opacity: 0 } }`, `i9k-nino-beat-open { from { transform: scaleY(0.1) } }`, `i9k-nino-beat-unfade { from { opacity: 0 } }`, `i9k-nino-beat-hop { 0% { transform: translateY(0); animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1); } 40% { transform: translateY(-2px); animation-timing-function: ease-in; } 100% { transform: translateY(0); } }`.

Comment the block: why two phases (parts that mount at the swap start shut; parts that leave are already shut), why `forwards` (holds shut until the JS timer swaps, however late), and that the 40 % stop is `NINO_BEAT.swapAt`.

Reduced-motion block: remove the four even/odd twins; add the five beat selectors above (the four shut/open groups and the hop), and a second rule inside the same `@media` extending `transition: none` to `.i9k-nino--animated .i9k-nino__arm, .i9k-nino--animated .i9k-nino__hand` beside the eyes twin from Task 1.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm exec vitest run tests/I9kNino.test.ts tests/I9kNinoSky.test.ts`
Expected: everything passes except `'keeps the ambient motion it had, now eased'`, which now fails only on `--action-*` selectors.

- [ ] **Step 7: Commit**

```bash
pnpm exec prettier --write src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/data/nino.ts src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: morph Nino's face in two phases when his mood changes

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Eased one-shot actions

**Files:**

- Modify: `src/components/I9kNino.vue` (the action rules and keyframes)
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: `NINO_ACTION_DURATIONS` through `--i9k-nino-action-duration` (unchanged).
- Produces: eased keyframes `i9k-nino-wave`, `i9k-nino-jump`, `i9k-nino-jump-arms`, `i9k-nino-jump-shadow`, `i9k-nino-nod`, `i9k-nino-shake`, `i9k-nino-dizzy`, each starting and ending at rest; the file-wide "nothing stepped" guarantee.

- [ ] **Step 1: Write the failing tests**

In `'I9kNino ambient life'`, rename `'keeps the ambient motion it had, now eased'` to `'moves smoothly: nothing is stepped'` and make it file-wide:

```ts
it('moves smoothly: nothing is stepped', () => {
  expect(stylesheet.toString()).not.toMatch(/steps\(|step-end|step-start/);
});
```

Replace `'sways in two-unit steps and ends the dizzy spell at rest'` with a test over every one-shot that must end at identity (the shadow ends at `scaleX(1)`, so it is not in the list):

```ts
/** The frames of one scoped @keyframes block, by the name before its scope hash. */
function framesOf(stylesheet: Root, name: string) {
  const frames: { at: string; numbers: number[] }[] = [];
  stylesheet.walkAtRules(/keyframes$/, (atRule) => {
    if (atRule.params.replace(/-(?:data-v-)?[0-9a-f]{6,}$/, '') !== name) return;
    atRule.walkDecls('transform', (decl) => {
      frames.push({
        at: (decl.parent as Rule).selector,
        numbers: (decl.value.match(/-?\d+(\.\d+)?/g) ?? []).map(Number),
      });
    });
  });
  return frames;
}

it.each(['wave', 'jump', 'jump-arms', 'nod', 'shake', 'dizzy'])(
  'starts and ends the %s at rest',
  (name) => {
    const frames = framesOf(stylesheet, `i9k-nino-${name}`);
    const frameAt = (mark: RegExp) =>
      frames.find(({ at }) => at.split(',').some((part) => mark.test(part.trim())));

    expect(frames.length).toBeGreaterThan(2);
    expect(
      frameAt(/^(0%|from)$/)?.numbers.every((value) => value === 0),
      `${name} start`,
    ).toBe(true);
    expect(
      frameAt(/^(100%|to)$/)?.numbers.every((value) => value === 0),
      `${name} end`,
    ).toBe(true);
  },
);
```

(The existing `'sways only his head and arms when dizzy'` stays.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run tests/I9kNino.test.ts -t 'stepped|at rest'`
Expected: FAIL — action rules still use `steps(1, end)`, and the wave, dizzy and nod start away from rest.

- [ ] **Step 3: Rewrite the action keyframes**

Action rules keep their selectors and `var(--i9k-nino-action-duration)`; drop `steps(1, end)` and give `nod`, `shake` and `dizzy` `ease-in-out`, `wave`, `jump`, `jump-arms` and `jump-shadow` `linear` (their frames set their own timing). Keyframes, with the timing function named at a stop applying to the segment that starts there (`settle` = `cubic-bezier(0.23, 1, 0.32, 1)`):

- `i9k-nino-wave` (the right-hand arm): `0% { translate(0, 0); settle }` `14%, 34%, 54%, 74% { translate(0, -16px); ease-in-out }` `24%, 44%, 64% { translate(-2px, -18px); ease-in-out }` `86% { translate(0, -16px); ease-in }` `100% { translate(0, 0) }` — rise, three wiggles, hold, lower.
- `i9k-nino-jump` (figure): `0% { translateY(0); ease-in-out }` `12% { translateY(2px); settle }` `40% { translateY(-12px); ease-in }` `65% { translateY(2px); settle }` `80%, 100% { translateY(0) }`.
- `i9k-nino-jump-arms`: `0%, 12% { translateY(0); settle }` `30%, 55% { translateY(-14px); ease-in }` `75%, 100% { translateY(0) }`.
- `i9k-nino-jump-shadow`: `0% { scaleX(1); ease-in-out }` `12% { scaleX(1.1); settle }` `40% { scaleX(0.6); ease-in }` `65% { scaleX(1.1); settle }` `80%, 100% { scaleX(1) }`.
- `i9k-nino-nod` (upper): `0%, 35%, 70%, 100% { translateY(0) }` `15%, 50% { translateY(4px) }`.
- `i9k-nino-shake` (upper): `0%, 90%, 100% { translateX(0) }` `12%, 44%, 76% { translateX(-2px) }` `28%, 60% { translateX(2px) }`.
- `i9k-nino-dizzy` (upper): `0%, 100% { translate(0, 0) }` `6%, 38%, 70% { translate(2px, 0) }` `14%, 46%, 78% { translate(0, 2px) }` `22%, 54%, 86% { translate(-2px, 0) }` `30%, 62%, 94% { translate(0, -2px) }` — three circles, then home.

The reduced-motion list is unchanged by this task (same selectors). Update the "Actions:" comment to say each one-shot starts and ends at rest so the stage re-key and the class removal never cut a part off mid-air.

- [ ] **Step 4: Run the whole file**

Run: `pnpm exec vitest run tests/I9kNino.test.ts tests/I9kNinoSky.test.ts tests/I9kChat.test.ts tests/I9kNinoMaze.test.ts`
Expected: PASS, all of them.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write src/components/I9kNino.vue tests/I9kNino.test.ts
git add src/components/I9kNino.vue tests/I9kNino.test.ts
git commit -m "feat: ease Nino's one-shot actions

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Documentation, the MoodMorph story, and the full check

**Files:**

- Modify: `AGENTS.md` (the `I9kNino` bullet, lines 86–95), `showcase/registry/I9kNino.ts` (lines 7–8, 13, 39), `stories/I9kNino.stories.ts`
- Test: `tests/showcaseRegistry.test.ts` (existing), `pnpm run check`

**Interfaces:**

- Consumes: everything above.
- Produces: the `MoodMorph` story; the repository's description of Nino's motion matching the code.

- [ ] **Step 1: Update `AGENTS.md`**

In the `I9kNino` bullet, replace the sentence that begins "His SVG is layered (`stage` › `figure` › `upper` › arms and eyes)…" through "…repeated in the reduced-motion block at the end of the stylesheet." with:

> His SVG is layered (`stage` › `figure` › `upper` › arms and `eyes` › `glance` › eye shapes) so that each animation owns one layer's transform; anything that lifts him moves `figure`, so his feet come along, and the caller's `look` (a transition on `eyes`) and the idle glance (an animation on `glance`) sit on different elements because a transition cannot hand over to an animation created or cancelled in the same style change. Motion is eased, never `steps()`: resting poses stay on the two-unit grid while parts travel between cells. A mood change is a two-phase beat (`i9k-nino--beat-shut`, then `--beat-open` at `NINO_BEAT.swapAt`), so a part that mounts at the swap starts shut and opens. Every animated or transitioned selector is repeated with `none` in the reduced-motion block at the end of the stylesheet.

- [ ] **Step 2: Update the showcase registry**

In `showcase/registry/I9kNino.ts`:

- `summary`: replace "stepped ambient life, a reaction beat on mood changes" with "continuous ambient life (breathing, blinks, an antenna pulse, idle glances), a 300ms face morph on mood changes".
- `agentPrompt`, first paragraph: replace "Every motion is stepped like a sprite." with "Motion is eased: resting poses sit on the grid, and parts glide between cells."
- `agentPrompt`, the `expression` line: replace "A change plays a 240ms beat: his eyes shut, he hops, and the new face swaps in at 100ms." with "A change plays a 300ms morph: the face squashes shut, the new face swaps in at 120ms, and it opens."
- `agentPrompt`, the `look` line: append "A look change glides over 200ms."
- The gotcha "A changed expression shows 100ms later, after his eyes blink shut." becomes "A changed expression shows 120ms later, once the face has squashed shut."

- [ ] **Step 3: Update the stories**

In `stories/I9kNino.stories.ts`, change the `vue` import to `import { computed, onBeforeUnmount, onMounted, ref } from 'vue';`, update the `AmbientLife` comment to "Every mood with its ambient motion: continuous breathing, eased blinks, the antenna, the idle glance, the happy hop, the thinking bob, the worried tremor and the hiding peek.", and add after `AmbientLife`:

```ts
// The face morph, on a loop: every 1.6s the mood moves on, so the two phases
// (squash shut, swap, open) can be watched and recorded without the controls.
export const MoodMorph: Story = {
  render: () => ({
    components: { I9kNino },
    setup() {
      const index = ref(0);
      const paused = ref(false);
      const expression = computed(() => I9K_NINO_EXPRESSIONS[index.value]);
      let timer: ReturnType<typeof setInterval> | undefined;
      onMounted(() => {
        timer = setInterval(() => {
          if (!paused.value) index.value = (index.value + 1) % I9K_NINO_EXPRESSIONS.length;
        }, 1600);
      });
      onBeforeUnmount(() => clearInterval(timer));
      return { expression, paused };
    },
    template: `<div style="${row}"><I9kNino :expression="expression" size="lg" /><output>{{ expression }}</output><button type="button" @click="paused = !paused">{{ paused ? 'resume' : 'pause' }}</button></div>`,
  }),
};
```

- [ ] **Step 4: Run the full pipeline**

Run: `pnpm run check`
Expected: PASS — tests (including `tests/showcaseRegistry.test.ts`), Prettier, ESLint, vue-tsc for the library, stories and tests, the library build, the Storybook build and the showcase build.

- [ ] **Step 5: Verify in Storybook and capture evidence**

Run: `pnpm run storybook`. Check, in light and dark (toolbar colour mode) and at `sm`, `md` and `lg`:

- `MoodMorph`: each change squashes the whole face shut (eyes, mouth, brows, cheeks, hands), swaps, and opens; no part cuts; `hiding` raises the hands while the side arms fade.
- `AmbientLife`: continuous breathing in every mood; eased blinks; the antenna fades; the idle Nino's glance flicks and holds; happy hops, thinking bobs, worried trembles, hiding peeks.
- `LookingAround`, `LookingAroundRtl`, `GlancingRtl`: a `look` change glides; `start`/`end` and the idle glance mirror under `dir="rtl"`.
- `Actions`, `Talking`, `Hiding`: eased one-shots that end at rest; the mouth trades heights; a wave while hiding cross-fades hands and arms.
- `Still` and the OS reduced-motion setting (or DevTools rendering emulation): no movement, instant swaps, the ordinary mouth while talking.

Record a short screen capture of `MoodMorph` and `Actions` for the pull request. Save stills as `docs/visual-evidence/i9k-nino-smooth-motion/{mood-morph-light,mood-morph-dark,ambient-rtl-dark}.png`, matching the sibling folders.

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write AGENTS.md showcase/registry/I9kNino.ts stories/I9kNino.stories.ts
git add AGENTS.md showcase/registry/I9kNino.ts stories/I9kNino.stories.ts docs/visual-evidence/i9k-nino-smooth-motion
git commit -m "docs: describe Nino's eased motion and add the MoodMorph story

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage:** §4 grid policy — Global Constraints and Task 4's rest tests; §5 morph — Task 3; §6 ambient — Task 2; §7 glance — Task 1; §8 talking — Task 2 (keyframes) and Task 3 (order); §9 actions — Task 4; §10 hiding fades — Task 3; §11 motion off — the twin test from Task 1, extended by each task; §12 structure and docs — Tasks 1 (template), 3 (data, script) and 5; §13 tests — spread as listed; §14 is left to the builder.
- **Types:** `beatPhase: Ref<'shut' | 'open' | null>` is the only new type and appears once. Test helpers `transitionRules`, `isKeyframeRule` (Task 1) and `framesOf` (Task 4) are named identically where reused.
- **Proportion:** the CSS is the deliverable, so the plan carries keyframe stops as tables rather than full blocks; the script change is described by behaviour and one signature.
