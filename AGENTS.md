# AGENTS.md

Canonical instruction file for this repository, shared by all coding agents
(Claude Code, Codex, Cursor, and others). Claude Code reaches it through the
`@AGENTS.md` import in `CLAUDE.md`. Repository guidance belongs here — not in
`CLAUDE.md`, which is only a pointer.

## Project Structure & Module Organization

This package provides Vue 3 design-system components and shared CSS. Component source lives in `src/components/`; public exports are collected in `src/index.ts`. Keep design tokens and reusable primitives in `src/styles/`, icon data in `src/icons/`, reference data such as country calling codes in `src/data/`, and other static files in `src/assets/`. Storybook examples belong in `stories/`, with configuration under `.storybook/`. Vitest unit tests live in `tests/`. `dist/` and `storybook-static/` are generated outputs—do not edit or commit them.

The current projects using this design system are `9k.school` and `ismail9k.com`.

## Architecture

### Two style systems, one package

The package ships **one global stylesheet** (`src/styles/index.css`, exported as
`@9klabs/design/style.css`) and **per-component scoped CSS** compiled into the SFCs.
The split is deliberate and load-bearing:

- The global stylesheet supplies fonts, design tokens, theme application, branded element
  defaults, accessibility utilities, and temporary website-compatibility selectors. It is the only
  CSS a consumer imports.
- Every visual component owns its own appearance in `<style scoped>` and must not rely on global
  classes for its look. `tests/I9kScopedStyles.test.ts` enforces this for migrated components.

### Cascade layers

`src/styles/index.css` declares the full cascade order up front and imports each file into its
layer:

```
normalize, fonts, tokens, theme, base, primitives, utilities
```

Put new CSS in the layer that matches its job — `tokens.css` holds definitions only and must never
produce visual output; `base.css` holds branded element defaults; `primitives.css` holds the
legacy global classes being migrated away; `utilities.css` holds helpers such as `.sr-only`.
`tests/normalizeStyles.test.ts` builds the real stylesheet with Vite and asserts both the layer
order and which layer specific rules land in, so moving a rule between files is a test-visible
change.

### Token flow into components

Brand tokens live in `:root` in `tokens.css`. Scoped components do not consume raw brand values
for sizing directly — they declare component-local custom properties on their root class and
redefine those per size modifier. `I9kButton` is the reference implementation:

```css
.i9k-button      { --i9k-button-height: var(--control-height-md); ... }
.i9k-button--sm  { --i9k-button-height: var(--control-height-sm); ... }
```

The shared scale is `--control-height-*`, `--control-font-size-*`, and `--component-gap-*` for
`sm`/`md`/`lg`; `tests/I9kComponentContracts.test.ts` pins their values. Sizes and tones are typed
once in `src/types/components.ts` (`I9kComponentSize`, `I9kTone`) and re-exported from
`src/index.ts` — use those types rather than redeclaring string unions per component.

### Theming, RTL, and language

Theme is a class on `<html>` (`dark` / `light`), applied through `--theme-*` tokens in
`theme.css`; components reach dark mode from scoped CSS via `:global(.dark ...)`. Arabic
typography is selected automatically by `:lang(ar)`, with `.i9k-arabic` / `.i9k-arabic-display`
as manual escape hatches. Visual changes need light/dark and LTR/RTL checks.

### Website migration in progress

`docs/migrations/ismail9k-com-component-library.md` is the source of truth for the ongoing
migration of the live Nuxt site at `../ismail9k.com` (consumed via a `file:` dependency). Its
invariants govern this repo: the package lands a replacement before the website drops the old
contract, and **no legacy selector or prop may be removed until its ledger row is complete and
repository search shows zero live usage**. This is why components emit legacy classes alongside
`i9k-` ones (`I9kButton` renders both `btn btn--primary` and `i9k-button i9k-button--primary`) and
why `primitives.css` still carries `.surface`, `.badge`, `.grid` and friends. Design specs and
plans behind this work live in `docs/superpowers/`.

### Component conventions worth knowing

- `I9kButton` renders `<button>`, `<a>`, or a caller-supplied component: pass `to`/`href` for a
  link, and `link-component="RouterLink"` in Vue Router apps.
- `I9kInput` names its visual scale prop `uiSize`, not `size`, so the native HTML `size` attribute
  stays available.
