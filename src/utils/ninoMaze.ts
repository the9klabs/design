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
