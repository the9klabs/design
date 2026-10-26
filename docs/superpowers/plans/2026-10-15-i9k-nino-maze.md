# I9kNinoMaze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `I9kNinoMaze`, 9k.school's 404 maze game rebuilt in this package's design language,
playing a fresh seeded random maze that is always winnable.

**Architecture:** The rules and the generator are one pure module (`src/utils/ninoMaze.ts`), and
the component only renders a state and feeds it input. Generation is carve → braid → home → bugs →
a breadth-first winnability check over `(tile, turn)`, retried from derived seeds. Sound is the
9k.school chiptune synth ported to `src/utils/chiptune.ts`, wired to the component by a composable.

**Tech Stack:** Vue 3.5 SFCs with `<script setup lang="ts">`, scoped CSS, Vitest + Vue Test Utils
(jsdom), Storybook 10, the hand-authored showcase registry.

**Spec:** `docs/superpowers/specs/2026-10-15-i9k-nino-maze-design.md`

## Global Constraints

- Prettier style: two-space indent, single quotes, semicolons, trailing commas, 100-column width.
  Run `npx prettier --write <files>` on every file a task touches before committing.
- Public names carry the `I9k` prefix; package classes use `i9k-nino-maze` BEM names.
- Every visual rule is in `<style scoped>`; no `style` attributes or `:style` bindings (consumers
  run under `style-src 'self'`).
- Difficulty table (tiles / cells / bugs): easy 11×9 / 5×4 / 1, normal 15×11 / 7×5 / 2,
  hard 21×13 / 10×6 / 3.
- Braid chance ⅓, bug start clearance: Manhattan distance > 3 from the start, winnability bound
  `4 × floorTiles` turns, 20 attempts, then the last maze with no bugs.
- Sound: square wave, 50ms notes, volume 0.04, Nino's note 783.99 Hz; silent until user activation;
  muted games never construct an `AudioContext`.
- The d-pad is `direction: ltr` on every page; arrow keys and WASD are literal directions.
- Commit messages are Conventional Commits and end with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A string seed that looks like a maze code** (`seed="4KQ2X"`) is hashed, not parsed, so it does
   not reproduce the maze whose code is `4KQ2X`. A consumer reading `?maze=` must call
   `parseI9kNinoMazeSeed` first. Pinned by a unit test in Task 1 and a showcase gotcha in Task 4.
2. **Shortcut keys** (Ctrl+A, Cmd+D, Alt+arrow) pressed while the board is focused must reach the
   browser untouched. Pinned in Task 3.
3. **New maze must never re-roll the same seed**, even if `Math.random` repeats. Pinned in Task 3
   with a stubbed `Math.random`.
4. **Changing `difficulty` or `seed` mid-game** must start a fresh game on the new maze, not keep
   Nino's old coordinates on a different board. Pinned in Task 3.
5. **Keyboard play continues after Play again / New maze**: focus returns to the board instead of
   being lost on a now-hidden or disabled button. Pinned in Task 3.

---

### Task 1: Maze rules and seeded generator

**Files:**

- Modify: `src/types/components.ts` (append the maze types)
- Create: `src/utils/ninoMaze.ts`
- Create: `tests/fixtures/ninoMazeSolver.ts`
- Test: `tests/ninoMaze.test.ts`

**Interfaces:**

- Produces (from `src/types/components.ts`): `I9kNinoMazeDifficulty`, `I9kNinoMazeResult`,
  `I9kNinoMazeLabels`.
- Produces (from `src/utils/ninoMaze.ts`): types `NinoMazeDirection`, `NinoMazeEvent`,
  `NinoMazePoint`, `NinoMazeBug`, `NinoMaze`, `NinoMazeState`; constants `NINO_MAZE_DIRECTIONS`,
  `NINO_MAZE_SIZES`; functions `ninoMazeTiles(difficulty): { width; height }`,
  `normalizeNinoMazeSeed(seed: number | string): number`,
  `randomNinoMazeSeed(random?: () => number): number`, `formatI9kNinoMazeSeed(seed: number): string`,
  `parseI9kNinoMazeSeed(code: string): number | null`,
  `isNinoMazeWall(maze, x, y): boolean`, `isNinoMazeWinnable(maze): boolean`,
  `generateNinoMaze(seed, difficulty = 'normal'): NinoMaze`,
  `createNinoMazeState(maze): NinoMazeState`, `moveNino(state, direction): NinoMazeState`.
- Produces (from `tests/fixtures/ninoMazeSolver.ts`): `solveNinoMaze(maze): NinoMazeDirection[] | null`.

- [ ] **Step 1: Add the shared types**

Append to `src/types/components.ts`:

```ts
/** How big I9kNinoMaze's maze is and how many bugs patrol it. */
export type I9kNinoMazeDifficulty = 'easy' | 'normal' | 'hard';

/** What I9kNinoMaze's `won` and `caught` events carry. */
export interface I9kNinoMazeResult {
  seed: number;
  moves: number;
  caught: number;
}

/**
 * Every string I9kNinoMaze shows or announces. The counted messages are functions so a consumer
 * can hand them to its own i18n (`moved: ({ moves }) => t('maze.moved', { moves })`).
 */
export interface I9kNinoMazeLabels {
  /** The board's accessible name; it carries the instructions. */
  board: string;
  /** The SVG's title. */
  mazeDescription: string;
  ninoName: string;
  newMaze: string;
  playAgain: string;
  /** A toggle's constant name; whether sound is off is its aria-pressed state. */
  mute: string;
  up: string;
  down: string;
  left: string;
  right: string;
  start: string;
  blocked: string;
  loading: string;
  moved: (count: { moves: number }) => string;
  caught: (count: { caught: number }) => string;
  won: (count: { moves: number }) => string;
  mazeCode: (code: { code: string }) => string;
  moveCount: (count: { moves: number }) => string;
}
```

- [ ] **Step 2: Write the test solver fixture**

Create `tests/fixtures/ninoMazeSolver.ts`. It plays the real rules (`moveNino`), so it is an
independent check on the generator's own winnability search:

```ts
import {
  createNinoMazeState,
  moveNino,
  NINO_MAZE_DIRECTIONS,
  type NinoMaze,
  type NinoMazeDirection,
  type NinoMazeState,
} from '../../src/utils/ninoMaze';

function stateKey(state: NinoMazeState) {
  const bugs = state.bugs
    .map((bug) => `${bug.position.x},${bug.position.y},${bug.heading}`)
    .join('|');
  return `${state.nino.x},${state.nino.y}/${bugs}`;
}

/**
 * The shortest winning line, or null when the maze cannot be won. Breadth-first over the states
 * the real rules reach. A blocked step or a catch only leads back to a state already seen, so
 * only plain moves are expanded.
 */
export function solveNinoMaze(maze: NinoMaze): NinoMazeDirection[] | null {
  const start = createNinoMazeState(maze);
  const queue: { state: NinoMazeState; path: NinoMazeDirection[] }[] = [{ state: start, path: [] }];
  const seen = new Set([stateKey(start)]);

  for (let index = 0; index < queue.length; index += 1) {
    const { state, path } = queue[index];
    for (const direction of NINO_MAZE_DIRECTIONS) {
      const next = moveNino(state, direction);
      if (next.status === 'won') return [...path, direction];
      if (next.lastEvent !== 'moved') continue;
      const key = stateKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: next, path: [...path, direction] });
    }
  }
  return null;
}
```

- [ ] **Step 3: Write the failing tests**