- `I9kIcon` renders from the local `src/icons/paths.json` set; entries are either a path string or
  `{ viewBox, path }`. It is `aria-hidden` unless given a `title` or `desc`. Add icons to that JSON
  rather than inlining SVG in components.
- `I9kNino` takes one-shot actions imperatively: hold a template ref and call
  `play('wave' | 'jump' | 'nod' | 'shake' | 'dizzy')`, which resolves with `{ action, completed }`
  and emits `action-end` with the same object; `completed` is false when a newer call cut it off,
  and an unmount resolves `completed: false` without emitting. Each duration lives once, in `NINO_ACTION_DURATIONS` (`src/data/nino.ts`), and reaches the keyframes
  through `--i9k-nino-action-duration`. His SVG is layered (`stage` › `figure` › `upper` › arms and
  eyes) so that each animation owns one layer's transform; anything that lifts him moves `figure`,
  so his feet come along. Every keyframe is `steps(1, end)` on the two-unit grid, and every
  animated selector is repeated in the reduced-motion block at the end of the stylesheet.
- `I9kNinoMaze` is the 404 game. Its rules and generator live in `src/utils/ninoMaze.ts` and are
  pure: a seed (a string is hashed) always builds the same maze, and `generateNinoMaze` only
  returns mazes its `(tile, turn)` search proves winnable, so the unit suite can test the game.
  Sound is `src/utils/chiptune.ts` through `useI9kChiptune`, which never creates an AudioContext
  while muted or before the visitor interacts. Without a seed it server-renders an empty board and
  picks the seed on mount.
- `I9kNinoSky` lets a visitor drag Nino and throw him around the window. The physics (release
  velocity, air drag, bounces off the window's edges, the home offset) lives as pure functions in
  `src/composables/i9kNinoSky.ts`, which also holds every tuning constant. The component only runs
  the state machine (`drifting`, `dragging`, `flying`, `returning`). While airborne, the flight
  element is `position: fixed` so the sky's `overflow: hidden` cannot clip it, which means an
  ancestor with a transform or filter would trap him; keep the sky out of one. Landing above the
  sky's top edge swoops him back and plays the `dizzy` expression and action.
- `I9kSection variant="primary"` fills the section with the brand green and re-maps the theme
  tokens its header and body read (`--primary-color` becomes white, `--on-primary-color` green,
  and so on), so nested components stay visible without props of their own. It re-maps them on
  those children, not on the root, because the root still reads the green for its fill. When a
  new component reads a theme token, check how it renders inside that section;
  `tests/I9kExistingComponentStyles.test.ts` checks the remapped pairs for WCAG AA contrast.
  Status colors (error, warning, success) are not remapped and are invisible on the green, and an
  `I9kModal` placed inside the section inherits the remap and turns translucent, so keep both out
  of it. `fullWidth` paints the fill past the column with a `border-image` outset rather than a
  `100vw` box, so it never adds a horizontal scrollbar.
- `I9kContainer` is the page column: the one measure `I9kNavigation`, `I9kFooter`,
  `I9kPageContainer` and every page section share, from the `--container-width-sm|md|lg` and
  `--container-gutter` tokens. It sets only width and centring, so padding, backgrounds and
  min-height stay with the caller and a full-bleed band is an element around it. Do not nest one
  inside another (the inner one takes the gutter off twice on a phone); a narrower block inside a
  column is `max-width` plus `margin-inline: auto`. `size="lg"` widens one container; an area that
  needs the wide column throughout, chrome included, redefines `--container-width-md` on its root.
  `I9kPageContainer` remains the page-level wrapper (flex column, minimum height) and derives its
  width from the same token through its own `--i9k-page-container-width`; its `size` is still the
  gutter, so its content lines up with the chrome only for `md`, or once the viewport is wider than
  the column plus twice that size's gutter (1304px for `lg`, 1232px for `sm`). Anything that must
  share the bar's edge on every viewport is an `I9kContainer`.
- `I9kToaster` is the one place notifications appear: install `createI9kToaster()` per app, render
  one `<I9kToaster />` at the root before the page content in the tree (a toaster never announces a
  toast raised before its own setup ran, so one raised by a page's setup above it would be shown but
  never announced), raise toasts with `useI9kToastSource()` or `useI9kToaster().show()`; an open
  `I9kModal` and `I9kSidebarLayout`'s open drawer each host their own, so notifications stay
  readable above the inert page. A toast raised in the same tick a modal closes, which the modal's
  toaster unmounted before announcing, is handed to the page's toaster (a macrotask later, once the
  dialog has closed) through `markAnnounced` and `unregisterHost`; one the modal announced is never
  repeated by the page, so a consumer need not wait for the close before raising a result. The store
  is per app, never a module singleton, so server renders never share notifications. `I9kToast`
  alone stays for standing status in the page flow.

