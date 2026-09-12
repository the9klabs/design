# AGENTS.md

Canonical instruction file for this repository, shared by all coding agents
(Claude Code, Codex, Cursor, and others). Claude Code reaches it through the
`@AGENTS.md` import in `CLAUDE.md`. Repository guidance belongs here — not in
`CLAUDE.md`, which is only a pointer.

## Project Structure & Module Organization

This package provides Vue 3 design-system components and shared CSS. Component source lives in `src/components/`; public exports are collected in `src/index.ts`. Keep design tokens and reusable primitives in `src/styles/`, icon data in `src/icons/`, and other static files in `src/assets/`. Storybook examples belong in `stories/`, with configuration under `.storybook/`. Vitest unit tests live in `tests/`. `dist/` and `storybook-static/` are generated outputs—do not edit or commit them.

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

## Component showcase

`showcase/` is an agent-friendly, server-rendered page that documents each public component: a
summary, a copy-paste-ready agent prompt, gotchas, live demos, and a props/emits/slots table
extracted from the component's own source. `npm run showcase` serves it in dev; `npm run
build:showcase` server-renders it to static HTML in `showcase-dist/` and also emits
`components.json` and `llms.txt` there for machine consumption. `npm run check` runs
`build:showcase` as part of its full pipeline.

The showcase is hand-authored per component, not fully automatic: every component exported from
`src/index.ts` needs a matching entry in `showcase/registry/<Name>.ts` (summary, agent prompt,
gotchas, demos), and `tests/showcaseRegistry.test.ts` enforces this — it fails whenever an exported
component has no registry entry. Adding a component to `src/index.ts` therefore always requires
adding its showcase entry in the same change; do not assume the showcase covers a component just
because the component itself exists — check the registry, or run the test, rather than trusting a
list here that would go stale.

The showcase deploys to Cloudflare Pages via `.github/workflows/showcase.yml`, this repository's
first CI workflow: the `build` job (test, format, lint, typecheck, library build, Storybook build,
showcase build) runs on every push and pull request, and the `deploy` job additionally runs on
pushes to `main` and publishes `showcase-dist/` with `wrangler.jsonc` — the deploy command is a
bare `pages deploy`, because the project name and the output directory both come from that config
file. Deploying requires a Cloudflare Pages project named `9k-design-system` and two repository
secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. When either secret is missing the
`deploy` job skips the upload with a workflow warning instead of failing, so an unconfigured
repository still gets a green pipeline — check that warning before assuming the showcase went
live.

## Build, Test, and Development Commands

- `npm ci`: install the exact dependencies recorded in `package-lock.json`.
- `npm run storybook`: start the component workshop at port 6006.
- `npm test`: run the Vitest suite once.
- `npm run test:watch`: rerun affected tests while developing.
- `npm run lint`: check TypeScript and Vue files with ESLint.
- `npm run format:check`: verify Prettier formatting without rewriting files.
- `npm run typecheck`: type-check the library, Storybook, and unit tests.
- `npm run build`: create the ESM library and declarations in `dist/`.
- `npm run check`: run the complete test, formatting, lint, type, library, and Storybook build pipeline.
- `npx vitest run tests/I9kButton.test.ts`: run a single test file.
- `npx vitest run -t 'renders an anchor'`: run tests matching a name across the suite.

## Coding Style & Naming Conventions

Use TypeScript and Vue Single-File Components where practical. Prettier enforces two-space indentation, single quotes, trailing commas, and a 100-character print width; run `npm run format` before submitting broad edits. Name components in PascalCase with the `I9k` prefix (`I9kButton.vue`), stories as `I9kButton.stories.ts`, and tests as `I9kButton.test.ts`. Prefer scoped component styles, existing CSS custom properties, and `i9k-` prefixes for package-specific classes. Add every public component or type to `src/index.ts`.

## Testing Guidelines

Write tests with Vitest and mount Vue components with Vue Test Utils in the configured jsdom environment. Assert public rendering and interaction behavior rather than implementation details. Add focused cases for new variants, state changes, events, and accessibility contracts. Keep each test independent and use explicit imports from `vitest`. No coverage threshold is configured; cover changed behavior and run `npm run check` before opening a pull request.

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