Create `tests/ninoMaze.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { I9kNinoMazeDifficulty } from '../src/types/components';
import {
  createNinoMazeState,
  formatI9kNinoMazeSeed,
  generateNinoMaze,
  isNinoMazeWall,
  isNinoMazeWinnable,
  moveNino,
  NINO_MAZE_DIRECTIONS,
  NINO_MAZE_SIZES,
  normalizeNinoMazeSeed,
  parseI9kNinoMazeSeed,
  randomNinoMazeSeed,
  type NinoMaze,
  type NinoMazeDirection,
  type NinoMazePoint,
} from '../src/utils/ninoMaze';
import { solveNinoMaze } from './fixtures/ninoMazeSolver';

const DIFFICULTIES: I9kNinoMazeDifficulty[] = ['easy', 'normal', 'hard'];

// 9k.school's original hand-drawn maze, kept as a fixed board for the rules.
const ORIGINAL: NinoMaze = {
  seed: 0,
  difficulty: 'easy',
  width: 9,
  height: 7,
  rows: ['#########', '#..#....#', '#.#.#.#.#', '#.......#', '#.#.#.#.#', '#.......#', '#########'],
  start: { x: 1, y: 1 },
  home: { x: 7, y: 1 },
  bugs: [
    { position: { x: 2, y: 3 }, heading: 'right' },
    { position: { x: 5, y: 1 }, heading: 'down' },
  ],
};

function corridor(bugs: NinoMaze['bugs']): NinoMaze {
  return {
    seed: 0,
    difficulty: 'easy',
    width: 7,
    height: 3,
    rows: ['#######', '#.....#', '#######'],
    start: { x: 1, y: 1 },
    home: { x: 5, y: 1 },
    bugs,
  };
}

function floorTiles(maze: NinoMaze): NinoMazePoint[] {
  const tiles: NinoMazePoint[] = [];
  maze.rows.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      if (tile === '.') tiles.push({ x, y });
    });
  });
  return tiles;
}

function distances(maze: NinoMaze): Map<string, number> {
  const steps: Record<NinoMazeDirection, NinoMazePoint> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const result = new Map([[`${maze.start.x},${maze.start.y}`, 0]]);
  const queue = [maze.start];
  for (let index = 0; index < queue.length; index += 1) {
    const tile = queue[index];
    for (const direction of NINO_MAZE_DIRECTIONS) {
      const next = { x: tile.x + steps[direction].x, y: tile.y + steps[direction].y };
      const key = `${next.x},${next.y}`;
      if (isNinoMazeWall(maze, next.x, next.y) || result.has(key)) continue;
      result.set(key, (result.get(`${tile.x},${tile.y}`) ?? 0) + 1);
      queue.push(next);
    }
  }
  return result;
}

describe('seeds', () => {
  it('hashes a string seed to the same unsigned 32-bit number every time', () => {
    const seed = normalizeNinoMazeSeed('404');

    expect(seed).toBe(normalizeNinoMazeSeed('404'));
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
    expect(normalizeNinoMazeSeed('405')).not.toBe(seed);
  });

  it('truncates, wraps and defaults number seeds', () => {
    expect(normalizeNinoMazeSeed(42.9)).toBe(42);
    expect(normalizeNinoMazeSeed(-1)).toBe(0xffffffff);
    expect(normalizeNinoMazeSeed(Number.NaN)).toBe(0);
    expect(normalizeNinoMazeSeed(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('round-trips a seed through its maze code', () => {
    for (const seed of [0, 1, 42, 123456789, 0xffffffff]) {
      expect(parseI9kNinoMazeSeed(formatI9kNinoMazeSeed(seed))).toBe(seed);
    }
    expect(formatI9kNinoMazeSeed(0xffffffff)).toBe('1Z141Z3');
    expect(parseI9kNinoMazeSeed(' #1z141z3 ')).toBe(0xffffffff);
  });

  it('rejects anything that is not a maze code', () => {
    expect(parseI9kNinoMazeSeed('')).toBeNull();
    expect(parseI9kNinoMazeSeed('maze-1')).toBeNull();
    expect(parseI9kNinoMazeSeed('1Z141Z4')).toBeNull();
    expect(parseI9kNinoMazeSeed('ABCDEFGH')).toBeNull();
  });

  it('hashes a string seed even when it looks like a maze code', () => {
    const code = formatI9kNinoMazeSeed(1234);

    expect(normalizeNinoMazeSeed(code)).not.toBe(1234);
    expect(generateNinoMaze(parseI9kNinoMazeSeed(code) ?? 0).seed).toBe(1234);
  });

  it('draws random seeds in the unsigned 32-bit range', () => {
    expect(randomNinoMazeSeed(() => 0)).toBe(0);
    expect(randomNinoMazeSeed(() => 0.999999999999)).toBe(0xffffffff);
  });
});

describe('generating a maze', () => {
  it('builds the same maze from the same seed', () => {
    expect(generateNinoMaze(7, 'hard')).toEqual(generateNinoMaze(7, 'hard'));
    expect(generateNinoMaze('nino')).toEqual(generateNinoMaze(normalizeNinoMazeSeed('nino')));
  });

  it('builds different mazes from different seeds', () => {
    const layouts = new Set(
      Array.from({ length: 10 }, (_, seed) => generateNinoMaze(seed).rows.join('')),
    );

    expect(layouts.size).toBeGreaterThan(8);
  });

  it.each(DIFFICULTIES)('sizes a %s maze from the difficulty table', (difficulty) => {
    const size = NINO_MAZE_SIZES[difficulty];
    const maze = generateNinoMaze(1, difficulty);

    expect(maze.difficulty).toBe(difficulty);
    expect(maze.width).toBe(size.columns * 2 + 1);
    expect(maze.height).toBe(size.rows * 2 + 1);
    expect(maze.rows).toHaveLength(maze.height);
    for (const row of maze.rows) expect(row).toMatch(new RegExp(`^[#.]{${maze.width}}$`));
  });

  it.each(DIFFICULTIES)('walls in every %s maze and keeps its pieces apart', (difficulty) => {
    for (let seed = 0; seed < 50; seed += 1) {
      const maze = generateNinoMaze(seed, difficulty);
      for (let x = 0; x < maze.width; x += 1) {
        expect(isNinoMazeWall(maze, x, 0)).toBe(true);
        expect(isNinoMazeWall(maze, x, maze.height - 1)).toBe(true);
      }
      for (let y = 0; y < maze.height; y += 1) {
        expect(isNinoMazeWall(maze, 0, y)).toBe(true);
        expect(isNinoMazeWall(maze, maze.width - 1, y)).toBe(true);
      }

      expect(isNinoMazeWall(maze, maze.start.x, maze.start.y)).toBe(false);
      expect(isNinoMazeWall(maze, maze.home.x, maze.home.y)).toBe(false);
      expect(maze.home).not.toEqual(maze.start);
      expect(maze.bugs.length).toBeLessThanOrEqual(NINO_MAZE_SIZES[difficulty].bugs);

      const bugTiles = new Set(maze.bugs.map((bug) => `${bug.position.x},${bug.position.y}`));
      expect(bugTiles.size).toBe(maze.bugs.length);
      for (const bug of maze.bugs) {
        expect(isNinoMazeWall(maze, bug.position.x, bug.position.y)).toBe(false);
        expect(bug.position).not.toEqual(maze.home);
        const fromStart =
          Math.abs(bug.position.x - maze.start.x) + Math.abs(bug.position.y - maze.start.y);
        expect(fromStart).toBeGreaterThan(3);
      }
    }
  });

  it('puts bugs on the board at every difficulty that asks for them', () => {
    for (const difficulty of DIFFICULTIES) {
      const counts = Array.from(
        { length: 20 },
        (_, seed) => generateNinoMaze(seed, difficulty).bugs.length,
      );
      expect(Math.max(...counts)).toBe(NINO_MAZE_SIZES[difficulty].bugs);
    }
  });

  it('puts home on the floor tile farthest from the start', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const maze = generateNinoMaze(seed);
      const distance = distances(maze);
      const farthest = Math.max(...distance.values());

      expect(distance.size).toBe(floorTiles(maze).length);
      expect(distance.get(`${maze.home.x},${maze.home.y}`)).toBe(farthest);
    }
  });

  it('has loops, so a bug in one corridor can be walked around', () => {
    const maze = generateNinoMaze(3, 'hard');
    const floor = floorTiles(maze).length;
    const edges =
      floorTiles(maze).filter((tile) => !isNinoMazeWall(maze, tile.x + 1, tile.y)).length +
      floorTiles(maze).filter((tile) => !isNinoMazeWall(maze, tile.x, tile.y + 1)).length;

    // A tree has exactly floor - 1 edges; anything more is a loop.
    expect(edges).toBeGreaterThan(floor - 1);
  });

  it.each(DIFFICULTIES)('only builds %s mazes that can be won', (difficulty) => {
    for (let seed = 0; seed < 100; seed += 1) {
      const maze = generateNinoMaze(seed, difficulty);
      expect(isNinoMazeWinnable(maze)).toBe(true);
      expect(solveNinoMaze(maze), `seed ${seed}`).not.toBeNull();
    }
  });
});

describe('the winnability check', () => {
  it('accepts the original 9k.school maze', () => {
    expect(isNinoMazeWinnable(ORIGINAL)).toBe(true);
  });

  it('rejects a corridor a bug patrols end to end', () => {
    expect(isNinoMazeWinnable(corridor([{ position: { x: 3, y: 1 }, heading: 'left' }]))).toBe(
      false,
    );
    expect(solveNinoMaze(corridor([{ position: { x: 3, y: 1 }, heading: 'left' }]))).toBeNull();
  });
});

