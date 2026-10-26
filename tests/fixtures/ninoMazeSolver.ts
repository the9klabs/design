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
