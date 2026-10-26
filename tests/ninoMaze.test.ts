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
