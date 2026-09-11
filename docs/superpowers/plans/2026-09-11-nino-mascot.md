# Nino Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `I9kNino`, the one reusable definition of the 9k mascot: an inline-SVG pixel character with a closed expression set, a logical gaze direction, theme-aware token colours, and motion that switches off for `prefers-reduced-motion`.

**Architecture:** One SFC, `src/components/I9kNino.vue`. Every expression is a data record (`eyes` rectangles, optional `brows` rectangles, one `mouth` path string) in a frozen map keyed by expression name, so the template is a fixed shape and adding an expression never touches markup. Colours are component-local custom properties defaulting to package tokens; `--primary-text-color` is already theme-aware, so dark mode needs no override. Animation is applied only through the `i9k-nino--animated` class and is neutralised wholesale by one reduced-motion media block.

**Tech Stack:** Vue 3 SFC with `<script setup lang="ts">`, scoped CSS, Vitest + Vue Test Utils (jsdom), postcss for the compiled-stylesheet assertion, Storybook, and this package's hand-authored showcase registry.

**Spec:** `docs/superpowers/specs/2026-09-11-nino-mascot-design.md`

**Issue:** [ismail9k/9k.school#16](https://github.com/ismail9k/9k.school/issues/16) — **Branch:** `feat/16-nino-mascot`

## Global Constraints

- Prettier: two-space indent, single quotes, trailing commas, 100-character print width. Run `npm run format` after broad edits.
- Components are PascalCase with the `I9k` prefix; tests are `tests/I9kNino.test.ts`; stories are `stories/I9kNino.stories.ts`.
- Every public component and type is added to `src/index.ts`.
- A visual component owns its appearance in `<style scoped>` and must not rely on global classes.
- Shared types live in `src/types/components.ts` and are re-exported from `src/index.ts`.
- RTL is expressed with `[dir='rtl']` selectors, matching `I9kTimelineCard`.
- Every component exported from `src/index.ts` needs a matching `showcase/registry/<Name>.ts` entry; `tests/showcaseRegistry.test.ts` enforces it and pins the exported-component count.
- Tests assert public rendering and interaction behaviour, not implementation details.
- No external art assets, no image files, no new icons.
- Commit messages use Conventional Commits and end with:
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
- `git add` explicit paths only.

---

## File Structure

| File                             | Responsibility                                                   |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/types/components.ts`        | _(modify)_ `I9kNinoExpression`, `I9kNinoLook`, `I9kNinoSize`     |
| `src/components/I9kNino.vue`     | _(create)_ the character: geometry, expression map, gaze, motion |
| `src/index.ts`                   | _(modify)_ export the component and its three types              |
| `tests/I9kNino.test.ts`          | _(create)_ behaviour, state, accessibility, reduced motion       |
| `stories/I9kNino.stories.ts`     | _(create)_ the expression set, gaze, sizes                       |
| `showcase/registry/I9kNino.ts`   | _(create)_ summary, agent prompt, gotchas, demos                 |
| `showcase/registry/index.ts`     | _(modify)_ register the entry                                    |
| `tests/showcaseRegistry.test.ts` | _(modify)_ exported-component count 36 → 37                      |

---

### Task 1: Types and the component

**Files:**

- Modify: `src/types/components.ts`
- Create: `src/components/I9kNino.vue`
- Modify: `src/index.ts`
- Test: `tests/I9kNino.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `I9kNino` (default export of the SFC) and the types `I9kNinoExpression = 'idle' | 'happy' | 'thinking' | 'worried' | 'surprised' | 'eyes-closed'`, `I9kNinoLook = 'center' | 'up' | 'down' | 'start' | 'end'`, `I9kNinoSize = 'sm' | 'md' | 'lg' | 'auto'` — spelled out rather than composed from `I9kComponentSize`, because the showcase's value guard resolves a prop's legal values by reading the literals out of its type alias and would reject `size="lg"` against a composed alias. The component also exports the runtime array `I9K_NINO_EXPRESSIONS` from `src/types/components.ts`. Props: `expression?: I9kNinoExpression = 'idle'`, `look?: I9kNinoLook = 'center'`, `size?: I9kNinoSize = 'md'`, `animated?: boolean = true`, `label?: string | null = null`.

- [ ] **Step 1: Write the failing tests**

Create `tests/I9kNino.test.ts` covering: labelled vs decorative rendering, two eyes by default, brows only where declared, a distinct mouth per expression, modifier classes for `look`/`size`/`expression`, `animated: false` dropping the animated class, and a compiled-stylesheet reduced-motion assertion.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: FAIL — `src/components/I9kNino.vue` does not exist.

- [ ] **Step 3: Add the types**

Append to `src/types/components.ts`:

```ts
export const I9K_NINO_EXPRESSIONS = [
  'idle',
  'happy',
  'thinking',
  'worried',
  'surprised',
  'eyes-closed',
] as const;

export type I9kNinoExpression = (typeof I9K_NINO_EXPRESSIONS)[number];

export type I9kNinoLook = 'center' | 'up' | 'down' | 'start' | 'end';

export type I9kNinoSize = 'sm' | 'md' | 'lg' | 'auto';
```

- [ ] **Step 4: Write the component**

Create `src/components/I9kNino.vue` with the geometry from spec §2, the expression map from §3, the gaze classes from §4, the motion rules from §5, the sizing from §6 and the accessibility contract from §7.

- [ ] **Step 5: Export it**

Add to `src/index.ts`:

```ts
export { I9K_NINO_EXPRESSIONS } from './types/components';
export type { I9kNinoExpression, I9kNinoLook, I9kNinoSize } from './types/components';
export { default as I9kNino } from './components/I9kNino.vue';
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNino.test.ts`
Expected: PASS.

---

### Task 2: Showcase registry and story

**Files:**

- Create: `showcase/registry/I9kNino.ts`
- Modify: `showcase/registry/index.ts`
- Modify: `tests/showcaseRegistry.test.ts`
- Create: `stories/I9kNino.stories.ts`

**Interfaces:**

- Consumes: the component and types from Task 1.
- Produces: `I9kNinoEntry` in the registry's `entries` array.

- [ ] **Step 1: Run the registry test to verify it fails**

Run: `npx vitest run tests/showcaseRegistry.test.ts`
Expected: FAIL — the exported name count is 37 against a pinned 36, and `I9kNino` is undocumented.

- [ ] **Step 2: Write the registry entry**

`summary` over 20 characters; `agentPrompt` over 80 characters and containing `@9klabs/design`; at least one demo; `section: 'content'`. The prompt must state the `size="auto"` nesting rule and the decorative-by-default accessibility contract, because both are the kind of thing a consuming agent gets wrong.

- [ ] **Step 3: Register it and move the pinned count**

Import `I9kNinoEntry` in `showcase/registry/index.ts`, add it to `entries` beside `I9kAsciiEmojiEntry`, and change the pinned count in `tests/showcaseRegistry.test.ts` from 36 to 37. That number is a deliberate contract, so it moves rather than loosens.

- [ ] **Step 4: Write the story**

`stories/I9kNino.stories.ts`: the full expression set, the five gaze directions, the three fixed sizes, and a static (`:animated="false"`) case.

- [ ] **Step 5: Run the registry test to verify it passes**

Run: `npx vitest run tests/showcaseRegistry.test.ts`
Expected: PASS.

---

### Task 3: Full verification and commit

- [ ] **Step 1: Format**

Run: `npx prettier --write src/components/I9kNino.vue src/types/components.ts src/index.ts tests/I9kNino.test.ts stories/I9kNino.stories.ts showcase/registry/I9kNino.ts showcase/registry/index.ts tests/showcaseRegistry.test.ts docs/superpowers`

- [ ] **Step 2: Test, lint, typecheck, build**

Run, and record each real result: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm run build:showcase`.

- [ ] **Step 3: Commit with explicit paths**

```bash
git add src/components/I9kNino.vue src/types/components.ts src/index.ts \
  tests/I9kNino.test.ts tests/showcaseRegistry.test.ts stories/I9kNino.stories.ts \
  showcase/registry/I9kNino.ts showcase/registry/index.ts \
  docs/superpowers/specs/2026-09-11-nino-mascot-design.md \
  docs/superpowers/plans/2026-09-11-nino-mascot.md
git commit -m "feat: add I9kNino, the 9k mascot primitive"
```

---

## Self-Review

- **Spec coverage.** §2 construction → Task 1 Step 4. §3 expressions → Task 1 Steps 3 and 4. §4 gaze → Task 1 Step 4. §5 motion → Task 1 Step 4 plus the reduced-motion test in Step 1. §6 sizing → Task 1 Step 4. §7 accessibility → Task 1 Steps 1 and 4. §8 testing → Task 1 Step 1 and Task 2 Step 3.
- **Placeholders.** The geometry, expression table and colour tokens live in the spec and are referenced by section rather than restated, since spec and plan travel together.
- **Type consistency.** `I9kNinoExpression`, `I9kNinoLook`, `I9kNinoSize` and `I9K_NINO_EXPRESSIONS` are spelled identically in Tasks 1 and 2.
