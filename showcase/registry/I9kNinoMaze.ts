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
- labels?: any subset of the I9kNinoMazeLabels fields — every visible and announced string, merged over English defaults. Counted messages are functions: moved({ moves }), caught({ caught }), won({ moves }), mazeCode({ code }), moveCount({ moves }).

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