describe('moving Nino', () => {
  it('starts on the maze start with fresh bugs and no moves', () => {
    const state = createNinoMazeState(ORIGINAL);

    expect(state.nino).toEqual(ORIGINAL.start);
    expect(state.bugs).toEqual(ORIGINAL.bugs);
    expect(state.status).toBe('playing');
    expect(state.moves).toBe(0);
    expect(state.caught).toBe(0);
    expect(state.lastEvent).toBe('start');
  });

  it('refuses to walk into a wall and does not spend a turn', () => {
    const start = createNinoMazeState(ORIGINAL);
    const blocked = moveNino(start, 'up');

    expect(blocked.nino).toEqual(start.nino);
    expect(blocked.moves).toBe(0);
    expect(blocked.lastEvent).toBe('blocked');
    expect(blocked.bugs).toEqual(start.bugs);
  });

  it('spends a turn on a legal step, moves the bugs, and never mutates its input', () => {
    const start = createNinoMazeState(ORIGINAL);
    const moved = moveNino(start, 'down');

    expect(moved.nino).toEqual({ x: 1, y: 2 });
    expect(moved.moves).toBe(1);
    expect(moved.lastEvent).toBe('moved');
    expect(moved.bugs).not.toEqual(start.bugs);
    expect(start.nino).toEqual(ORIGINAL.start);
    expect(start.moves).toBe(0);
  });

  it('lets bugs patrol one axis and turn around at walls', () => {
    let state = createNinoMazeState(ORIGINAL);
    const tracks = state.bugs.map((bug) => [bug.position]);

    for (let turn = 0; turn < 24; turn += 1) {
      state = moveNino(state, turn % 2 === 0 ? 'down' : 'up');
      state.bugs.forEach((bug, index) => tracks[index].push(bug.position));
    }

    for (const track of tracks) {
      const xs = new Set(track.map((point) => point.x));
      const ys = new Set(track.map((point) => point.y));
      expect(xs.size === 1 || ys.size === 1).toBe(true);
      for (const point of track) expect(isNinoMazeWall(ORIGINAL, point.x, point.y)).toBe(false);
    }
  });

  it('is caught when a bug lands on his tile', () => {
    const state = moveNino(
      createNinoMazeState(corridor([{ position: { x: 3, y: 1 }, heading: 'left' }])),
      'right',
    );

    expect(state.lastEvent).toBe('caught');
  });

  it('is caught when he and a bug swap tiles', () => {
    const state = moveNino(
      createNinoMazeState(corridor([{ position: { x: 2, y: 1 }, heading: 'left' }])),
      'right',
    );

    expect(state.lastEvent).toBe('caught');
  });

  it('goes back to the start with fresh bugs when caught, keeping the move count', () => {
    const maze = corridor([{ position: { x: 3, y: 1 }, heading: 'left' }]);
    const caught = moveNino(createNinoMazeState(maze), 'right');

    expect(caught.nino).toEqual(maze.start);
    expect(caught.bugs).toEqual(maze.bugs);
    expect(caught.moves).toBe(1);
    expect(caught.caught).toBe(1);
    expect(caught.status).toBe('playing');
  });

  it('wins on reaching home and then ignores input', () => {
    const path = solveNinoMaze(ORIGINAL);
    expect(path).not.toBeNull();

    const won = (path ?? []).reduce(
      (state, direction) => moveNino(state, direction),
      createNinoMazeState(ORIGINAL),
    );

    expect(won.status).toBe('won');
    expect(won.lastEvent).toBe('won');
    expect(won.nino).toEqual(ORIGINAL.home);
    expect(won.moves).toBe(path?.length);
    expect(moveNino(won, 'left')).toBe(won);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run tests/ninoMaze.test.ts`
Expected: FAIL — `Failed to resolve import "../src/utils/ninoMaze"`.

- [ ] **Step 5: Write the module**

Create `src/utils/ninoMaze.ts`:

```ts
/**
 * Nino's maze, rules and generator.
 *
 * Everything here is pure and deterministic: no clock, no DOM, and the only randomness is a PRNG
 * seeded from the maze's seed. The component renders a state and feeds it input, so the same seed
 * and the same key presses always produce the same game, which is what lets the whole game be
 * tested in the unit suite.
 */
import type { I9kNinoMazeDifficulty } from '../types/components';

export type NinoMazeDirection = 'up' | 'down' | 'left' | 'right';
export type NinoMazeEvent = 'start' | 'moved' | 'blocked' | 'caught' | 'won';

export interface NinoMazePoint {
  x: number;
  y: number;
}

export interface NinoMazeBug {
  position: NinoMazePoint;
  heading: NinoMazeDirection;
}

/** One generated maze. `rows` uses `#` for wall and `.` for floor. */
export interface NinoMaze {
  seed: number;
  difficulty: I9kNinoMazeDifficulty;
  width: number;
  height: number;
  rows: readonly string[];
  start: NinoMazePoint;
  home: NinoMazePoint;
  bugs: readonly NinoMazeBug[];
}

export interface NinoMazeState {
  maze: NinoMaze;
  nino: NinoMazePoint;
  bugs: readonly NinoMazeBug[];
  status: 'playing' | 'won';
  /** Turns actually taken. Walking into a wall is not one. */
  moves: number;
  caught: number;
  lastEvent: NinoMazeEvent;
}

export const NINO_MAZE_DIRECTIONS: readonly NinoMazeDirection[] = ['up', 'down', 'left', 'right'];

/** Cells, not tiles: a maze of c×r cells is (2c+1)×(2r+1) tiles, walls between and around. */
export const NINO_MAZE_SIZES: Record<
  I9kNinoMazeDifficulty,
  { columns: number; rows: number; bugs: number }
> = {
  easy: { columns: 5, rows: 4, bugs: 1 },
  normal: { columns: 7, rows: 5, bugs: 2 },
  hard: { columns: 10, rows: 6, bugs: 3 },
};

const STEPS: Record<NinoMazeDirection, NinoMazePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<NinoMazeDirection, NinoMazeDirection> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

// A third of the dead ends get a wall knocked out, so most bugs can be walked around.
const BRAID_CHANCE = 1 / 3;
// A bug starts more than this many steps from Nino, so the first turns are never a trap.
const BUG_START_CLEARANCE = 3;
const MAX_ATTEMPTS = 20;
const MAX_SEED = 0xffffffff;

type Random = () => number;
type Floor = boolean[][];

export function ninoMazeTiles(difficulty: I9kNinoMazeDifficulty) {
  const size = NINO_MAZE_SIZES[difficulty];
  return { width: size.columns * 2 + 1, height: size.rows * 2 + 1 };
}

/** FNV-1a: a short, stable hash for string seeds. */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32: a small 32-bit PRNG, plenty for laying out a maze. */
function mulberry32(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: Random): T {
  return items[Math.floor(random() * items.length)];
}

function shuffle<T>(items: T[], random: Random): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

/** A string is hashed; a number is truncated and wrapped to an unsigned 32-bit integer. */
export function normalizeNinoMazeSeed(seed: number | string): number {
  if (typeof seed === 'string') return hashString(seed);
  return Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : 0;
}

export function randomNinoMazeSeed(random: Random = Math.random): number {
  return Math.min(Math.floor(random() * (MAX_SEED + 1)), MAX_SEED);
}

/** The short code a maze is shown and shared by, e.g. `4KQ2X`. */
export function formatI9kNinoMazeSeed(seed: number): string {
  return (seed >>> 0).toString(36).toUpperCase();
}

/** The seed behind a maze code, or null for anything that is not one. A leading `#` is allowed. */
export function parseI9kNinoMazeSeed(code: string): number | null {
  const text = code.trim().replace(/^#/, '');
  if (!/^[0-9a-z]{1,7}$/i.test(text)) return null;
  const seed = Number.parseInt(text, 36);
  return seed <= MAX_SEED ? seed : null;
}

function step(point: NinoMazePoint, direction: NinoMazeDirection): NinoMazePoint {
  return { x: point.x + STEPS[direction].x, y: point.y + STEPS[direction].y };
}

function samePoint(a: NinoMazePoint, b: NinoMazePoint): boolean {
  return a.x === b.x && a.y === b.y;
}

export function isNinoMazeWall(
  maze: Pick<NinoMaze, 'rows' | 'width' | 'height'>,
  x: number,
  y: number,
): boolean {
  if (y < 0 || y >= maze.height || x < 0 || x >= maze.width) return true;
  return maze.rows[y][x] !== '.';
}

function isFloor(floor: Floor, point: NinoMazePoint): boolean {
  return floor[point.y]?.[point.x] === true;
}

/** Depth-first backtracker from a random corner cell, which becomes Nino's start. */
function carve(columns: number, rows: number, random: Random) {
  const floor: Floor = Array.from({ length: rows * 2 + 1 }, () =>
    Array<boolean>(columns * 2 + 1).fill(false),
  );
  const visited = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false));
  const first = pick(
    [
      { x: 0, y: 0 },
      { x: columns - 1, y: 0 },
      { x: 0, y: rows - 1 },
      { x: columns - 1, y: rows - 1 },
    ],
    random,
  );

  visited[first.y][first.x] = true;
  floor[first.y * 2 + 1][first.x * 2 + 1] = true;
  const stack = [first];

  while (stack.length > 0) {
    const cell = stack[stack.length - 1];
    const options = NINO_MAZE_DIRECTIONS.map((direction) => step(cell, direction)).filter(
      (next) =>
        next.x >= 0 && next.x < columns && next.y >= 0 && next.y < rows && !visited[next.y][next.x],
    );
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const next = pick(options, random);
    visited[next.y][next.x] = true;
    // The wall between two cells sits halfway between their tiles.
    floor[cell.y + next.y + 1][cell.x + next.x + 1] = true;
    floor[next.y * 2 + 1][next.x * 2 + 1] = true;
    stack.push(next);
  }

  return { floor, start: { x: first.x * 2 + 1, y: first.y * 2 + 1 } };
}

function openSides(floor: Floor, point: NinoMazePoint): number {
  return NINO_MAZE_DIRECTIONS.filter((direction) => isFloor(floor, step(point, direction))).length;
}

/** Knock a wall out of some dead ends, turning the perfect maze into one with loops. */
function braid(floor: Floor, random: Random) {
  const height = floor.length;
  const width = floor[0].length;
  const deadEnds: NinoMazePoint[] = [];
  for (let y = 1; y < height; y += 2) {
    for (let x = 1; x < width; x += 2) {
      if (openSides(floor, { x, y }) === 1) deadEnds.push({ x, y });
    }
  }

  for (const cell of shuffle(deadEnds, random)) {
    if (openSides(floor, cell) !== 1 || random() >= BRAID_CHANCE) continue;
    const walls = NINO_MAZE_DIRECTIONS.filter((direction) => {
      const wall = step(cell, direction);
      const beyond = step(wall, direction);
      const inside =
        beyond.x >= 1 && beyond.x <= width - 2 && beyond.y >= 1 && beyond.y <= height - 2;
      return inside && !isFloor(floor, wall);
    });
    if (walls.length === 0) continue;
    const wall = step(cell, pick(walls, random));
    floor[wall.y][wall.x] = true;
  }
}

/** The floor tile farthest from the start; ties go to the first in reading order. */
function farthestTile(floor: Floor, start: NinoMazePoint): NinoMazePoint {
  const distance = floor.map((row) => row.map(() => -1));
  distance[start.y][start.x] = 0;
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const tile = queue[index];
    for (const direction of NINO_MAZE_DIRECTIONS) {
      const next = step(tile, direction);
      if (!isFloor(floor, next) || distance[next.y][next.x] !== -1) continue;
      distance[next.y][next.x] = distance[tile.y][tile.x] + 1;
      queue.push(next);
    }
  }

  let farthest = start;
  distance.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value > distance[farthest.y][farthest.x]) farthest = { x, y };
    }),
  );
  return farthest;
}

interface Run {
  tiles: NinoMazePoint[];
  axis: 'horizontal' | 'vertical';
}

/** Maximal straight stretches of floor at least 3 long: exactly the line a bug patrols. */
function straightRuns(floor: Floor): Run[] {
  const runs: Run[] = [];
  const height = floor.length;
  const width = floor[0].length;
  const collect = (tiles: NinoMazePoint[], axis: Run['axis']) => {
    let current: NinoMazePoint[] = [];
    for (const tile of [...tiles, { x: -1, y: -1 }]) {
      if (isFloor(floor, tile)) {
        current.push(tile);
        continue;
      }
      if (current.length >= 3) runs.push({ tiles: current, axis });
      current = [];
    }
  };

  for (let y = 0; y < height; y += 1) {
    collect(
      Array.from({ length: width }, (_, x) => ({ x, y })),
      'horizontal',
    );
  }
  for (let x = 0; x < width; x += 1) {
    collect(
      Array.from({ length: height }, (_, y) => ({ x, y })),
      'vertical',
    );
  }
  return runs;
}

function placeBugs(
  floor: Floor,
  start: NinoMazePoint,
  home: NinoMazePoint,
  count: number,
  random: Random,
): NinoMazeBug[] {
  const runs = shuffle(
    straightRuns(floor).filter((run) => !run.tiles.some((tile) => samePoint(tile, start))),
    random,
  );
  const bugs: NinoMazeBug[] = [];

  for (const run of runs) {
    if (bugs.length === count) break;
    const tiles = run.tiles.filter(
      (tile) =>
        !samePoint(tile, home) &&
        Math.abs(tile.x - start.x) + Math.abs(tile.y - start.y) > BUG_START_CLEARANCE &&
        !bugs.some((bug) => samePoint(bug.position, tile)),
    );
    if (tiles.length === 0) continue;
    const headings: NinoMazeDirection[] =
      run.axis === 'horizontal' ? ['left', 'right'] : ['up', 'down'];
    bugs.push({ position: pick(tiles, random), heading: pick(headings, random) });
  }
  return bugs;
}

function buildMaze(seed: number, layoutSeed: number, difficulty: I9kNinoMazeDifficulty): NinoMaze {
  const size = NINO_MAZE_SIZES[difficulty];
  const random = mulberry32(layoutSeed);
  const { floor, start } = carve(size.columns, size.rows, random);
  braid(floor, random);
  const home = farthestTile(floor, start);
  const bugs = placeBugs(floor, start, home, size.bugs, random);

  return {
    seed,
    difficulty,
    width: floor[0].length,
    height: floor.length,
    rows: floor.map((row) => row.map((open) => (open ? '.' : '#')).join('')),
    start,
    home,
    bugs,
  };
}

/**
 * A patrolling bug walks straight until a wall, then turns around. Its next step depends only on
 * where it is and which way it faces, never on Nino.
 */
function patrol(maze: NinoMaze, bug: NinoMazeBug): NinoMazeBug {
  const ahead = step(bug.position, bug.heading);
  if (!isNinoMazeWall(maze, ahead.x, ahead.y)) return { position: ahead, heading: bug.heading };

  const heading = OPPOSITE[bug.heading];
  const behind = step(bug.position, heading);
  if (!isNinoMazeWall(maze, behind.x, behind.y)) return { position: behind, heading };

  // Walled in on both sides: face the other way and wait.
  return { position: { ...bug.position }, heading };
}

/** Caught if a bug stood on the target before its step (they swapped) or stands on it after. */
function catches(
  before: readonly NinoMazeBug[],
  after: readonly NinoMazeBug[],
  target: NinoMazePoint,
): boolean {
  return (
    before.some((bug) => samePoint(bug.position, target)) ||
    after.some((bug) => samePoint(bug.position, target))
  );
}

/**
 * Whether Nino can reach home without being caught. Bugs move only with the turn count, so the
 * search is over the tiles Nino can stand on after each turn. He cannot wait (a blocked step is
 * not a turn), and being caught only restarts the same search, so neither needs a state of its own.
 */
export function isNinoMazeWinnable(maze: NinoMaze): boolean {
  const floorTiles = maze.rows.join('').split('.').length - 1;
  let frontier: NinoMazePoint[] = [maze.start];
  let bugs = maze.bugs;

  for (let turn = 0; turn < floorTiles * 4 && frontier.length > 0; turn += 1) {
    const nextBugs = bugs.map((bug) => patrol(maze, bug));
    const seen = new Set<string>();
    const next: NinoMazePoint[] = [];
    for (const tile of frontier) {
      for (const direction of NINO_MAZE_DIRECTIONS) {
        const target = step(tile, direction);
        if (isNinoMazeWall(maze, target.x, target.y)) continue;
        if (samePoint(target, maze.home)) return true;
        const key = `${target.x},${target.y}`;
        if (catches(bugs, nextBugs, target) || seen.has(key)) continue;
        seen.add(key);
        next.push(target);
      }
    }
    frontier = next;
    bugs = nextBugs;
  }
  return false;
}