## Documentation site (the showcase)

`showcase/` is the documentation site at https://design.the9klabs.com, built with VitePress 1 and
themed to the 9k design language. It is for people and agents both: a page per component (live
demos, gotchas, a props/emits/slots table extracted from the component's own source, and a
copy-paste agent prompt), plus foundations and guides, and a Markdown twin of every page. `pnpm run
showcase` serves it in dev; `pnpm run build:showcase` writes static HTML to `showcase-dist/`
together with each page's twin at `<path>.md`, `llms.txt` (an llmstxt.org index of the twins that
opens with the rules), `llms-full.txt`, `components.json` and `sitemap.xml`. `pnpm run check` runs
`build:showcase` as part of its full pipeline.

Where things live:

- `showcase/.vitepress/config.ts` — nav, sidebar, search, head links, the ` ```vue demo ` fence,
  and the `buildEnd` hook that writes the machine-readable files (a dev middleware serves the same
  files).
- `showcase/.vitepress/theme/` — the default theme extended: `style.css` maps every `--vp-*`
  variable onto a 9k token, and the `Docs*` components are the demo frame, page actions, Nino
  hero, the landing page's footer (`I9kFooter` plus `I9kNinoSky`, as on 9k.school and
  ismail9k.com, in place of VitePress's own) and the widgets pages place by name. The docs are
  English-only, so the nav has no language or direction switch; a demo that shows RTL sets `dir`
  itself. VitePress ships Vue's runtime-only build, so `compileDemo.ts` compiles demo templates
  with `@vue/compiler-dom` itself. Demos sit in `.vp-raw`, which `postcssIsolateStyles` keeps
  VitePress's prose styles out of; a theme rule of ours that targets `.vp-doc` content must skip
  `.vp-raw` the same way.
- `showcase/pages/` — the Markdown pages. Every guide is listed in sidebar order in
  `showcase/site/pages.ts` (`GUIDE_GROUPS`) and needs `title` and `description` front matter;
  `tests/showcaseSite.test.ts` fails when a file and the list disagree. A `<DocsX />` widget on a
  page needs a Markdown form in `WIDGETS` (`showcase/site/markdown.ts`), or the build fails.
  Static files such as `_headers` and `robots.txt` live in `showcase/pages/public/`.
- `showcase/pages/components/[slug].paths.ts` generates every component page from the registry
  through `showcase/site/componentPage.ts`; there is no Markdown file per component.

Component pages are hand-authored per component, not fully automatic: every component exported
from `src/index.ts` needs a matching entry in `showcase/registry/<Name>.ts` (summary, agent prompt,
gotchas, demos), and `tests/showcaseRegistry.test.ts` enforces this — it fails whenever an exported
component has no registry entry. Adding a component to `src/index.ts` therefore always requires
adding its registry entry in the same change; do not assume the docs cover a component just
because the component itself exists — check the registry, or run the test, rather than trusting a
list here that would go stale.

Cloudflare Pages deploys the docs site through its Git integration, not through GitHub Actions: it
builds `main` to production and every other branch to a preview URL. The project's build command
is `pnpm run build:showcase`, and the output directory comes from `pages_build_output_dir` in
`wrangler.jsonc`, which Cloudflare reads before the dashboard. Its build image does not read the
pnpm version from `package.json` or the lockfile, so the project sets `PNPM_VERSION` (matching
`packageManager` in `package.json`) and `NODE_VERSION` as environment variables; bump
`PNPM_VERSION` whenever `packageManager` changes, or the frozen install fails. The one workflow,
`.github/workflows/ci.yml`, runs `pnpm run check` on every push and pull request and deploys
nothing.

## Build, Test, and Development Commands

- `pnpm install`: install the dependencies recorded in `pnpm-lock.yaml`. The repository uses pnpm
  only, at the version pinned by `packageManager` in `package.json`; do not add a
  `package-lock.json`, because Cloudflare picks its package manager from the lockfile it finds.
- `pnpm run storybook`: start the component workshop at port 6006.
- `pnpm test`: run the Vitest suite once.
- `pnpm run test:watch`: rerun affected tests while developing.
- `pnpm run lint`: check TypeScript and Vue files with ESLint.
- `pnpm run format:check`: verify Prettier formatting without rewriting files.
- `pnpm run typecheck`: type-check the library, Storybook, and unit tests.
- `pnpm run build`: create the ESM library and declarations in `dist/`.
- `pnpm run check`: run the complete test, formatting, lint, type, library, and Storybook build pipeline.
- `pnpm exec vitest run tests/I9kButton.test.ts`: run a single test file.
- `pnpm exec vitest run -t 'renders an anchor'`: run tests matching a name across the suite.

## Coding Style & Naming Conventions

Use TypeScript and Vue Single-File Components where practical. Prettier enforces two-space indentation, single quotes, trailing commas, and a 100-character print width; run `pnpm run format` before submitting broad edits. Name components in PascalCase with the `I9k` prefix (`I9kButton.vue`), stories as `I9kButton.stories.ts`, and tests as `I9kButton.test.ts`. Prefer scoped component styles, existing CSS custom properties, and `i9k-` prefixes for package-specific classes. Add every public component or type to `src/index.ts`.

## Testing Guidelines

Write tests with Vitest and mount Vue components with Vue Test Utils in the configured jsdom environment. Assert public rendering and interaction behavior rather than implementation details. Add focused cases for new variants, state changes, events, and accessibility contracts. Keep each test independent and use explicit imports from `vitest`. No coverage threshold is configured; cover changed behavior and run `pnpm run check` before opening a pull request.

Some suites are not ordinary component tests and are slower because they invoke a real Vite build to
inspect emitted CSS with PostCSS: `normalizeStyles.test.ts` (global cascade layers) and
`I9kExistingComponentStyles.test.ts` (per-component scoped output). `I9kComponentContracts.test.ts`
and `I9kScopedStyles.test.ts` assert on source text to pin the public export list, shared token
values, and the scoped-style rule. Expect these to fail when you move CSS between files or rename a
token, and update them deliberately rather than loosening the assertion.

## Commit & Pull Request Guidelines

Recent history follows Conventional Commits such as `feat: add I9kInput` and `fix: refine selector for Arabic page header titles`. Use a lowercase type (`feat`, `fix`, `chore`, `docs`, or `test`) and a concise imperative summary. Pull requests should explain the user-facing effect, list verification performed, and link relevant issues. Include Storybook screenshots or recordings for visual changes, noting light/dark and RTL checks when applicable. Keep generated artifacts and unrelated refactors out of the change.

## Agent configuration

Skill-managed settings live under `docs/agents/` as small, focused files rather
than inline here, so each can be read by only the skill that needs it:

- `docs/agents/issue-tracker.md` — where issues and intents live for this repo,
  how to read them, and how finished work links back to them (written by the
  `setup-issue-tracker` skill)

As more skills are adopted, each may add its own file under `docs/agents/`.
List those files here so this section remains a table of contents rather than
accumulating their configuration inline.

## Workflow

1. Talk the problem through — with Superpowers' `brainstorming` when it is
   installed. For work with no intent issue, once the problem is understood
   and before any approach is proposed, ask: build it now, or track it first?
   `superpowers-issue-bridge` defines this step.
2. **Build now:** continue with the usual development workflow — spec, plan,
   code, and pull request. No intent issue is involved.
3. **Track first:** `brainstorm-to-issue` files an intent issue in the tracker
   recorded in `docs/agents/issue-tracker.md`, with any decisions already made
   under Constraints. The session ends there.
4. To build a tracked issue, reference it (for example, "implement #42").
   `superpowers-issue-bridge` seeds brainstorming from the issue and carries
   its reference into the spec and plan.
5. When the work lands, link it back using the Linking section of
   `docs/agents/issue-tracker.md`. `superpowers-issue-bridge` asks whether the
   work fully resolves the issue, which closes it, or is partial.
