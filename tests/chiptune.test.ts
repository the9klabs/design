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