/**
 * The maze a seed stands for. A layout that cannot be won is redrawn from a seed derived from the
 * original, so the result is still a pure function of `seed`; after MAX_ATTEMPTS the last layout is
 * kept without bugs, which is always winnable.
 */
export function generateNinoMaze(
  seed: number | string,
  difficulty: I9kNinoMazeDifficulty = 'normal',
): NinoMaze {
  const normalized = normalizeNinoMazeSeed(seed);
  let maze = buildMaze(normalized, normalized, difficulty);

  for (let attempt = 1; !isNinoMazeWinnable(maze); attempt += 1) {
    if (attempt === MAX_ATTEMPTS) return { ...maze, bugs: [] };
    maze = buildMaze(normalized, hashString(`${normalized}:${attempt}`), difficulty);
  }
  return maze;
}

export function createNinoMazeState(maze: NinoMaze): NinoMazeState {
  return {
    maze,
    nino: { ...maze.start },
    bugs: maze.bugs.map((bug) => ({ position: { ...bug.position }, heading: bug.heading })),
    status: 'playing',
    moves: 0,
    caught: 0,
    lastEvent: 'start',
  };
}

/**
 * One turn: Nino steps, then — unless he just got home — the bugs step, and then a bug on his tile
 * has caught him. Being caught returns everyone to their starts; it is a setback, not an ending.
 */
