# I9kNinoMaze: the 404 maze, in the package, with random mazes — design

## 1. Summary

9k.school's 404 page has a small game, `NinoMaze`: Nino walks a hand-authored 9×7 pixel maze to
his house while two bugs patrol the corridors. Getting caught sends everyone back to the start.
It is keyboard and d-pad playable, announces every turn to screen readers, and plays chiptune
blips through Web Audio. Its rules are a pure, deterministic module, which is what makes the game
unit-testable.

This change moves the game into `@9klabs/design` as `I9kNinoMaze`, restyled in the package's
design language, and replaces the single fixed layout with **seeded random mazes**: every seed
produces one maze, the same seed always produces the same maze, and every generated maze is
provably winnable.

### Goals

- A consumer renders `<I9kNinoMaze />` and gets a fresh, winnable maze per visit.
- A seed reproduces a maze exactly, so a maze can be replayed, shared as a short code, and tested.
- The rules stay pure and deterministic; the component only renders a state and feeds it input.
- The chiptune sound effects ship inside the package and stay silent until the visitor interacts.
- Every visible string can be localized by the consumer; the package ships English defaults.
- Light/dark and LTR/RTL both work, and the game is fully playable from the keyboard.

### Non-goals

- Level progression, scores, collectibles, persistence, or bugs that chase Nino.
- Swipe gestures. The d-pad is the touch control.
- Migrating 9k.school to the new component. That is a follow-up change in that repository.

## 2. Files

| File                                                                            | Role                                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/utils/ninoMaze.ts`                                                         | Pure rules: seeded PRNG, generator, solvability check, state, turns                    |
| `src/utils/chiptune.ts`                                                         | Web Audio square-wave synth, ported from 9k.school unchanged in behavior               |
| `src/composables/i9kChiptune.ts`                                                | Wires the synth to a component: unlock on first gesture, dispose on unmount            |
| `src/components/I9kNinoMaze.vue`                                                | The game UI                                                                            |
| `src/types/components.ts`                                                       | `I9kNinoMazeDifficulty`, `I9kNinoMazeLabels`, `I9kNinoMazeResult`                      |
| `src/icons/paths.json`                                                          | Adds `arrowLeft`, `arrowRight`, `dice`, `volumeOn`, `volumeOff`                        |
| `src/index.ts`                                                                  | Exports the component, its types, and `formatI9kNinoMazeSeed` / `parseI9kNinoMazeSeed` |
| `stories/I9kNinoMaze.stories.ts`, `showcase/registry/I9kNinoMaze.ts`            | Workshop and showcase                                                                  |
| `tests/ninoMaze.test.ts`, `tests/chiptune.test.ts`, `tests/I9kNinoMaze.test.ts` | Tests                                                                                  |

## 3. Rules (unchanged from 9k.school)

- Tiles are wall or floor. Nino has a start tile; home is one floor tile.
- A turn is one step. Walking into a wall is `blocked`: no move is counted and the bugs do not
  step.
- If the step reaches home, the game is `won` and the bugs do not step.
- Otherwise every bug patrols: it walks straight until a wall, then turns around (or waits if
  walled in on both sides).
- Nino is caught if a bug stood on his target tile before stepping (they swapped) or stands on it
  after. Being caught resets Nino and the bugs to their starts, keeps the move count, and counts an
  attempt. It is a setback, not an ending.
- A won game ignores input.

Bug positions depend only on the number of turns taken since the last reset, never on Nino. The
solvability check relies on this.

## 4. Generation

`generateNinoMaze(seed: number | string, difficulty = 'normal'): NinoMaze`

1. **Seed.** A string is hashed with FNV-1a to a 32-bit unsigned integer; a number is truncated to
   one. The PRNG is mulberry32.
2. **Dimensions.** Cells form a grid inside an odd tile grid with a wall border:

   | difficulty | tiles | cells | bugs |
   | ---------- | ----- | ----- | ---- |
   | easy       | 11×9  | 5×4   | 1    |
   | normal     | 15×11 | 7×5   | 2    |
   | hard       | 21×13 | 10×6  | 3    |

3. **Carve** a perfect maze with an iterative depth-first backtracker from a random corner cell,
   which becomes Nino's start.
4. **Braid.** Visit dead-end cells in shuffled order and, with probability ⅓, knock out one wall
   to a neighbouring cell, so the maze has loops and a bug can be avoided by another route.
5. **Home** is the floor tile farthest from the start by breadth-first distance, ties broken by
   scan order.
6. **Bugs.** Collect straight horizontal and vertical runs of floor tiles at least 3 long; a bug
   patrols exactly one run. Discard runs that pass through the start, and tiles on home or within
   Manhattan distance 3 of the start. Pick runs without replacement (no two
   bugs on one run) and a random tile and heading along each.
7. **Check.** Breadth-first search over `(tile, turn)`: the set of tiles Nino can occupy after `t`
   turns without being caught, where bug positions at turn `t` are simulated from the start.
   Waiting is not a move, so the frontier at `t+1` is only the neighbours of the frontier at `t`.
   The maze is winnable if home is reached within `4 × floorTiles` turns.
8. **Retry.** If the check fails, regenerate from `hash(seed, attempt)` up to 20 attempts; a maze
   still failing then is returned with no bugs (always winnable). The result is still a pure
   function of the input seed.

The returned `NinoMaze` carries `seed` (the normalized number), `difficulty`, `width`, `height`,
`rows` (strings using `#` and `.`), `start`, `home` and `bugs` (start position and heading).

