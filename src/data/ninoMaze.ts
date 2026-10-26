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
