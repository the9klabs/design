# Nino Sky First Paint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `I9kNinoSky` server-renders its stars and planets, so the first paint already shows today's dotted sky and the canvas takes over invisibly.

**Architecture:** The star field becomes one seeded 960 × 480 tile repeated from the box's top-left, and planets get fixed radii per `height`, so nothing about the sky depends on measuring the box. The template renders that tile as an SVG `<pattern>` plus two planet SVGs (the "rest layer"); the canvas draws the same tile and planets, and the rest layer is hidden after the canvas's first successful draw.

**Tech Stack:** Vue 3.5 SFC (`useId`), TypeScript, Vitest + Vue Test Utils + `@vue/server-renderer`, scoped CSS.

**Spec:** `docs/superpowers/specs/2026-11-19-nino-sky-first-paint-design.md`

## Global Constraints

- No inline `style` attribute anywhere in server output (CSP; existing test `renders %s on the server without a style attribute`).
- Scoped styles only; colours only through the existing `--i9k-nino-sky-star`, `--i9k-nino-sky-warm`, `--i9k-nino-sky-cool`, `--i9k-nino-sky-planet` properties.
- Look stays today's: faint stars 2px (`SKY_GRID / 2`), warm/cool stars 3px (`SKY_GRID * 3 / 4`), faint alpha × 0.45, planet dots 2px at alpha 0.34, top-edge fade mask `linear-gradient(to bottom, transparent, #000 45%)`.
- Star density stays one per `SKY_AREA_PER_STAR` (900) px²; `SKY_GRID` stays 4.
- Stars are laid out from the physical top-left in RTL too; planets swap sides in RTL (crescent 14% from inline start, 32% down; ringed 84% / 72%).
- Planet radii: `sm` crescent 34.56 / ringed 26.88; `md` and `lg` crescent 48 / ringed 36.
- Rest layer markup target: under 10 KB per sky.
- No hydration mismatch warnings.
- Work on a branch (`feat/nino-sky-first-paint`), never on `main`. Conventional Commits.

## Review Focus

