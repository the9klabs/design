// The rules of I9kRevealImage, as pure functions, so the unit suite can test them without a
// browser. The component only carries out what these return.
//
// The states, in the order an image normally moves through them:
// - `native`: server-rendered and hydrated, waiting for the first observer report. The <img>
//   keeps its `src` and native `loading="lazy"`, so an image still loads without JavaScript.
// - `waiting`: the first report found it far from the view, so its `src` is taken away.
// - `loading`: near the view (or nothing can tell), with its `src`, until `load` or `error`.
// - `revealing`: it loaded after a real wait, and a canvas of squares clears off it.
// - `shown`: the image alone.
// - `failed`: it did not load; the placeholder shows the mark, standing still.

export type I9kRevealImageState =
  'native' | 'waiting' | 'loading' | 'revealing' | 'shown' | 'failed';

/** An image that took less than this from its request to its `load` just appears. */
export const REVEAL_IF_WAITED_MS = 120;

/** How long the squares take to clear. */
export const REVEAL_DURATION_MS = 520;

/** About a third of a screen above and below the view: "only when in the frame", with a margin. */
export const REVEAL_ROOT_MARGIN = '33% 0px 33% 0px';

/** The squares the placeholder breaks into. */
export const REVEAL_GRID = { columns: 16, rows: 8 } as const;

/**
 * Where an image starts once the component has mounted. A decoded image shows at once; a
 * complete one with no width is broken (the server-rendered <img> always has a `src` at mount).
 * Without an IntersectionObserver nothing can say how near it is, so it loads; otherwise it
 * waits for the first report.
 */
export function stateAtMount(
  image: { complete: boolean; naturalWidth: number },
  hasObserver: boolean,
): I9kRevealImageState {
  if (image.complete) return image.naturalWidth > 0 ? 'shown' : 'failed';
  return hasObserver ? 'native' : 'loading';
}

/**
 * The first report decides whether the image waits. A state the image reached before it (a
 * `load` or an `error` that came first) is left alone.
 */
export function stateOnFirstReport(state: I9kRevealImageState, near: boolean): I9kRevealImageState {
  if (state !== 'native') return state;
  return near ? 'loading' : 'waiting';
}

/** Every later report: a waiting image that comes near loads. Nothing goes back to waiting. */
export function stateOnReport(state: I9kRevealImageState, near: boolean): I9kRevealImageState {
  return state === 'waiting' && near ? 'loading' : state;
}

/** An image reveals only when the visitor waited for it, and never under reduced motion. */
export function stateOnLoad(waitedMs: number, reducedMotion: boolean): 'revealing' | 'shown' {
  return waitedMs >= REVEAL_IF_WAITED_MS && !reducedMotion ? 'revealing' : 'shown';
}

/** The order the cells clear in: a Fisher–Yates shuffle of 0…cells-1. */
export function revealOrder(cells: number, random: () => number): number[] {
  const order = Array.from({ length: cells }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** How many cells have cleared after `elapsedMs` of the reveal. */
export function cellsCleared(elapsedMs: number, cells: number): number {
  return Math.min(cells, Math.floor((cells * elapsedMs) / REVEAL_DURATION_MS));
}