`formatI9kNinoMazeSeed(seed)` renders a seed as an uppercase base-36 code (`4KQ2X`), and
`parseI9kNinoMazeSeed(code)` reverses it (returning `null` for anything that is not a code), so a
code typed back in reproduces the maze. A string passed as `seed` is always hashed, never parsed;
a consumer reading a code from a URL parses it first. The generator itself stays internal.

## 5. Component API

```ts
props: {
  seed?: number | string;           // v-model:seed. Omitted: a random seed chosen on the client.
  difficulty?: 'easy' | 'normal' | 'hard'; // default 'normal'
  muted?: boolean;                  // v-model:muted, default false
  labels?: Partial<I9kNinoMazeLabels>;
}
emits: {
  'update:seed': [seed: number];
  'update:muted': [muted: boolean];
  won: [result: { seed: number; moves: number; caught: number }];
  caught: [result: { seed: number; moves: number; caught: number }];
}
```

Seed and muted are controlled-or-uncontrolled: the component keeps an internal copy, syncs it from
the prop when the prop changes, and emits the update. Changing `seed` or `difficulty` starts a fresh
game on the new maze.

`I9kNinoMazeLabels` has plain strings for `board` (the board group's accessible name, which carries
the instructions), `mazeDescription` (the SVG's title), `ninoName`, `newMaze`, `playAgain`, `mute`
(a toggle button's constant name; its state is `aria-pressed`), `up`, `down`, `left`, `right`,
`start`, `blocked`, `loading`, and functions for the counted messages:
`moved({ moves })`, `caught({ caught })`, `won({ moves })`, `mazeCode({ code })`,
`moveCount({ moves })`. Partial labels are merged over the English defaults.

## 6. Rendering

- **Header:** the maze code (`Maze #4KQ2X`) and the move count on the inline-start side; a
  **New maze** icon button (dice) and a mute toggle (`aria-pressed`) on the inline-end side.
- **Board:** a focusable `role="group"` named by `labels.board`, wrapping an SVG `role="img"` with a
  `<title>`. Tiles are 16 units. Walls are rounded pixel blocks in the primary color on the sunken
  surface; floor is the surface with a faint dot; home is a green house; bugs are the original
  pixel bug in the error color; Nino is `I9kNino size="auto"`, whose expression follows the last
  event (happy on a win, surprised when caught, worried when blocked). Nino and the bugs move with a
  stepped transform transition, switched off for reduced motion. On a win Nino plays `jump`.
- **Controls:** a d-pad of icon buttons laid out `direction: ltr` on every page, because it is
  spatial, as are the arrow keys and WASD. Disabled after a win.
- **Status:** a polite live region with the message for the last event.
- **Win:** **Play again** (same seed) and **New maze** buttons appear under the status.
- **Server render without a seed:** the board renders at the correct aspect ratio for the
  difficulty with no tiles and `aria-busy="true"`, the status reads `labels.loading`, and the
  client picks a random seed in `onMounted`. With a seed, the server renders the full maze.
- All appearance is scoped CSS with component-local custom properties on `.i9k-nino-maze`; dark
  mode adjustments go through `:global(.dark) .i9k-nino-maze`.

## 7. Sound

Same voice as 9k.school: square-wave notes of 50ms at low volume in Nino's note (783.99 Hz).
`moved` is a blip, `blocked` a low bonk, `caught` the chime falling, `won` the chime climbing two
octaves. Audio is created lazily and only after user activation; the first pointer or key press on
the page unlocks it. Muted games never create a context.

## 8. Testing

- `ninoMaze.test.ts`: same seed → same maze; string and number seeds; borders are walls; start and
  home are floor and distinct; bugs on floor and away from the start; dimensions and bug counts per
  difficulty; 300 seeds per difficulty are winnable by an independent BFS; the ported rule tests
  (blocked, won, caught on swap and on landing, reset) on a fixed hand-built maze; seed code round
  trip.
- `chiptune.test.ts`: ported from 9k.school.
- `I9kNinoMaze.test.ts`: renders a seeded maze; arrow keys and WASD move Nino; d-pad buttons move
  him; the status announces; winning emits `won`, disables the d-pad and shows Play again; New maze
  emits `update:seed` with a different seed; mute toggles and emits; labels override; server render
  without a seed is a busy empty board.
- Showcase registry entry, contracts export list, Storybook story.