export function moveNino(state: NinoMazeState, direction: NinoMazeDirection): NinoMazeState {
  if (state.status === 'won') return state;

  const target = step(state.nino, direction);
  if (isNinoMazeWall(state.maze, target.x, target.y)) return { ...state, lastEvent: 'blocked' };

  const moves = state.moves + 1;
  if (samePoint(target, state.maze.home)) {
    return { ...state, nino: target, moves, status: 'won', lastEvent: 'won' };
  }

  const bugs = state.bugs.map((bug) => patrol(state.maze, bug));
  if (catches(state.bugs, bugs, target)) {
    return {
      ...createNinoMazeState(state.maze),
      moves,
      caught: state.caught + 1,
      lastEvent: 'caught',
    };
  }

  return { ...state, nino: target, bugs, moves, lastEvent: 'moved' };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/ninoMaze.test.ts`
Expected: PASS. The winnability suite should finish in a few seconds; if the `hard` case takes
more than ~10s, lower its seed count to 50 and say so in the commit message.

- [ ] **Step 7: Format, typecheck, commit**

```bash
npx prettier --write src/utils/ninoMaze.ts src/types/components.ts tests/ninoMaze.test.ts tests/fixtures/ninoMazeSolver.ts
npx vue-tsc --noEmit --project tsconfig.test.json
git add src/utils/ninoMaze.ts src/types/components.ts tests/ninoMaze.test.ts tests/fixtures/ninoMazeSolver.ts
git commit -m "feat: add the seeded Nino maze generator and rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Chiptune synth and composable

**Files:**

- Create: `src/utils/chiptune.ts`
- Create: `src/composables/i9kChiptune.ts`
- Test: `tests/chiptune.test.ts`

**Interfaces:**

- Produces: `type Melody = readonly number[]`, `CHIME: Melody`, `NINO_NOTE_HZ = 783.99`,
  `createChiptune(options): { unlock; play(rootHz, melody?); dispose }`,
  `useI9kChiptune(isEnabled?: () => boolean): (rootHz: number, melody?: Melody) => void`.

- [ ] **Step 1: Write the failing tests**

Create `tests/chiptune.test.ts` (ported from 9k.school's `tests/unit/chiptune.test.ts`):

```ts
import { describe, expect, it, vi } from 'vitest';

import { createChiptune } from '../src/utils/chiptune';

function fakeParam() {
  return {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function fakeContext(state: AudioContextState = 'running') {
  const oscillators: {
    frequency: ReturnType<typeof fakeParam>;
    start: ReturnType<typeof vi.fn>;
  }[] = [];
  const context = {
    state,
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => {
      context.state = 'running';
      return Promise.resolve();
    }),
    close: vi.fn(() => Promise.resolve()),
    createGain: () => ({ gain: fakeParam(), connect: vi.fn((target) => target) }),
    createOscillator: () => {
      const oscillator = {
        type: 'sine',
        frequency: fakeParam(),
        connect: vi.fn((target) => target),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(oscillator);
      return oscillator;
    },
  };
  const notes = () =>
    oscillators.map((oscillator) =>
      Math.round(oscillator.frequency.setValueAtTime.mock.calls[0][0] as number),
    );
  return { context, oscillators, notes };
}

function chiptuneOn(
  context: unknown,
  options: { hasBeenActive?: boolean; now?: () => number } = {},
) {
  return createChiptune({
    createContext: () => context as AudioContext,
    hasBeenActive: () => options.hasBeenActive ?? true,
    now: options.now,
  });
}

describe('chiptune', () => {
  it('stays silent, and starts no audio, before the visitor has interacted with the page', () => {
    const createContext = vi.fn();
    const chiptune = createChiptune({ createContext, hasBeenActive: () => false });

    chiptune.play(440);

    expect(createContext).not.toHaveBeenCalled();
  });

  it('plays the chime, an arpeggio climbing from the root, once audio is unlocked', () => {
    const { context, oscillators, notes } = fakeContext('suspended');
    const chiptune = chiptuneOn(context, { hasBeenActive: false });

    chiptune.unlock();
    chiptune.play(440);

    expect(context.resume).toHaveBeenCalled();
    expect(notes()).toEqual([440, 554, 659, 880]);
    expect(oscillators.every((oscillator) => oscillator.start.mock.calls.length === 1)).toBe(true);
  });

  it('plays any melody it is given, one note per step', () => {
    const { context, notes } = fakeContext();

    chiptuneOn(context).play(440, [12, 0]);

    expect(notes()).toEqual([880, 440]);
  });

  it('waits for the resume its own gesture started instead of dropping the sound', async () => {
    const { context, notes } = fakeContext('suspended');

    chiptuneOn(context).play(440, [0]);
    expect(notes()).toEqual([]);

    await Promise.resolve();
    expect(notes()).toEqual([440]);
  });

  it('drops a sound whose resume the browser grants much later', async () => {
    const { context, notes } = fakeContext('suspended');
    let clock = 0;
    let grant = () => {};
    context.resume.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          grant = () => {
            context.state = 'running';
            resolve();
          };
        }),
    );

    chiptuneOn(context, { now: () => clock }).play(440, [0]);
    clock = 5000;
    grant();
    await Promise.resolve();
    await Promise.resolve();

    expect(notes()).toEqual([]);
  });

  it('stays silent while the browser keeps audio suspended', async () => {
    const { context, notes } = fakeContext('suspended');
    context.resume.mockImplementation(() => Promise.reject(new Error('not allowed')));

    chiptuneOn(context).play(392);
    await Promise.resolve();

    expect(notes()).toEqual([]);
  });

  it('closes its audio when the page goes away', () => {
    const { context } = fakeContext();
    const chiptune = chiptuneOn(context);

    chiptune.unlock();
    chiptune.dispose();

    expect(context.close).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/chiptune.test.ts`
Expected: FAIL — `Failed to resolve import "../src/utils/chiptune"`.

- [ ] **Step 3: Write the synth**

Create `src/utils/chiptune.ts` (9k.school's `app/utils/chiptune.ts`, unchanged in behavior):

```ts
/**
 * 8-bit sound effects, synthesised with Web Audio so there is no sound file to ship.
 *
 * Browsers keep audio off until the visitor has interacted with the page, and a hover is not an
 * interaction: until the first click, tap or key press nothing plays, and `unlock` is what that
 * first gesture calls.
 */

/** A melody is a list of semitone steps from a root note, one short note each. */
export type Melody = readonly number[];

/** The chime: a major arpeggio that climbs an octave. */
export const CHIME: Melody = [0, 4, 7, 12];

/** Nino's note, which he chimes in on ismail9k.com's About page and plays his maze in. */
export const NINO_NOTE_HZ = 783.99;

const NOTE_SECONDS = 0.05;
const VOLUME = 0.04;
// A resume the browser grants long after it was asked for, on some later gesture, must not replay
// every sound requested in the meantime at once.
const STALE_RESUME_MS = 250;

export interface Chiptune {
  unlock: () => void;
  play: (rootHz: number, melody?: Melody) => void;
  dispose: () => void;
}

export interface ChiptuneOptions {
  createContext: () => AudioContext | undefined;
  /** Whether the visitor has already interacted with the page. */
  hasBeenActive: () => boolean;
  now?: () => number;
}

export function createChiptune({
  createContext,
  hasBeenActive,
  now = Date.now,
}: ChiptuneOptions): Chiptune {
  let context: AudioContext | undefined;

  function ensureContext() {
    context ??= createContext();
    return context;
  }

  function schedule(audio: AudioContext, rootHz: number, melody: Melody) {
    const start = audio.currentTime;
    melody.forEach((semitones, index) => {
      const noteStart = start + index * NOTE_SECONDS;
      const noteEnd = noteStart + NOTE_SECONDS;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(rootHz * 2 ** (semitones / 12), noteStart);
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(VOLUME, noteStart + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd);
    });
  }

  function unlock() {
    const audio = ensureContext();
    if (audio?.state === 'suspended') {
      // Browsers that still refuse leave the promise pending or rejected.
      audio.resume().catch(() => {});
    }
  }

  function play(rootHz: number, melody: Melody = CHIME) {
    // Starting a context before any interaction only earns a console warning.
    if (!context && !hasBeenActive()) return;

    const audio = ensureContext();
    if (!audio) return;

    if (audio.state === 'running') {
      schedule(audio, rootHz, melody);
      return;
    }

    // The gesture that unlocks audio is often the one that asked for this sound, and resuming
    // takes a moment, so wait for it rather than drop the very first sound.
    const requestedAt = now();
    audio
      .resume()
      .then(() => {
        if (now() - requestedAt <= STALE_RESUME_MS) schedule(audio, rootHz, melody);
      })
      .catch(() => {});
  }

  function dispose() {
    context?.close().catch(() => {});
    context = undefined;
  }

  return { unlock, play, dispose };
}
```

- [ ] **Step 4: Write the composable**

Create `src/composables/i9kChiptune.ts`:

```ts
import { onBeforeUnmount, onMounted } from 'vue';

import { createChiptune, type Melody } from '../utils/chiptune';

type ActivationNavigator = Navigator & { userActivation?: { hasBeenActive: boolean } };

/**
 * Chiptune sound effects for one component: the first click, tap or key press anywhere on the
 * page unlocks audio, and unmounting closes it. The unlock listens in the capture phase, so a key
 * press that also asks for a sound has started audio before its own handler runs.
 *
 * While `isEnabled` returns false nothing is played and no AudioContext is ever created, so a
 * muted component costs the page nothing.
 */
export function useI9kChiptune(isEnabled: () => boolean = () => true) {
  const chiptune = createChiptune({
    createContext: () => {
      const AudioContextClass =
        globalThis.AudioContext ??
        (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      return AudioContextClass ? new AudioContextClass() : undefined;
    },
    hasBeenActive: () =>
      (globalThis.navigator as ActivationNavigator | undefined)?.userActivation?.hasBeenActive ===
      true,
  });

  function unlock() {
    if (isEnabled()) chiptune.unlock();
  }

  onMounted(() => {
    window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
    window.addEventListener('keydown', unlock, { capture: true });
  });

  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', unlock, { capture: true });
    window.removeEventListener('keydown', unlock, { capture: true });
    chiptune.dispose();
  });

  return (rootHz: number, melody?: Melody) => {
    if (isEnabled()) chiptune.play(rootHz, melody);
  };
}
```

(The composable's behavior — muted means no context, unmuted plays on a key press — is tested
through the component in Task 3.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/chiptune.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Format, typecheck, commit**

```bash
npx prettier --write src/utils/chiptune.ts src/composables/i9kChiptune.ts tests/chiptune.test.ts
npx vue-tsc --noEmit --project tsconfig.test.json
git add src/utils/chiptune.ts src/composables/i9kChiptune.ts tests/chiptune.test.ts
git commit -m "feat: add the chiptune sound effects from 9k.school

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The I9kNinoMaze component

**Files:**

- Modify: `src/icons/paths.json` (add five icons), `src/types/icons.ts` (add their names)
- Create: `src/data/ninoMaze.ts` (default labels and sounds)
- Create: `src/components/I9kNinoMaze.vue`
- Modify: `tests/I9kScopedStyles.test.ts` (add the component to the list)
- Test: `tests/I9kNinoMaze.test.ts`

**Interfaces:**

- Consumes: everything Task 1 and Task 2 produce; `I9kNino` (`size="auto"`, exposes
  `play(action)`), `I9kIconButton` (`icon`, `label`, `variant`, `size`; forwards other attrs such as
  `disabled`, `aria-pressed`, `data-*`), `I9kButton` (`variant: 'default' | 'primary' | …`, `size`).
- Produces: `I9kNinoMaze` with props `seed?: number | string | null`, `difficulty?`, `muted?`,
  `labels?: Partial<I9kNinoMazeLabels>`; emits `update:seed`, `update:muted`, `won`, `caught`.
  Test hooks: `data-maze-board`, `data-maze-code`, `data-maze-moves`, `data-maze-new`,
  `data-maze-mute`, `data-maze-status`, `data-maze-replay`, `data-maze-next`, `data-direction`,
  `data-nino-tile`, `data-maze-wall`, `data-maze-bug`.

- [ ] **Step 1: Add the icons**

In `src/icons/paths.json`, add after `"arrowDown"` (Material Icons paths, the set the existing
arrows come from):

```json
  "arrowLeft": "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  "arrowRight": "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
  "dice": "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z",
  "volumeOn": "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
  "volumeOff": "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
```

and in `src/types/icons.ts` add `'arrowLeft', 'arrowRight', 'dice', 'volumeOn', 'volumeOff',`
right after `'arrowDown',` in `I9K_ICON_NAMES`. Run `npx vitest run tests/I9kIcon.test.ts
tests/I9kIconTypes.test.ts` — Expected: PASS (update any pinned icon count there if one fails).

- [ ] **Step 2: Add the default labels and sounds**

Create `src/data/ninoMaze.ts`:

```ts
import type { I9kNinoMazeLabels } from '../types/components';
import { CHIME, NINO_NOTE_HZ, type Melody } from '../utils/chiptune';
import type { NinoMazeEvent } from '../utils/ninoMaze';

function count(value: number, one: string, many: string) {
  return `${value} ${value === 1 ? one : many}`;
}

/** English defaults; a consumer's `labels` prop is merged over these. */
export const NINO_MAZE_LABELS: I9kNinoMazeLabels = {
  board:
    "Nino's maze. Walk Nino to his house without touching a bug. Use the arrow keys, W A S D, or the buttons below.",
  mazeDescription: 'A pixel maze. Nino, his house, and bugs patrolling the corridors.',
  ninoName: 'Nino',
  newMaze: 'New maze',
  playAgain: 'Play again',
  mute: 'Mute sound',
  up: 'Move Nino up',
  down: 'Move Nino down',
  left: 'Move Nino left',
  right: 'Move Nino right',
  start: 'Nino is waiting at the start.',
  blocked: 'A wall. Nino is not walking through that one.',
  loading: 'Building a maze…',
  moved: ({ moves }) => `Nino moved. ${count(moves, 'move', 'moves')} so far.`,
  caught: ({ caught }) =>
    `A bug caught Nino. Back to the start, caught ${count(caught, 'time', 'times')}.`,
  won: ({ moves }) => `Nino made it home in ${count(moves, 'move', 'moves')}.`,
  mazeCode: ({ code }) => `Maze #${code}`,
  moveCount: ({ moves }) => count(moves, 'move', 'moves'),
};

/**
 * The maze plays in Nino's note: a blip per step, a low bonk off a wall, the chime falling when a
 * bug catches him, and climbing two octaves when he gets home.
 */
export const NINO_MAZE_SOUNDS: Partial<Record<NinoMazeEvent, { rootHz: number; melody: Melody }>> =
  {
    moved: { rootHz: NINO_NOTE_HZ, melody: [0] },
    blocked: { rootHz: NINO_NOTE_HZ / 4, melody: [0, -1] },
    caught: { rootHz: NINO_NOTE_HZ, melody: [...CHIME].reverse() },
    won: { rootHz: NINO_NOTE_HZ / 2, melody: [...CHIME, 16, 19, 24] },
  };
```

- [ ] **Step 3: Write the failing component tests**

Create `tests/I9kNinoMaze.test.ts`:

```ts
import { mount, type VueWrapper } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import I9kNinoMaze from '../src/components/I9kNinoMaze.vue';
import {
  formatI9kNinoMazeSeed,
  generateNinoMaze,
  isNinoMazeWall,
  NINO_MAZE_DIRECTIONS,
  normalizeNinoMazeSeed,
  type NinoMazeDirection,
} from '../src/utils/ninoMaze';
import { solveNinoMaze } from './fixtures/ninoMazeSolver';

const SEED = 'nino';
const MAZE = generateNinoMaze(SEED, 'easy');
const KEYS: Record<NinoMazeDirection, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};
const STEPS: Record<NinoMazeDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function target(direction: NinoMazeDirection) {
  return { x: MAZE.start.x + STEPS[direction].x, y: MAZE.start.y + STEPS[direction].y };
}

const OPEN = NINO_MAZE_DIRECTIONS.find((d) => !isNinoMazeWall(MAZE, target(d).x, target(d).y))!;
const SHUT = NINO_MAZE_DIRECTIONS.find((d) => isNinoMazeWall(MAZE, target(d).x, target(d).y))!;

let wrappers: VueWrapper[] = [];

function mountMaze(props: Record<string, unknown> = {}) {
  const wrapper = mount(I9kNinoMaze, {
    props: { seed: SEED, difficulty: 'easy', ...props },
    attachTo: document.body,
  });
  wrappers.push(wrapper);
  return wrapper;
}

function ninoTile(wrapper: VueWrapper) {
  return wrapper.get('[data-nino-tile]').attributes('data-nino-tile');
}

function press(wrapper: VueWrapper, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  wrapper.get('[data-maze-board]').element.dispatchEvent(event);
  return event;
}

async function play(wrapper: VueWrapper, path: NinoMazeDirection[]) {
  for (const direction of path) press(wrapper, KEYS[direction]);
  await wrapper.vm.$nextTick();
}

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount());
  wrappers = [];
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('I9kNinoMaze', () => {
  it('renders the seeded maze with Nino on its start and its code in the bar', () => {
    const wrapper = mountMaze();

    expect(ninoTile(wrapper)).toBe(`${MAZE.start.x},${MAZE.start.y}`);
    expect(wrapper.findAll('[data-maze-wall]')).toHaveLength(
      MAZE.rows.join('').split('#').length - 1,
    );
    expect(wrapper.findAll('[data-maze-bug]')).toHaveLength(MAZE.bugs.length);
    expect(wrapper.get('[data-maze-code]').text()).toBe(
      `Maze #${formatI9kNinoMazeSeed(MAZE.seed)}`,
    );
    expect(wrapper.get('svg').attributes('viewBox')).toBe(`0 0 ${11 * 16} ${9 * 16}`);
    expect(wrapper.get('[data-maze-status]').text()).toBe('Nino is waiting at the start.');
  });

  it('names the board with its instructions and keeps it focusable', () => {
    const board = mountMaze().get('[data-maze-board]');

    expect(board.attributes('role')).toBe('group');
    expect(board.attributes('tabindex')).toBe('0');
    expect(board.attributes('aria-label')).toContain('arrow keys');
  });

  it('walks Nino with the arrow keys and WASD, and announces the move', async () => {
    const wrapper = mountMaze();
    const wasd: Record<NinoMazeDirection, string> = { up: 'w', down: 's', left: 'a', right: 'd' };

    const event = press(wrapper, KEYS[OPEN]);
    await wrapper.vm.$nextTick();
    expect(event.defaultPrevented).toBe(true);
    expect(ninoTile(wrapper)).toBe(`${target(OPEN).x},${target(OPEN).y}`);
    expect(wrapper.get('[data-maze-status]').text()).toBe('Nino moved. 1 move so far.');
    expect(wrapper.get('[data-maze-moves]').text()).toBe('1 move');

    const back = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
    press(wrapper, wasd[back[OPEN]].toUpperCase());
    await wrapper.vm.$nextTick();
    expect(ninoTile(wrapper)).toBe(`${MAZE.start.x},${MAZE.start.y}`);
  });

  it('says so when Nino walks into a wall, without spending a move', async () => {
    const wrapper = mountMaze();

    press(wrapper, KEYS[SHUT]);
    await wrapper.vm.$nextTick();

    expect(ninoTile(wrapper)).toBe(`${MAZE.start.x},${MAZE.start.y}`);
    expect(wrapper.get('[data-maze-status]').text()).toContain('A wall');
    expect(wrapper.get('[data-maze-moves]').text()).toBe('0 moves');
  });

  it('leaves shortcut keys and other keys to the browser', async () => {
    const wrapper = mountMaze();

    for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const event = press(wrapper, KEYS[OPEN], init);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(press(wrapper, 'Tab').defaultPrevented).toBe(false);
    await wrapper.vm.$nextTick();
    expect(ninoTile(wrapper)).toBe(`${MAZE.start.x},${MAZE.start.y}`);
  });

  it('walks Nino with the d-pad, laid out left to right on every page', async () => {
    const wrapper = mountMaze();

    await wrapper.get(`[data-direction="${OPEN}"]`).trigger('click');

    expect(ninoTile(wrapper)).toBe(`${target(OPEN).x},${target(OPEN).y}`);
    expect(wrapper.get('[data-direction="up"]').attributes('aria-label')).toBe('Move Nino up');
  });

  it('wins: emits the result, freezes the d-pad and offers another go', async () => {
    const wrapper = mountMaze();
    const path = solveNinoMaze(MAZE)!;

    await play(wrapper, path);

    expect(wrapper.emitted('won')).toEqual([[{ seed: MAZE.seed, moves: path.length, caught: 0 }]]);
    expect(ninoTile(wrapper)).toBe(`${MAZE.home.x},${MAZE.home.y}`);
    expect(wrapper.get('[data-maze-status]').text()).toContain('made it home');
    for (const direction of NINO_MAZE_DIRECTIONS) {
      expect(wrapper.get(`[data-direction="${direction}"]`).attributes('disabled')).toBeDefined();
    }
    expect(wrapper.find('[data-maze-replay]').exists()).toBe(true);
    expect(wrapper.find('[data-maze-next]').exists()).toBe(true);
  });

  it('plays the same maze again and hands the keyboard back to the board', async () => {
    const wrapper = mountMaze();
    await play(wrapper, solveNinoMaze(MAZE)!);

    await wrapper.get('[data-maze-replay]').trigger('click');

    expect(ninoTile(wrapper)).toBe(`${MAZE.start.x},${MAZE.start.y}`);
    expect(wrapper.get('[data-maze-moves]').text()).toBe('0 moves');
    expect(wrapper.find('[data-maze-replay]').exists()).toBe(false);
    expect(document.activeElement).toBe(wrapper.get('[data-maze-board]').element);
    expect(wrapper.emitted('update:seed')).toBeUndefined();
  });

  it('emits caught with the running totals when a bug catches Nino', async () => {
    const maze = generateNinoMaze(1, 'hard');
    const wrapper = mountMaze({ seed: 1, difficulty: 'hard' });
    const open = NINO_MAZE_DIRECTIONS.filter(
      (d) => !isNinoMazeWall(maze, maze.start.x + STEPS[d].x, maze.start.y + STEPS[d].y),
    );

    // Pace back and forth beside the start until a patrol arrives. If none ever does on this
    // seed, the test says so instead of passing vacuously.
    for (let turn = 0; turn < 400 && !wrapper.emitted('caught'); turn += 1) {
      const direction = open[0];
      const back = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
      press(wrapper, KEYS[turn % 2 === 0 ? direction : back[direction]]);
      await wrapper.vm.$nextTick();
    }

    const caught = wrapper.emitted('caught') as [{ seed: number; moves: number; caught: number }][];
    expect(caught, 'no bug reached the start corridor; pick another seed').toBeDefined();
    expect(caught[0][0]).toMatchObject({ seed: 1, caught: 1 });
    expect(wrapper.get('[data-maze-status]').text()).toContain('caught');
  });

  it('rolls a different seed for a new maze and focuses the board', async () => {
    const wrapper = mountMaze();
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(MAZE.seed / 2 ** 32)
      .mockReturnValueOnce(MAZE.seed / 2 ** 32)
      .mockReturnValueOnce(0.5);

    await wrapper.get('[data-maze-new]').trigger('click');

    const [[seed]] = wrapper.emitted('update:seed') as [[number]];
    expect(seed).toBe(2 ** 31);
    expect(wrapper.get('[data-maze-code]').text()).toBe(`Maze #${formatI9kNinoMazeSeed(2 ** 31)}`);
    expect(document.activeElement).toBe(wrapper.get('[data-maze-board]').element);
  });

  it('starts a fresh game when the seed or the difficulty changes', async () => {
    const wrapper = mountMaze();
    press(wrapper, KEYS[OPEN]);
    await wrapper.vm.$nextTick();

    await wrapper.setProps({ difficulty: 'hard' });
    const hard = generateNinoMaze(SEED, 'hard');
    expect(ninoTile(wrapper)).toBe(`${hard.start.x},${hard.start.y}`);
    expect(wrapper.get('svg').attributes('viewBox')).toBe(`0 0 ${21 * 16} ${13 * 16}`);
    expect(wrapper.get('[data-maze-moves]').text()).toBe('0 moves');

    await wrapper.setProps({ seed: 42 });
    const other = generateNinoMaze(42, 'hard');
    expect(ninoTile(wrapper)).toBe(`${other.start.x},${other.start.y}`);
    expect(wrapper.get('[data-maze-code]').text()).toBe('Maze #16');
  });

  it('picks a random seed on the client when none is given', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.25);
    const wrapper = mount(I9kNinoMaze);
    wrappers.push(wrapper);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:seed')).toEqual([[2 ** 30]]);
    expect(wrapper.find('[data-nino-tile]').exists()).toBe(true);
    expect(wrapper.get('[data-maze-board]').attributes('aria-busy')).toBeUndefined();
  });

  it('server-renders an empty, busy board of the right shape when no seed is given', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kNinoMaze, { difficulty: 'normal' }) }),
    );

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`viewBox="0 0 ${15 * 16} ${11 * 16}"`);
    expect(html).not.toContain('data-nino-tile');
    expect(html).toContain('Building a maze');
  });

  it('server-renders the whole maze when a seed is given', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kNinoMaze, { seed: SEED, difficulty: 'easy' }) }),
    );

    expect(html).toContain(`data-nino-tile="${MAZE.start.x},${MAZE.start.y}"`);
    expect(html).not.toContain('aria-busy');
  });

  it('merges partial labels over the English defaults', () => {
    const wrapper = mountMaze({
      labels: { mazeCode: ({ code }: { code: string }) => `متاهة ${code}`, up: 'فوق' },
    });

    expect(wrapper.get('[data-maze-code]').text()).toBe(
      `متاهة ${formatI9kNinoMazeSeed(normalizeNinoMazeSeed(SEED))}`,
    );
    expect(wrapper.get('[data-direction="up"]').attributes('aria-label')).toBe('فوق');
    expect(wrapper.get('[data-direction="down"]').attributes('aria-label')).toBe('Move Nino down');
  });

  describe('sound', () => {
    function stubAudio() {
      const created = { contexts: 0, notes: 0 };
      const param = () => ({
        setValueAtTime() {},
        linearRampToValueAtTime() {},
        exponentialRampToValueAtTime() {},
      });
      class FakeAudioContext {
        state = 'running';
        currentTime = 0;
        destination = {};
        constructor() {
          created.contexts += 1;
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
        createGain() {
          return { gain: param(), connect: (next: unknown) => next };
        }
        createOscillator() {
          created.notes += 1;
          return {
            type: '',
            frequency: param(),
            connect: (next: unknown) => next,
            start() {},
            stop() {},
          };
        }
      }
      vi.stubGlobal('AudioContext', FakeAudioContext);
      return created;
    }

    it('blips on a step once a key press has unlocked audio', async () => {
      const created = stubAudio();
      const wrapper = mountMaze();

      press(wrapper, KEYS[OPEN]);
      await wrapper.vm.$nextTick();

      expect(created.contexts).toBe(1);
      expect(created.notes).toBe(1);
    });

    it('never creates audio while muted, and toggles mute from the bar', async () => {
      const created = stubAudio();
      const wrapper = mountMaze({ muted: true });
      const mute = wrapper.get('[data-maze-mute]');
      expect(mute.attributes('aria-pressed')).toBe('true');
      expect(mute.attributes('aria-label')).toBe('Mute sound');

      press(wrapper, KEYS[OPEN]);
      await wrapper.vm.$nextTick();
      expect(created.contexts).toBe(0);

      await mute.trigger('click');
      expect(wrapper.emitted('update:muted')).toEqual([[false]]);
      expect(mute.attributes('aria-pressed')).toBe('false');
    });
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run tests/I9kNinoMaze.test.ts`
Expected: FAIL — `Failed to resolve import "../src/components/I9kNinoMaze.vue"`.

- [ ] **Step 5: Write the component**

Create `src/components/I9kNinoMaze.vue`:

```vue
<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue';

import { useI9kChiptune } from '../composables/i9kChiptune';
import { NINO_MAZE_LABELS, NINO_MAZE_SOUNDS } from '../data/ninoMaze';
import type {
  I9kNinoExposed,
  I9kNinoExpression,
  I9kNinoMazeDifficulty,
  I9kNinoMazeLabels,
  I9kNinoMazeResult,
} from '../types/components';
import type { I9kIconName } from '../types/icons';
import {
  createNinoMazeState,
  formatI9kNinoMazeSeed,
  generateNinoMaze,
  moveNino,
  NINO_MAZE_DIRECTIONS,
  ninoMazeTiles,
  normalizeNinoMazeSeed,
  randomNinoMazeSeed,
  type NinoMazeDirection,
  type NinoMazePoint,
  type NinoMazeState,
} from '../utils/ninoMaze';
import I9kButton from './I9kButton.vue';
import I9kIconButton from './I9kIconButton.vue';
import I9kNino from './I9kNino.vue';

const props = withDefaults(
  defineProps<{
    /**
     * The maze to play; the same seed always builds the same maze. A string is hashed, so pass a
     * code through parseI9kNinoMazeSeed first. Omitted, the client picks a random one. Use
     * v-model:seed to follow New maze.
     */
    seed?: number | string | null;
    difficulty?: I9kNinoMazeDifficulty;
    /** Sound off. Use v-model:muted to follow the bar's toggle. */
    muted?: boolean;
    /** Merged over the English defaults. */
    labels?: Partial<I9kNinoMazeLabels>;
  }>(),
  { seed: null, difficulty: 'normal', muted: false, labels: () => ({}) },
);

const emit = defineEmits<{
  'update:seed': [seed: number];
  'update:muted': [muted: boolean];
  won: [result: I9kNinoMazeResult];
  caught: [result: I9kNinoMazeResult];
}>();

const TILE = 16;
const ICONS: Record<NinoMazeDirection, I9kIconName> = {
  up: 'arrowUp',
  down: 'arrowDown',
  left: 'arrowLeft',
  right: 'arrowRight',
};
// Arrow keys stay literal in both reading directions: a visitor pressing an arrow means the
// direction it points at, not a logical start or end.
const KEYS: Record<string, NinoMazeDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

const titleId = `${useId()}-maze-title`;
const board = ref<HTMLElement | null>(null);
const ninoRef = ref<I9kNinoExposed | null>(null);

const text = computed<I9kNinoMazeLabels>(() => ({ ...NINO_MAZE_LABELS, ...props.labels }));

// Seed and sound are controlled-or-uncontrolled: an internal copy follows the prop and is what
// the bar's buttons change.
const currentSeed = ref<number | null>(
  props.seed === null ? null : normalizeNinoMazeSeed(props.seed),
);
watch(
  () => props.seed,
  (seed) => {
    if (seed !== null) currentSeed.value = normalizeNinoMazeSeed(seed);
  },
);

const isMuted = ref(props.muted);
watch(
  () => props.muted,
  (muted) => {
    isMuted.value = muted;
  },
);

const maze = computed(() =>
  currentSeed.value === null ? null : generateNinoMaze(currentSeed.value, props.difficulty),
);
const state = ref<NinoMazeState | null>(maze.value ? createNinoMazeState(maze.value) : null);
// A new seed or difficulty is a new maze, and a new maze is a fresh game.
watch(maze, (next) => {
  state.value = next ? createNinoMazeState(next) : null;
});

// Without a seed the server cannot pick one the client would agree with, so the server renders
// an empty board of the right shape and the client fills it in.
onMounted(() => {
  if (currentSeed.value === null) rollSeed();
});

const tiles = computed(() => maze.value ?? ninoMazeTiles(props.difficulty));
const viewBox = computed(() => `0 0 ${tiles.value.width * TILE} ${tiles.value.height * TILE}`);

const layout = computed(() => {
  const walls: NinoMazePoint[] = [];
  const floor: NinoMazePoint[] = [];
  maze.value?.rows.forEach((row, y) => {
    [...row].forEach((tile, x) => (tile === '#' ? walls : floor).push({ x, y }));
  });
  return { walls, floor };
});

const playable = computed(() => state.value?.status === 'playing');
const code = computed(() =>
  currentSeed.value === null ? '' : formatI9kNinoMazeSeed(currentSeed.value),
);

const ninoExpression = computed<I9kNinoExpression>(() => {
  if (!state.value) return 'idle';
  if (state.value.status === 'won') return 'happy';
  if (state.value.lastEvent === 'caught') return 'surprised';
  if (state.value.lastEvent === 'blocked') return 'worried';
  return 'idle';
});

const announcement = computed(() => {
  const labels = text.value;
  const current = state.value;
  if (!current) return labels.loading;
  switch (current.lastEvent) {
    case 'moved':
      return labels.moved({ moves: current.moves });
    case 'blocked':
      return labels.blocked;
    case 'caught':
      return labels.caught({ caught: current.caught });
    case 'won':
      return labels.won({ moves: current.moves });
    default:
      return labels.start;
  }
});

const playSound = useI9kChiptune(() => !isMuted.value);

function step(direction: NinoMazeDirection) {
  if (!state.value) return;
  const next = moveNino(state.value, direction);
  // Once Nino is home the board ignores input, and so does the sound.
  if (next === state.value) return;

  state.value = next;
  const sound = NINO_MAZE_SOUNDS[next.lastEvent];
  if (sound) playSound(sound.rootHz, sound.melody);

  const result = { seed: next.maze.seed, moves: next.moves, caught: next.caught };
  if (next.lastEvent === 'won') {
    emit('won', result);
    void ninoRef.value?.play('jump');
  } else if (next.lastEvent === 'caught') {
    emit('caught', result);
  } else if (next.lastEvent === 'blocked') {
    void ninoRef.value?.play('shake');
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const direction = KEYS[event.key];
  if (!direction) return;
  // Without this the arrow keys scroll the page out from under the board.
  event.preventDefault();
  step(direction);
}

function rollSeed() {
  let next = randomNinoMazeSeed();
  while (next === currentSeed.value) next = randomNinoMazeSeed();
  currentSeed.value = next;
  emit('update:seed', next);
}

// Play again and New maze leave the button that was clicked hidden or pointless, so the keyboard
// goes back to the board.
function newMaze() {
  rollSeed();
  board.value?.focus();
}

function replay() {
  if (maze.value) state.value = createNinoMazeState(maze.value);
  board.value?.focus();
}

function toggleMute() {
  isMuted.value = !isMuted.value;
  emit('update:muted', isMuted.value);
}
</script>

<template>
  <div class="i9k-nino-maze" :class="`i9k-nino-maze--${difficulty}`">
    <div class="i9k-nino-maze__bar">
      <p class="i9k-nino-maze__meta">
        <span v-if="code" class="i9k-nino-maze__code" data-maze-code>
          {{ text.mazeCode({ code }) }}
        </span>
        <span class="i9k-nino-maze__moves" data-maze-moves>
          {{ text.moveCount({ moves: state?.moves ?? 0 }) }}
        </span>
      </p>
      <div class="i9k-nino-maze__actions">
        <I9kIconButton
          icon="dice"
          :label="text.newMaze"
          variant="ghost"
          size="sm"
          :disabled="!state"
          data-maze-new
          @click="newMaze"
        />
        <I9kIconButton
          :icon="isMuted ? 'volumeOff' : 'volumeOn'"
          :label="text.mute"
          :aria-pressed="isMuted ? 'true' : 'false'"
          variant="ghost"
          size="sm"
          data-maze-mute
          @click="toggleMute"
        />
      </div>
    </div>

    <!-- A named group: ARIA allows no name on a role-less div, and this name is how a
         screen-reader user learns to play from the keyboard. -->
    <div
      ref="board"
      class="i9k-nino-maze__board"
      role="group"
      tabindex="0"
      :aria-label="text.board"
      :aria-busy="state ? undefined : 'true'"
      data-maze-board
      @keydown="onKeydown"
    >
      <svg class="i9k-nino-maze__grid" :viewBox="viewBox" role="img" :aria-labelledby="titleId">
        <title :id="titleId">{{ text.mazeDescription }}</title>

        <template v-if="state">
          <rect
            v-for="tile in layout.floor"
            :key="`dot-${tile.x}-${tile.y}`"
            class="i9k-nino-maze__dot"
            :x="tile.x * TILE + 7"
            :y="tile.y * TILE + 7"
            width="2"
            height="2"
          />
          <rect
            v-for="wall in layout.walls"
            :key="`wall-${wall.x}-${wall.y}`"
            class="i9k-nino-maze__wall"
            :x="wall.x * TILE + 1"
            :y="wall.y * TILE + 1"
            :width="TILE - 2"
            :height="TILE - 2"
            rx="3"
            data-maze-wall
          />

          <g
            class="i9k-nino-maze__home"
            :transform="`translate(${state.maze.home.x * TILE} ${state.maze.home.y * TILE})`"
          >
            <rect
              class="i9k-nino-maze__home-tile"
              x="1"
              y="1"
              :width="TILE - 2"
              :height="TILE - 2"
              rx="3"
            />
            <path class="i9k-nino-maze__home-roof" d="M3 8L8 3L13 8V13H9V10H7V13H3V8Z" />
          </g>

          <!-- A software bug, drawn rather than imported: a body, a head and six legs, all on
               the same whole-pixel grid as Nino. -->
          <g
            v-for="(bug, index) in state.bugs"
            :key="`bug-${index}`"
            class="i9k-nino-maze__bug"
            :transform="`translate(${bug.position.x * TILE} ${bug.position.y * TILE})`"
            data-maze-bug
          >
            <rect class="i9k-nino-maze__bug-leg" x="1" y="6" width="14" height="2" />
            <rect class="i9k-nino-maze__bug-leg" x="1" y="9" width="14" height="2" />
            <rect class="i9k-nino-maze__bug-body" x="4" y="4" width="8" height="9" />
            <rect class="i9k-nino-maze__bug-head" x="6" y="2" width="4" height="3" />
            <rect class="i9k-nino-maze__bug-eye" x="5" y="6" width="2" height="2" />
            <rect class="i9k-nino-maze__bug-eye" x="9" y="6" width="2" height="2" />
          </g>

          <g
            class="i9k-nino-maze__nino"
            :data-nino-tile="`${state.nino.x},${state.nino.y}`"
            :transform="`translate(${state.nino.x * TILE} ${state.nino.y * TILE})`"
          >
            <I9kNino
              ref="ninoRef"
              size="auto"
              x="0"
              y="0"
              :width="TILE"
              :height="TILE"
              :expression="ninoExpression"
              :label="text.ninoName"
            />
          </g>
        </template>
      </svg>
    </div>

    <!-- A d-pad is spatial, like the board above it: the button that points left sits on the left
         on an Arabic page too. Same reason the arrow keys stay literal. -->
    <div class="i9k-nino-maze__pad">
      <I9kIconButton
        v-for="direction in NINO_MAZE_DIRECTIONS"
        :key="direction"
        :class="['i9k-nino-maze__key', `i9k-nino-maze__key--${direction}`]"
        :icon="ICONS[direction]"
        :label="text[direction]"
        variant="secondary"
        :disabled="!playable"
        :data-direction="direction"
        @click="step(direction)"
      />
    </div>

    <p class="i9k-nino-maze__status" role="status" aria-live="polite" data-maze-status>
      {{ announcement }}
    </p>

    <div v-if="state?.status === 'won'" class="i9k-nino-maze__win">
      <I9kButton variant="primary" size="sm" data-maze-replay @click="replay">
        {{ text.playAgain }}
      </I9kButton>
      <I9kButton variant="default" size="sm" data-maze-next @click="newMaze">
        {{ text.newMaze }}
      </I9kButton>
    </div>
  </div>
</template>

<style scoped>
.i9k-nino-maze {
  --i9k-nino-maze-floor: var(--surface-sunken-color);
  --i9k-nino-maze-border: var(--border-color);
  --i9k-nino-maze-wall: var(--primary-text-color);
  --i9k-nino-maze-dot: var(--border-color);
  --i9k-nino-maze-home: var(--primary-text-color);
  --i9k-nino-maze-bug: var(--error-color);

  display: grid;
  justify-items: center;
  gap: var(--spacing-8);
  inline-size: min(100%, 36rem);
  margin-inline: auto;
  color: var(--text-color);
}

.i9k-nino-maze--hard {
  inline-size: min(100%, 46rem);
}

.i9k-nino-maze__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
  inline-size: 100%;
}

.i9k-nino-maze__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2) var(--spacing-8);
  margin: 0;
  color: var(--text-color-light);
  font-size: var(--control-font-size-sm);
  font-variant-numeric: tabular-nums;
}

.i9k-nino-maze__code {
  color: var(--text-color);
  font-weight: 600;
  letter-spacing: 0.04em;
  unicode-bidi: isolate;
}

.i9k-nino-maze__actions {
  display: flex;
  gap: var(--spacing-2);
}

.i9k-nino-maze__board {
  box-sizing: border-box;
  inline-size: 100%;
  padding: var(--spacing-4);
  border: 1px solid var(--i9k-nino-maze-border);
  border-radius: var(--radius-md);
  background: var(--i9k-nino-maze-floor);
}

.i9k-nino-maze__board:focus-visible {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

.i9k-nino-maze__grid {
  display: block;
  inline-size: 100%;
  block-size: auto;
  overflow: visible;
}

.i9k-nino-maze__wall {
  fill: var(--i9k-nino-maze-wall);
}

.i9k-nino-maze__dot {
  fill: var(--i9k-nino-maze-dot);
}

.i9k-nino-maze__home-tile {
  fill: color-mix(in srgb, var(--i9k-nino-maze-home) 18%, transparent);
}

.i9k-nino-maze__home-roof {
  fill: var(--i9k-nino-maze-home);
}

.i9k-nino-maze__bug-body,
.i9k-nino-maze__bug-head,
.i9k-nino-maze__bug-leg {
  fill: var(--i9k-nino-maze-bug);
}

.i9k-nino-maze__bug-eye {
  fill: var(--i9k-nino-maze-floor);
}

/* Tile-to-tile movement is a stepped transition, so a step reads as a sprite's step. */
.i9k-nino-maze__nino,
.i9k-nino-maze__bug {
  transition: transform 140ms steps(2, end);
}

.i9k-nino-maze__pad {
  display: grid;
  grid-template-areas:
    '. up .'
    'left down right';
  gap: var(--spacing-4);
  direction: ltr;
}

.i9k-nino-maze__key--up {
  grid-area: up;
}

.i9k-nino-maze__key--down {
  grid-area: down;
}

.i9k-nino-maze__key--left {
  grid-area: left;
}

.i9k-nino-maze__key--right {
  grid-area: right;
}

.i9k-nino-maze__status {
  min-block-size: 1.5em;
  margin: 0;
  color: var(--text-color-light);
  text-align: center;
}

.i9k-nino-maze__win {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-4);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-nino-maze__nino,
  .i9k-nino-maze__bug {
    transition: none;
  }
}
</style>
```

Add `['I9kNinoMaze.vue', 'i9k-nino-maze'],` to `migratedComponents` in
`tests/I9kScopedStyles.test.ts`, after the `I9kChatOptions.vue` row.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/I9kNinoMaze.test.ts tests/I9kScopedStyles.test.ts`
Expected: PASS. If the `caught` test reports "no bug reached the start corridor", change its seed
to the first value in 1..50 whose `hard` maze has a bug run adjacent to the start corridor (check
with a throwaway script), and keep the assertion.

- [ ] **Step 7: Format, lint, typecheck, commit**

```bash
npx prettier --write src/components/I9kNinoMaze.vue src/data/ninoMaze.ts src/icons/paths.json src/types/icons.ts tests/I9kNinoMaze.test.ts tests/I9kScopedStyles.test.ts
npx eslint src/components/I9kNinoMaze.vue src/data/ninoMaze.ts tests/I9kNinoMaze.test.ts
npx vue-tsc --noEmit --project tsconfig.test.json
git add src/components/I9kNinoMaze.vue src/data/ninoMaze.ts src/icons/paths.json src/types/icons.ts tests/I9kNinoMaze.test.ts tests/I9kScopedStyles.test.ts
git commit -m "feat: add I9kNinoMaze, the 404 maze with seeded random mazes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Public exports, showcase entry and story

**Files:**

- Modify: `src/index.ts`
- Modify: `tests/I9kComponentContracts.test.ts`
- Modify: `tests/showcaseRegistry.test.ts:99` (59 → 60)
- Create: `showcase/registry/I9kNinoMaze.ts`
- Modify: `showcase/registry/index.ts`
- Create: `stories/I9kNinoMaze.stories.ts`

**Interfaces:**

- Consumes: `I9kNinoMaze`, the Task 1 types, `formatI9kNinoMazeSeed`, `parseI9kNinoMazeSeed`.
- Produces: the package exports below; `I9kNinoMazeEntry`.

- [ ] **Step 1: Write the failing contract test**

In `tests/I9kComponentContracts.test.ts`, after `ninoExports`, add:

```ts
const ninoMazeExports = [
  `export type {
  I9kNinoMazeDifficulty,
  I9kNinoMazeLabels,
  I9kNinoMazeResult,
} from './types/components';`,
  "export { formatI9kNinoMazeSeed, parseI9kNinoMazeSeed } from './utils/ninoMaze';",
  "export { default as I9kNinoMaze } from './components/I9kNinoMaze.vue';",
] as const;
```

and inside `describe('shared component contracts', …)`, next to the other `it.each` blocks:

```ts
it.each(ninoMazeExports)('exports %s', (statement) => {
  expect(indexSource).toContain(statement);
});
```

Change `expect(exportedNames.length).toBe(59);` to `toBe(60)` in `tests/showcaseRegistry.test.ts`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/I9kComponentContracts.test.ts tests/showcaseRegistry.test.ts`
Expected: FAIL — the three `ninoMazeExports` statements are missing and the export count is 59.

- [ ] **Step 3: Export from the package**

In `src/index.ts`, after the `I9K_NINO_ACTIONS` export line add:

```ts
export type {
  I9kNinoMazeDifficulty,
  I9kNinoMazeLabels,
  I9kNinoMazeResult,
} from './types/components';
export { formatI9kNinoMazeSeed, parseI9kNinoMazeSeed } from './utils/ninoMaze';
```

and after `export { default as I9kNinoSky } …` add:

```ts
export { default as I9kNinoMaze } from './components/I9kNinoMaze.vue';
```

- [ ] **Step 4: Add the showcase entry**

Create `showcase/registry/I9kNinoMaze.ts`:

```ts
import type { ShowcaseEntry } from './types';

export const I9kNinoMazeEntry: ShowcaseEntry = {
  name: 'I9kNinoMaze',
  section: 'content',
  summary:
    'A small game for a 404 page: walk Nino through a pixel maze to his house while bugs patrol the corridors. Every seed builds one maze, the same seed always builds the same maze, and every maze is checked to be winnable. Keyboard, d-pad and screen-reader playable, with optional chiptune sound.',
  agentPrompt: `Use I9kNinoMaze from @9klabs/design for a playful 404 or empty state. It is a turn-based maze: Nino moves one tile per arrow key (or W A S D, or the on-screen d-pad), the bugs patrol back and forth only when he moves, a bug on his tile sends him back to the start, and reaching the house wins. Nothing ever navigates away on its own, so always render your own "Back home" link next to it.

import { I9kNinoMaze, parseI9kNinoMazeSeed, formatI9kNinoMazeSeed } from '@9klabs/design';

Props:
- seed?: number | string | null (default null) — which maze. Omitted, the client picks a random one after mount (the server renders an empty board of the right shape). A string is hashed; to replay a shown code such as 4KQ2X, pass parseI9kNinoMazeSeed('4KQ2X'). Use v-model:seed to follow the New maze button.
- difficulty?: 'easy' | 'normal' | 'hard' (default 'normal') — 11×9 tiles with 1 bug, 15×11 with 2, 21×13 with 3.
- muted?: boolean (default false) — v-model:muted follows the bar's sound toggle. Sound never starts before the visitor interacts with the page, and a muted maze never creates an AudioContext.
- labels?: Partial<I9kNinoMazeLabels> — every visible and announced string; English defaults. Counted messages are functions: moved({ moves }), caught({ caught }), won({ moves }), mazeCode({ code }), moveCount({ moves }).

Emits: update:seed (number), update:muted (boolean), won and caught with { seed, moves, caught }.

Usage:
<I9kNinoMaze v-model:seed="seed" difficulty="normal" :labels="{ newMaze: t('maze.new'), moved: ({ moves }) => t('maze.moved', { moves }) }" />`,
  gotchas: [
    'A string seed is hashed, never parsed: seed="4KQ2X" is not the maze whose code is 4KQ2X. Read a code from a URL with parseI9kNinoMazeSeed, which returns null for anything that is not a code.',
    'Without a seed the first server render is an empty, aria-busy board; the maze appears after hydration. Pass a seed (for example from useState in Nuxt) to server-render the maze itself.',
    'The d-pad and the arrow keys are spatial and stay left-to-right on an Arabic page. Do not mirror them.',
    'Keys are read only while the board has focus, and Ctrl, Cmd and Alt shortcuts are left to the browser.',
    'The game never redirects, not even on a win. Keep your own way home on the page.',
  ],
  demos: [
    { label: 'A fixed maze', code: '<I9kNinoMaze seed="404" difficulty="easy" />' },
    { label: 'A random maze each visit', code: '<I9kNinoMaze />' },
    { label: 'Hard, muted', code: '<I9kNinoMaze seed="9k" difficulty="hard" muted />' },
    {
      label: 'Localized labels',
      code: `<I9kNinoMaze seed="nino" difficulty="easy" :labels="{ newMaze: 'متاهة جديدة', playAgain: 'العب مرة أخرى', mazeCode: ({ code }) => 'متاهة #' + code }" />`,
    },
  ],
};
```

In `showcase/registry/index.ts`, import it after `I9kNinoEntry`
(`import { I9kNinoMazeEntry } from './I9kNinoMaze';`) and add `I9kNinoMazeEntry,` to `entries`
between `I9kNinoEntry,` and `I9kNinoSkyEntry,`.

- [ ] **Step 5: Add the story**

Create `stories/I9kNinoMaze.stories.ts`:

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kNinoMaze from '../src/components/I9kNinoMaze.vue';

const meta = {
  title: 'Components/I9kNinoMaze',
  component: I9kNinoMaze,
  args: { seed: '404', difficulty: 'normal', muted: false },
  argTypes: {
    difficulty: { control: 'select', options: ['easy', 'normal', 'hard'] },
    seed: { control: 'text' },
  },
} satisfies Meta<typeof I9kNinoMaze>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RandomEachVisit: Story = { args: { seed: null } };

export const Easy: Story = { args: { difficulty: 'easy' } };

export const Hard: Story = { args: { difficulty: 'hard', seed: '9k' } };

export const ArabicPage: Story = {
  render: (args) => ({
    components: { I9kNinoMaze },
    setup: () => ({ args }),
    template: `
      <div dir="rtl" lang="ar">
        <I9kNinoMaze
          v-bind="args"
          :labels="{
            newMaze: 'متاهة جديدة',
            playAgain: 'العب مرة أخرى',
            mute: 'كتم الصوت',
            ninoName: 'نينو',
            mazeCode: ({ code }) => 'متاهة #' + code,
            moveCount: ({ moves }) => moves + ' خطوة',
          }"
        />
      </div>
    `,
  }),
};
```

- [ ] **Step 6: Run the affected suites**

Run: `npx vitest run tests/I9kComponentContracts.test.ts tests/showcaseRegistry.test.ts tests/showcaseDemos.test.ts tests/showcaseExtract.test.ts`
Expected: PASS. If the prop extractor rejects the function-typed `labels`, read
`showcase/extract/props.ts` and follow how `I9kToaster`'s object-typed props are documented.

- [ ] **Step 7: Format and commit**

```bash
npx prettier --write src/index.ts tests/I9kComponentContracts.test.ts tests/showcaseRegistry.test.ts showcase/registry/I9kNinoMaze.ts showcase/registry/index.ts stories/I9kNinoMaze.stories.ts
git add src/index.ts tests/I9kComponentContracts.test.ts tests/showcaseRegistry.test.ts showcase/registry/I9kNinoMaze.ts showcase/registry/index.ts stories/I9kNinoMaze.stories.ts
git commit -m "docs: export I9kNinoMaze with a showcase entry and story

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Full pipeline and visual check

**Files:**

- Modify: `AGENTS.md` (one convention bullet)
- Modify: whatever the visual check shows is wrong (scoped CSS in `I9kNinoMaze.vue` only)

- [ ] **Step 1: Document the convention**

In `AGENTS.md`, under "Component conventions worth knowing", add after the `I9kNino` bullet:

```md
- `I9kNinoMaze` is the 404 game. Its rules and generator live in `src/utils/ninoMaze.ts` and are
  pure: a seed (a string is hashed) always builds the same maze, and `generateNinoMaze` only
  returns mazes its `(tile, turn)` search proves winnable, so the unit suite can test the game.
  Sound is `src/utils/chiptune.ts` through `useI9kChiptune`, which never creates an AudioContext
  while muted or before the visitor interacts. Without a seed it server-renders an empty board and
  picks the seed on mount.
```

- [ ] **Step 2: Run the full pipeline**

Run: `npm run check`
Expected: every stage passes (tests, format, lint, typecheck, library build, Storybook build,
showcase build). Fix anything it reports before going on.

- [ ] **Step 3: Look at it in light, dark and RTL**

Start Storybook (`npm run storybook`) and open `Components/I9kNinoMaze`. Check, at desktop and
375px widths:

- Default in light and dark (`html.dark`): walls, house, bugs and Nino all clearly visible on the
  board; the focus ring shows on Tab.
- Play a few moves with the keyboard and the d-pad; walk into a wall (Nino shakes); win
  (Nino jumps, Play again and New maze appear); New maze changes the code.
- `ArabicPage`: the bar mirrors, the d-pad does not.
- Hard: the board fits at 375px without horizontal scroll.

Adjust only the scoped CSS for anything that reads poorly, rerun
`npx vitest run tests/I9kNinoMaze.test.ts`, and commit:

```bash
git add AGENTS.md src/components/I9kNinoMaze.vue
git commit -m "docs: note I9kNinoMaze's conventions in AGENTS.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