1. **Very wide screens (2560px, 3440px ultrawide):** the canvas must tile across the whole width, not stop after the first tile or two. Test in Task 1.
2. **A sky taller or shorter than its preset** (consumer overrides `--i9k-nino-sky-height`, or root font size isn't 16px): planet radii come from `height`, not the measured box, so canvas and rest layer still match. Test in Task 2.
3. **Arabic pages:** the planets must sit on the same swapped sides in the rest layer as on the canvas. Test in Task 3 (canvas side) and a source-text check of the `:dir(rtl)` rule.
4. **Reduced motion / `animated=false`:** the still sky is frozen at time 0, matching the rest layer. Test in Task 1.
5. **No 2D canvas (old browser, context lost, jsdom):** the rest layer stays visible forever. Test in Task 3.

---

### Task 0: Branch and housekeeping

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1:** `git switch -c feat/nino-sky-first-paint`
- [ ] **Step 2:** Add `.superpowers/` to `.gitignore` (brainstorm mockups live there).
- [ ] **Step 3: Commit** — `git add .gitignore docs/superpowers/specs/2026-11-19-nino-sky-first-paint-design.md docs/superpowers/plans/2026-11-19-nino-sky-first-paint.md && git commit -m "docs: plan Nino sky first paint"`

### Task 1: The star field becomes one repeating tile

**Files:**
- Modify: `src/composables/i9kNinoSky.ts` (star constants, `createSkyStars`, `starAlpha`)
- Modify: `src/components/I9kNinoSky.vue` (`measure`, `draw`)
- Test: `tests/i9kNinoSkyMaths.test.ts`, `tests/I9kNinoSky.test.ts`

**Interfaces:**
- Produces (in `i9kNinoSky.ts`):
  - `export const SKY_TILE_WIDTH = 960;` `export const SKY_TILE_HEIGHT = 480;`
  - `export function createSkyTile(seed = 9): SkyStar[]` — stars with `0 ≤ x < 960`, `0 ≤ y < 480`, on the 4px grid, `Math.floor(960 * 480 / SKY_AREA_PER_STAR)` = 512 of them, same tone split, `period` and `phase` as today.
  - `export const SKY_TILE_STARS: readonly SkyStar[] = createSkyTile();`
  - `export function tilePeriodFactor(column: number, row: number): number` — 1 for (0, 0); in `[1, 1.3]`; horizontally adjacent tiles differ.
  - `export function starAlpha(star: SkyStar, timeMs: number, periodScale = 1): number` — same curve as today with `star.period * periodScale`.
- Removes: `createSkyStars`, `SKY_MAX_STARS` (not exported from `src/index.ts`; only used here and in tests).

- [ ] **Step 1: Replace the `createSkyStars` tests with tile tests** in `tests/i9kNinoSkyMaths.test.ts`:

```ts
describe('createSkyTile', () => {
  it('draws the same tile for the same seed', () => {
    expect(createSkyTile(9)).toEqual(createSkyTile(9));
    expect(SKY_TILE_STARS).toEqual(createSkyTile());
  });
  it('gives one star per 900 px² of tile', () => {
    expect(createSkyTile()).toHaveLength(Math.floor((SKY_TILE_WIDTH * SKY_TILE_HEIGHT) / 900)); // 512
  });
  it('keeps every star inside the tile, on the pixel grid', () => {
    for (const star of createSkyTile()) {
      expect(star.x % SKY_GRID).toBe(0);
      expect(star.y % SKY_GRID).toBe(0);
      expect(star.x + SKY_GRID).toBeLessThanOrEqual(SKY_TILE_WIDTH);
      expect(star.y + SKY_GRID).toBeLessThanOrEqual(SKY_TILE_HEIGHT);
    }
  });
  // keep the existing "mostly faint, a few warm or cool" assertions, run on createSkyTile()
});

describe('tilePeriodFactor', () => {
  it('leaves the first tile alone and slows the others a little, each differently from its neighbour', () => {
    expect(tilePeriodFactor(0, 0)).toBe(1);
    for (let c = 0; c < 6; c++) for (let r = 0; r < 3; r++) {
      expect(tilePeriodFactor(c, r)).toBeGreaterThanOrEqual(1);
      expect(tilePeriodFactor(c, r)).toBeLessThanOrEqual(1.3);
      expect(tilePeriodFactor(c + 1, r)).not.toBe(tilePeriodFactor(c, r));
    }
  });
});

// in describe('starAlpha'):
it('starts every tile at the same brightness and lets them drift apart', () => {
  const [star] = SKY_TILE_STARS;
  expect(starAlpha(star, 0, 1.2)).toBe(starAlpha(star, 0));
  expect(starAlpha(star, 1500, 1.2)).not.toBe(starAlpha(star, 1500));
});
```

- [ ] **Step 2: Add component tests** in `tests/I9kNinoSky.test.ts`, reusing the recording-context pattern from `redraws a still sky…` (record `{ x, y, alpha: context.globalAlpha }` on every `fillRect`):
  - `tiles stars across a 3000px-wide sky` — `clientWidth` 3000, `clientHeight` 288, `animated: false`: some star `fillRect` has `x >= 2 * SKY_TILE_WIDTH`, and the star at `SKY_TILE_STARS[0]` appears at `x` and at `x + SKY_TILE_WIDTH` and `x + 2 * SKY_TILE_WIDTH`.
  - `freezes a still sky at its first frame` — `animated: false`: the first star's recorded alpha equals `starAlpha(SKY_TILE_STARS[0], 0) * (tone === 'faint' ? 0.45 : 1)`. Run once with `animated: false` and once with `stubMotion(true)`.

- [ ] **Step 3:** `pnpm exec vitest run tests/i9kNinoSkyMaths.test.ts tests/I9kNinoSky.test.ts` — Expected: FAIL (`createSkyTile` not exported; new component tests fail).

- [ ] **Step 4: Implement** the Produces list in `i9kNinoSky.ts` (`tilePeriodFactor` from a small hash of `(column, row)`, e.g. `1 + 0.3 * frac(sin-free integer hash)`; any deterministic choice that passes). In `I9kNinoSky.vue`: drop the `stars` variable and `createSkyStars` call from `measure`; in `draw`, loop tile columns `0..ceil(skyWidth / SKY_TILE_WIDTH) - 1` and rows `0..ceil(skyHeight / SKY_TILE_HEIGHT) - 1`, offset each `SKY_TILE_STARS` entry by the tile origin, skip ones outside the box, and use `starAlpha(star, still ? 0 : now, tilePeriodFactor(column, row))` (replacing today's fixed `0.6` for a still sky).

- [ ] **Step 5:** Re-run the two test files — Expected: PASS, including every existing sky test.

- [ ] **Step 6: Commit** — `git commit -am "feat: lay Nino's stars out as one repeating tile"`

### Task 2: Planets get fixed radii and relative dots

**Files:**
- Modify: `src/composables/i9kNinoSky.ts` (`planetDots`, new radii)
- Modify: `src/components/I9kNinoSky.vue` (`measure`, `draw`)
- Test: `tests/i9kNinoSkyMaths.test.ts`, `tests/I9kNinoSky.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `export type SkyHeight = 'sm' | 'md' | 'lg';` (use it for the component's `height` prop too)
  - `export const SKY_PLANET_RADII: Record<SkyHeight, { crescent: number; ringed: number }>` = `{ sm: { crescent: 34.56, ringed: 26.88 }, md: { crescent: 48, ringed: 36 }, lg: { crescent: 48, ringed: 36 } }`
  - `export function planetDots(kind: 'crescent' | 'ringed', radius: number): SkyDot[]` — dots relative to the planet's centre (0, 0), each on the 4px grid, same crescent/ring shapes as today.
  - `export function planetReach(kind: 'crescent' | 'ringed', radius: number): number` — half-size of the box that holds every dot plus its 2px size (`ceil(kind === 'ringed' ? radius * 1.9 : radius) + SKY_GRID`), used by Task 3's viewBox.

- [ ] **Step 1: Rewrite the `planetDots` test:** for each kind × each `SKY_PLANET_RADII` entry: more than 20 dots; every `dot.x % SKY_GRID === 0` and `dot.y % SKY_GRID === 0`; every `|dot.x| + 2 <= planetReach(kind, r)` and same for `y`; `planetDots(kind, r)` deep-equals itself on a second call. Add `expect(SKY_PLANET_RADII).toEqual({ sm: { crescent: 34.56, ringed: 26.88 }, md: { crescent: 48, ringed: 36 }, lg: { crescent: 48, ringed: 36 } })`.

- [ ] **Step 2: Add component test** `sizes the planets by height, not by the measured box` — recording context, `height: 'md'`, `clientWidth` 1000, `clientHeight` 500 (taller than the preset): the planet `fillRect` calls (alpha 0.34) equal exactly `planetDots('crescent', 48)` shifted by `(Math.round(1000 * 0.14), Math.round(500 * 0.32))` plus `planetDots('ringed', 36)` shifted by `(Math.round(1000 * 0.84), Math.round(500 * 0.72))`. Add an RTL variant (`getComputedStyle` direction `rtl` via `vi.spyOn(window, 'getComputedStyle')` returning `direction: 'rtl'` plus the real custom properties): crescent centre at `Math.round(1000 * 0.86)`.

- [ ] **Step 3:** Run both files — Expected: FAIL.

- [ ] **Step 4: Implement** the Produces list; in the component, compute planet dots once per `height` (a `computed`) and in `draw` add `Math.round(centre)` to each dot. Centres keep today's fractions and the existing `fromStart` RTL swap.

- [ ] **Step 5:** Run both files — Expected: PASS.

- [ ] **Step 6: Commit** — `git commit -am "feat: give Nino's planets fixed sizes per sky height"`

### Task 3: The server-rendered rest layer and the hand-over

**Files:**
- Modify: `src/composables/i9kNinoSky.ts` (path builder)
- Modify: `src/components/I9kNinoSky.vue` (template, hand-over flag, scoped CSS)
- Test: `tests/i9kNinoSkyMaths.test.ts`, `tests/I9kNinoSky.test.ts`

**Interfaces:**
- Consumes: `SKY_TILE_STARS`, `SKY_TILE_WIDTH`, `SKY_TILE_HEIGHT`, `starAlpha` (Task 1); `SKY_PLANET_RADII`, `planetDots`, `planetReach` (Task 2).
- Produces:
  - `export interface SkyPath { tone: SkyTone; opacity: number; d: string }`
  - `export function skyTilePaths(stars: readonly SkyStar[], steps = 16): SkyPath[]` — one path per (tone, opacity bucket); each star's opacity is `starAlpha(star, 0)` × 0.45 when faint, rounded to the nearest `1 / steps`; each star is a square of its drawn size (2 or 3px) at its `x, y`. Path encoding is the builder's call.
  - Root class `i9k-nino-sky--drawn` once the canvas has drawn successfully.
  - Markup: inside the root, before Nino's flight element, `<div class="i9k-nino-sky__backdrop" aria-hidden="true">` holding the canvas and `<div class="i9k-nino-sky__rest">` (the rest layer). The rest layer holds one full-size `<svg>` with `<defs><pattern :id patternUnits="userSpaceOnUse" width="960" height="480">` of `skyTilePaths` paths and a `<rect width="100%" height="100%" :fill="`url(#${id})`">`, plus two planet `<svg>`s with classes `i9k-nino-sky__planet i9k-nino-sky__planet--crescent|--ringed`, `viewBox` `-R -R 2R 2R` and `width`/`height` `2R`, where `R = planetReach(kind, SKY_PLANET_RADII[height][kind])`, and one path of 2px squares from `planetDots`. Pattern id from `useId()`.

- [ ] **Step 1: Maths test** `skyTilePaths`: every star appears exactly once across all paths (count `M`/`m` commands, or parse); every path's `opacity` is a multiple of `1/16`; for each star the opacity of its path is within `1/32` of its time-0 alpha; at most `3 * 17` paths.

- [ ] **Step 2: Component tests:**
  - `renders the sky itself on the server` — `it.each(['sm','md','lg'])`: `renderToString` output contains `<pattern`, `fill="url(#`, `i9k-nino-sky__planet--crescent`, `i9k-nino-sky__planet--ringed`, and still no `style=` (extend the existing test rather than duplicating it).
  - `keeps the rest layer under 10 KB` — the substring of the SSR output from `class="i9k-nino-sky__rest"` to its closing `</div>` is under 10 000 characters.
  - `gives two skies on one page different pattern ids` — render two skies in one SSR app; the two `<pattern id="…">` values differ and each `url(#…)` matches its own pattern.
  - `hydrates without a mismatch` — SSR render, put the HTML in a container, `createSSRApp(...).mount(container)` with `getContext` returning `null`, spy `console.warn`: no call mentions `Hydration`.
  - `hands over to the canvas after its first draw` — recording context: after mount the root has `i9k-nino-sky--drawn`. With `getContext` returning `null` (the default in this file): it never gets the class.
  - `mirrors the planets on Arabic pages` — read `src/components/I9kNinoSky.vue` as text (as `I9kScopedStyles.test.ts` does) and assert it contains a `:dir(rtl)` rule for each planet class.

- [ ] **Step 3:** Run both files — Expected: FAIL.

- [ ] **Step 4: Implement.**
  - Template and Produces as above; fills by class (`fill: var(--i9k-nino-sky-star)` etc.), opacity as the `fill-opacity` attribute, planet paths `fill-opacity="0.34"` with `fill: var(--i9k-nino-sky-planet)`.
  - CSS: `.i9k-nino-sky__backdrop { position: absolute; inset: 0; }` takes over the canvas's `mask-image`; `.i9k-nino-sky__rest` absolute, inset 0; planets `position: absolute; translate: -50% -50%;`, sized by their own `width`/`height` attributes of `2R` (attributes, not `style`, so CSP is satisfied and no CSS repeats the radii); crescent `left: 14%; top: 32%`, ringed `left: 84%; top: 72%`; under `:dir(rtl)` crescent `left: 86%`, ringed `left: 16%`; `.i9k-nino-sky--drawn .i9k-nino-sky__rest { visibility: hidden; }`.
  - Hand-over: a `drawn` ref set to `true` the first time `draw` gets a context and finishes; `classes` adds `i9k-nino-sky--drawn` when it is true.

- [ ] **Step 5:** Run both files — Expected: PASS. Then `pnpm test` — Expected: PASS (the style-contract suites `I9kScopedStyles` and `I9kExistingComponentStyles` included).

- [ ] **Step 6: Commit** — `git commit -am "feat: server-render Nino's sky so it is there on first paint"`

### Task 4: Docs, full check, visual proof

**Files:**
- Modify: `showcase/registry/I9kNinoSky.ts` (summary and gotchas)

- [ ] **Step 1:** In the registry entry, add a gotcha: the sky is fully server-rendered (stars as a repeating tile, planets sized by `height`), so it paints before hydration and needs no `ClientOnly`; and note that overriding `--i9k-nino-sky-height` changes how much of the star field shows, not planet sizes.
- [ ] **Step 2:** `pnpm run check` — Expected: exit 0 (tests, format, lint, types, library, Storybook and showcase builds).
- [ ] **Step 3: Visual check.** Open the `I9kNinoSky` showcase page via `pnpm run showcase`, with JavaScript disabled and enabled, in light and dark, LTR and RTL, at 1280px and 2560px. Without JS the sky shows stars and both planets; with JS there is no visible jump at hand-over. Save screenshots for the PR.
- [ ] **Step 4: Commit** — `git commit -am "docs: note that Nino's sky renders on the server"`
