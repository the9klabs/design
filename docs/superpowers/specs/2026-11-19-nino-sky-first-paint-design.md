# Nino sky first paint — design

## Intent

`I9kNinoSky` ends the footer on both ismail9k.com and 9k.school. Today its stars and planets are
drawn on a `<canvas>` after mount, because their layout is computed from the measured box. The
server HTML therefore paints Nino floating in an empty band until hydration — the same blank-hero
problem we noticed on mistral.ai, smaller. The goal is that **the first paint already shows the
sky**, and that the canvas taking over is invisible.

## Goals

- Server-rendered HTML contains the stars and both planets, in theme colours, correctly clipped,
  for every `height` (`sm`, `md`, `lg`), in light and dark, LTR and RTL.
- When the canvas starts, nothing visibly moves, appears, or changes brightness.
- Without JavaScript (or with no 2D canvas), the server layer stays and is a complete still sky.

## Non-goals

- `I9kNinoMaze`. Its registry entry already tells consumers to pass a server-chosen seed; the fix
  is in the two sites' `error.vue` (see Follow-ups).
- Changing Nino's drift, drag, flight, boop or sparkles.
- Moving the twinkle out of canvas (that was approach C, not chosen).
- Restyling the sky. The look stays today's dotted halftone. Two pixel-art directions were
  mocked up and parked for later: chunky pixels with stepped twinkle and shaded pixel planets,
  and the same plus a pixel horizon (green hills and small props). Nothing here should make them
  harder later; the tile and the server layer would carry either.

## Anti-goals

- A visible jump, pop or flash when the canvas takes over.
- A heavy server payload: tens of kilobytes of SVG per footer is a failure even if it looks right.
- Hydration mismatch warnings.

## Approaches

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Server-render the same sky as SVG; the canvas takes over once it has drawn | Seamless and keeps the canvas, but the star layout must stop depending on the measured size |
| B | CSS radial-gradient dot pattern as a background | Cheapest; no planets, doesn't match the canvas, so the hand-over shows |
| C | Stars live in SVG permanently, twinkling with CSS; canvas keeps only sparkles | No hand-over at all, but up to hundreds of animated nodes and a rewrite of a working component |

The user picked A.

## Design

### 1. The star field becomes one repeating tile

The server cannot measure the box, so the star layout must not depend on it. Replace
`createSkyStars(width, height, seed)` with a fixed tile:

- `SKY_TILE` — a constant tile size in CSS px (starting point: 960 × 480, both multiples of
  `SKY_GRID`). Stars are generated once for the tile from the existing seeded `createRandom`, at the
  existing density (`SKY_AREA_PER_STAR`), on the 4px grid.
- The sky is that tile repeated from the box's physical top-left, in both directions, and clipped
  by the box. Width and height no longer change *where* stars are, only how much of the field is
  visible.
- `SKY_MAX_STARS` (a whole-sky cap) is replaced by the per-tile count. Wide screens get the same
  density as narrow ones instead of a thinner sky; this is an intended, visible change.
- Physical top-left in RTL too, as today — stars are not mirrored.

Repetition: so repeated tiles don't twinkle in lock-step, each tile's stars run at a slightly
different speed (e.g. period × a per-tile factor). Every tile is identical at time 0 — which is
what the server paints — and they drift apart after.

### 2. Planets get fixed sizes per height

Planet radii are computed from the measured height today: the crescent uses
`min(48, height × 0.18)` and the ringed planet `min(36, height × 0.14)`. Make each a constant per
`height` variant that keeps today's sizes at the default rem values (heights 192 / 288 / 384px):

| `height` | Crescent radius | Ringed radius |
|---|---|---|
| `sm` | 34.56 | 26.88 |
| `md` | 48 | 36 |
| `lg` | 48 | 36 |

Both sites use only `sm` and `md` and never override `--i9k-nino-sky-height`, so fixed sizes are
safe for current consumers. `planetDots`
returns dots relative to the planet's own centre, so a planet is identical wherever it is placed.
Placement stays proportional: crescent at 14% from the inline start and 32% down, ringed planet at
84% / 72%. RTL swaps sides as today.

### 3. The server layer

Inside `.i9k-nino-sky`, before the canvas, a decorative `<svg aria-hidden="true">` layer:

- One `<pattern>` holding one tile's stars, `patternUnits="userSpaceOnUse"`, filling a full-size
  `<rect>`. Stars are grouped into a few `<path>` elements by tone and by quantised opacity, so the
  payload is about one tile's worth of short path commands, not a node per star. Target: under
  10 KB of markup per sky.
- The pattern's `id` comes from Vue's `useId()` so several skies on one page don't collide and
  hydration matches.
- Fills use the same custom properties the canvas reads (`--i9k-nino-sky-star`, `-warm`, `-cool`,
  `-planet`), so theme and the `I9kSection` remap work with no script.
- Each star's opacity is its twinkle value at time 0 — exactly what the canvas's first frame draws.
- The two planets are positioned with CSS (`inset-inline-start` percentages), so RTL needs no
  script.
- The existing top-edge fade mask moves from the canvas to a wrapper around both layers.

### 4. Hand-over

After `draw()` succeeds for the first time, the component sets a flag that hides the SVG layer
(`visibility: hidden` or removal; builder's call). No cross-fade is needed because the two layers
paint the same pixels. If `getContext('2d')` returns nothing, the flag is never set and the SVG
stays.

### 5. A still sky is frozen at its first frame

A still sky (`animated=false` or reduced motion) currently draws every star at 0.6 opacity, while
the server layer shows each star at its time-0 twinkle value. Change the still sky to draw time 0,
so reduced-motion visitors also see no change at hand-over.

### 6. Tests

- `i9kNinoSkyMaths.test.ts`: the tile is deterministic, stays on the 4px grid, and its count
  matches the density; planet dots are relative to their centre and differ only by `height`.
- `I9kNinoSky.test.ts`: `renderToString` output contains the pattern, its stars and both planets
  for each `height`; ids are unique across two skies; hydrating the server HTML causes no mismatch
  warning; the SVG layer is hidden after a successful first draw and stays when `getContext`
  returns `null`.
- Update any existing assertions that rely on `createSkyStars(width, height)` or `SKY_MAX_STARS`
  deliberately, not by loosening them.

### 7. Docs

Update the `I9kNinoSky` registry entry: the sky now renders fully on the server, and its stars are
a repeating tile.

## Constraints

- Scoped styles only; tokens from `tokens.css`/`theme.css` (AGENTS.md).
- Keep the sky out of transformed ancestors (existing flight constraint) — unchanged.
- No inline `style` attributes in server output: an existing test ("renders %s on the server
  without a style attribute") forbids them for CSP. Planet positions and fills go in scoped classes
  or SVG attributes.
- `createSkyStars` and `SKY_MAX_STARS` are not exported from `src/index.ts` and nothing outside
  the component and its tests uses them, so replacing them touches no public API and no migration
  ledger row. `useId()` is available (Vue peer `^3.5.0`).
- Light/dark and LTR/RTL checks for this visual change, with screenshots in the PR.

## Left to the builder

- Exact tile size, opacity quantisation steps, and the per-tile speed factor, within the goals
  above (payload, no visible repetition, no visible hand-over).
- Whether the hidden SVG is removed or only hidden.
- Path encoding details.

## Follow-ups (other repositories)

- ismail9k.com `error.vue` and 9k.school `app/error.vue`: choose the maze seed on the server with
  `useState` and pass it to `I9kNinoMaze`, so the 404 maze is in the first paint.
