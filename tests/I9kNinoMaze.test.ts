import { mount, type VueWrapper } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';

import I9kNinoMaze from '../src/components/I9kNinoMaze.vue';
import {
  formatI9kNinoMazeSeed,
  createNinoMazeState,
  generateNinoMaze,
  isNinoMazeWall,
  moveNino,
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
    expect(wrapper.get('[data-maze-board] > svg').attributes('viewBox')).toBe(
      `0 0 ${11 * 16} ${9 * 16}`,
    );
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

  it('moves focus to Play again when the winning step came from a d-pad button', async () => {
    const wrapper = mountMaze();
    const path = solveNinoMaze(MAZE)!;
    await play(wrapper, path.slice(0, -1));

    const last = wrapper.get(`[data-direction="${path[path.length - 1]}"]`);
    (last.element as HTMLButtonElement).focus();
    await last.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('won')).toHaveLength(1);
    expect(document.activeElement).toBe(wrapper.get('[data-maze-replay]').element);
  });

  it('reads W A S D by physical key, so they work on an Arabic keyboard layout', async () => {
    const wrapper = mountMaze();
    const codes: Record<NinoMazeDirection, string> = {
      up: 'KeyW',
      down: 'KeyS',
      left: 'KeyA',
      right: 'KeyD',
    };

    const event = press(wrapper, 'ص', { code: codes[OPEN] });
    await wrapper.vm.$nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(ninoTile(wrapper)).toBe(`${target(OPEN).x},${target(OPEN).y}`);
  });

  it('falls back to the default for a label passed as undefined', async () => {
    const wrapper = mountMaze({ labels: { moved: undefined, up: undefined } });

    press(wrapper, KEYS[OPEN]);
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-maze-status]').text()).toBe('Nino moved. 1 move so far.');
    expect(wrapper.get('[data-direction="up"]').attributes('aria-label')).toBe('Move Nino up');
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
    const back = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
    // Bugs never patrol a line through the start, so Nino walks part of the winning path and then
    // paces there. The pure rules pick a seed and a stopping point a patrol walks into, so the
    // component is driven down a line known to be caught.
    const line = (maze: ReturnType<typeof generateNinoMaze>, walk: number) => {
      const path = solveNinoMaze(maze)!.slice(0, walk);
      const last = path[path.length - 1];
      return [
        ...path,
        ...Array.from({ length: 100 }, (_, turn) => (turn % 2 === 0 ? back[last] : last)),
      ];
    };
    const catches = (maze: ReturnType<typeof generateNinoMaze>, keys: NinoMazeDirection[]) => {
      let state = createNinoMazeState(maze);
      for (const direction of keys) {
        state = moveNino(state, direction);
        if (state.lastEvent === 'caught') return true;
      }
      return false;
    };
    let found: { seed: number; keys: NinoMazeDirection[] } | undefined;
    for (let seed = 0; seed < 50 && !found; seed += 1) {
      const maze = generateNinoMaze(seed, 'hard');
      for (let walk = 2; walk < 12 && !found; walk += 1) {
        const keys = line(maze, walk);
        if (catches(maze, keys)) found = { seed, keys };
      }
    }
    expect(found, 'no seed in 0..49 catches a pacing Nino').toBeDefined();

    const wrapper = mountMaze({ seed: found!.seed, difficulty: 'hard' });
    for (const direction of found!.keys) {
      press(wrapper, KEYS[direction]);
      if (wrapper.emitted('caught')) break;
    }
    await wrapper.vm.$nextTick();

    const caught = wrapper.emitted('caught') as [{ seed: number; moves: number; caught: number }][];
    expect(caught[0][0]).toMatchObject({ seed: found!.seed, caught: 1 });
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
    expect(wrapper.get('[data-maze-board] > svg').attributes('viewBox')).toBe(
      `0 0 ${21 * 16} ${13 * 16}`,
    );
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
