import { describe, expect, it } from 'vitest';

import {
  cellsCleared,
  REVEAL_DURATION_MS,
  REVEAL_GRID,
  REVEAL_IF_WAITED_MS,
  REVEAL_ROOT_MARGIN,
  revealOrder,
  stateAtMount,
  stateOnFirstReport,
  stateOnLoad,
  stateOnReport,
} from '../src/utils/revealImage';

// A small deterministic generator (mulberry32), so a shuffle is the same on every run.
function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('revealImage rules', () => {
  it('names the values the component and its consumers share', () => {
    expect(REVEAL_IF_WAITED_MS).toBe(120);
    expect(REVEAL_DURATION_MS).toBe(520);
    expect(REVEAL_ROOT_MARGIN).toBe('33% 0px 33% 0px');
    expect(REVEAL_GRID).toEqual({ columns: 16, rows: 8 });
  });

  it('shows a decoded image at once and fails a broken one', () => {
    expect(stateAtMount({ complete: true, naturalWidth: 800 }, true)).toBe('shown');
    expect(stateAtMount({ complete: true, naturalWidth: 800 }, false)).toBe('shown');
    expect(stateAtMount({ complete: true, naturalWidth: 0 }, true)).toBe('failed');
    expect(stateAtMount({ complete: false, naturalWidth: 0 }, false)).toBe('loading');
    expect(stateAtMount({ complete: false, naturalWidth: 0 }, true)).toBe('native');
  });

  it('waits only when the first report finds the image far away, and never goes back to waiting', () => {
    expect(stateOnFirstReport('native', false)).toBe('waiting');
    expect(stateOnFirstReport('native', true)).toBe('loading');
    expect(stateOnReport('waiting', true)).toBe('loading');
    expect(stateOnReport('waiting', false)).toBe('waiting');
    expect(stateOnReport('loading', false)).toBe('loading');
    expect(stateOnReport('shown', false)).toBe('shown');
  });

  it('leaves a state the image reached before the first report alone', () => {
    for (const state of ['loading', 'revealing', 'shown', 'failed'] as const) {
      expect(stateOnFirstReport(state, false)).toBe(state);
      expect(stateOnFirstReport(state, true)).toBe(state);
    }
  });

  it('reveals only after a real wait and never under reduced motion', () => {
    expect(stateOnLoad(119, false)).toBe('shown');
    expect(stateOnLoad(120, false)).toBe('revealing');
    expect(stateOnLoad(5000, true)).toBe('shown');
  });

  it('clears every cell once, in a shuffled order, by the end', () => {
    const cells = REVEAL_GRID.columns * REVEAL_GRID.rows;
    const order = revealOrder(cells, seeded(1));

    expect(order).toHaveLength(cells);
    expect([...order].sort((a, b) => a - b)).toEqual([...Array(cells).keys()]);
    expect(order).not.toEqual([...Array(cells).keys()]);
    expect(cellsCleared(0, cells)).toBe(0);
    expect(cellsCleared(REVEAL_DURATION_MS / 2, cells)).toBe(cells / 2);
    expect(cellsCleared(REVEAL_DURATION_MS, cells)).toBe(cells);
    expect(cellsCleared(10_000, cells)).toBe(cells);
  });
});
