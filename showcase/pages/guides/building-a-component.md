---
title: Building a component
description: The conventions a new component in @9klabs/design follows, from scoped styles and the size scale to its registry entry and tests, with a prompt that teaches them to an agent.
---

# Building a component

<p class="docs-lede">Adding a component to the design system takes more than the <code>.vue</code> file. It also needs an export, tests, a story and a page in these docs. This guide lists the conventions, and ends with a prompt that hands all of them to an agent.</p>

<DocsPageActions />

## The files a component touches

| File                            | What goes in it                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/components/I9kThing.vue`   | The component, with `<script setup lang="ts">` and `<style scoped>`                       |
| `src/index.ts`                  | `export { default as I9kThing } from './components/I9kThing.vue';`, plus any public types |
| `src/types/components.ts`       | Shared types, such as a variant union other components or consumers need                  |
| `tests/I9kThing.test.ts`        | Vitest and Vue Test Utils: rendering, interaction, accessibility                          |
| `stories/I9kThing.stories.ts`   | Storybook stories for each variant and state                                              |
| `showcase/registry/I9kThing.ts` | This site's page: summary, demos, gotchas and the agent prompt                            |
| `showcase/registry/index.ts`    | The entry, added to the `entries` list                                                    |

Some tests pin the public surface on purpose, so they fail until you update them deliberately:
`tests/I9kComponentContracts.test.ts` holds the export list, and `tests/showcaseRegistry.test.ts`
counts the exports and fails for any component without a registry entry.

## Styles

- **Scoped, and self-sufficient.** A component owns its appearance in `<style scoped>` and never
  relies on a global class for its look. Name its classes with the `i9k-` prefix and BEM-style
  modifiers: `i9k-thing`, `i9k-thing__label`, `i9k-thing--lg`.
- **Sizes through local custom properties.** Declare the component's own properties on its root
  class and redefine them per size modifier, drawing on the shared scale. `I9kButton` is the
  reference:

  ```css
  .i9k-thing {
    --i9k-thing-height: var(--control-height-md);
    --i9k-thing-font-size: var(--control-font-size-md);
    min-block-size: var(--i9k-thing-height);
    font-size: var(--i9k-thing-font-size);
  }

  .i9k-thing--sm {
    --i9k-thing-height: var(--control-height-sm);
    --i9k-thing-font-size: var(--control-font-size-sm);
  }
  ```

- **Theme tokens, not raw colors.** Use `--surface-color`, `--theme-text-color`,
  `--border-color` and the rest, so dark mode comes for free. Reach `html.dark` from scoped CSS with
  `:global(.dark) .i9k-thing` only for what no token covers.
- **Logical properties.** `margin-inline-start`, `inset-inline-end`, `text-align: start`. Never
  `left` or `right`, so the component mirrors in Arabic.
- **Motion that can stop.** Repeat every animated selector in a `prefers-reduced-motion: reduce`
  block.

## Props and types

- Type the size prop with `I9kComponentSize` (`sm`, `md`, `lg`, default `md`). Do not write the
  union again.
- A component that renders links takes `linkComponent?: string | object | null` and renders it with
  the destination as `to`.
- Every string a reader sees or hears, such as a button's accessible name, is a prop with an
  English default, so consumers can translate it.
- Icons come from `src/icons/paths.json` through `I9kIcon`. Add a missing icon to that file rather
  than inlining an SVG.

## Accessibility

Use the native element where one exists: a `<button>` for an action, a `<dialog>` for a modal,
`<details>` for a disclosure. Give every landmark and control an accessible name, keep focus
visible, and support the keyboard the way the matching
[ARIA pattern](https://www.w3.org/WAI/ARIA/apg/patterns/) describes. Test the names and states you
promise.

## Server rendering

Read `window`, `document` and `matchMedia` only in `onMounted` or later, and start timers only
there. State a consumer creates, such as a store, is created per app, never as a module singleton.

## Before you open a pull request

Check the component in light and dark, left to right and right to left, and at phone width. Then
run the whole pipeline:

```bash
npm run check
```

## The prompt

Paste this into an agent working in the `@9klabs/design` repository, followed by what the component
should do.

```text
You are adding a new component to @9klabs/design, a Vue 3 design system. Follow its conventions exactly.

Read first: AGENTS.md (the canonical repository guide), src/components/I9kButton.vue (the reference for scoped styles and the size scale), src/types/components.ts, and one similar existing component and its test.

Files to create or change:
- src/components/I9k<Name>.vue: <script setup lang="ts"> with defineProps/withDefaults and typed defineEmits, and <style scoped>.
- src/index.ts: export { default as I9k<Name> } from './components/I9k<Name>.vue'; plus any public types (export type { ... } from './types/components').
- tests/I9k<Name>.test.ts: Vitest with Vue Test Utils in jsdom. Assert rendering, every variant and size, events, keyboard behavior, and accessible names and states. Use explicit imports from vitest.
- stories/I9k<Name>.stories.ts: one story per variant and state.
- showcase/registry/I9k<Name>.ts and its entry in showcase/registry/index.ts: a summary, live demos whose code string is exactly what renders, gotchas, and a self-contained agent prompt that lists every prop with type and default, the emits, the slots, the behavior and a usage example. Demos that bind v-model declare a state object for each binding.
- Update tests/I9kComponentContracts.test.ts (the pinned export list) and the export count in tests/showcaseRegistry.test.ts.

Rules:
- The component owns its appearance in <style scoped>. Never rely on a global class. Classes are prefixed i9k- (i9k-<name>, i9k-<name>__part, i9k-<name>--modifier).
- Sizes: type the prop with I9kComponentSize ('sm' | 'md' | 'lg', default 'md'). Declare component-local custom properties on the root class (--i9k-<name>-height and so on) from --control-height-*, --control-font-size-* and --component-gap-*, and redefine them per size modifier.
- Colors come from theme tokens (--surface-color, --theme-text-color, --border-color, --primary-color, --focus-color, the status tokens) so dark mode works. Use :global(.dark) .i9k-<name> only for values no token covers.
- Use logical properties only (margin-inline-start, inset-inline-end, padding-block, text-align: start), so the component mirrors under dir="rtl".
- Every user-visible or announced string is a prop with an English default.
- Icons render through I9kIcon from src/icons/paths.json; add a missing icon there instead of inlining SVG.
- Links: accept linkComponent?: string | object | null and render it with the destination as `to`.
- Use the native element where one exists, give controls and landmarks accessible names, keep focus visible, and follow the matching WAI-ARIA pattern for keyboard support.
- Touch window, document and matchMedia only in onMounted or later. No module-level mutable state.
- Animations get a prefers-reduced-motion: reduce block repeating every animated selector.
- Prettier style: two-space indent, single quotes, trailing commas, 100-character lines.

Finish by running npm run check and fixing everything it reports. Check the component in light and dark, LTR and RTL, and at 375px wide.
```
