import type { I9kNinoAction, I9kNinoExpression } from '../types/components';

/**
 * A rectangle or a path in Nino's 64-unit viewBox. Every coordinate is a
 * multiple of two: the viewBox holds a 32x32 pixel grid, so nothing lands
 * between device pixels when he is drawn at 32px.
 */
export type NinoShape = { x: number; y: number; width: number; height: number } | { d: string };

/**
 * One mood. Expressions change only the eyes, brows, cheeks and mouth; the
 * body never changes, which is what keeps one character recognisable across
 * six moods. Adding an expression is adding a row, never editing the template.
 */
export interface NinoFace {
  eyes: [NinoShape, NinoShape];
  brows?: [NinoShape, NinoShape];
  cheeks?: boolean;
  /** Path data. Every expression owns a mouth; no expression borrows another's. */
  mouth: string;
  /** The open frame while talking. Falls back to NINO_TALK_MOUTH. */
  talkMouth?: string;
}

const box = (x: number, y: number, width: number, height: number): NinoShape => ({
  x,
  y,
  width,
  height,
});

export const NINO_FACES: Record<I9kNinoExpression, NinoFace> = {
  idle: {
    eyes: [box(18, 16, 12, 12), box(34, 16, 12, 12)],
    mouth: 'M18 32H22V34H42V32H46V36H44V38H40V40H24V38H20V36H18Z',
  },
  happy: {
    eyes: [
      { d: 'M20 20H28V22H30V28H26V24H22V28H18V22H20Z' },
      { d: 'M36 20H44V22H46V28H42V24H38V28H34V22H36Z' },
    ],
    cheeks: true,
    mouth: 'M18 32H46V34H44V38H40V40H24V38H20V34H18Z',
  },
  thinking: {
    eyes: [box(18, 22, 12, 4), box(34, 16, 12, 12)],
    brows: [box(18, 18, 10, 2), box(34, 12, 12, 2)],
    mouth: 'M32 34H42V38H32Z',
  },
  worried: {
    eyes: [box(20, 22, 8, 8), box(36, 22, 8, 8)],
    brows: [{ d: 'M18 18H22V16H28V18H22V20H18Z' }, { d: 'M36 16H42V18H46V20H42V18H36Z' }],
    mouth: 'M20 40V36H24V34H40V36H44V40H40V38H24V40Z',
  },
  surprised: {
    eyes: [box(18, 14, 12, 16), box(34, 14, 12, 16)],
    mouth: 'M28 34H36V36H38V40H36V42H28V40H26V36H28Z',
  },
  'eyes-closed': {
    eyes: [{ d: 'M18 22H20V24H28V22H30V26H18Z' }, { d: 'M34 22H36V24H44V22H46V26H34Z' }],
    cheeks: true,
    mouth: 'M22 34H26V36H38V34H42V38H38V40H26V38H22Z',
  },
};

/** The shared open-mouth frame Nino talks with. */
export const NINO_TALK_MOUTH = 'M22 32H42V34H44V38H42V40H22V38H20V34H22Z';

/**
 * A change of mood plays as a beat rather than a cut: the eyes shut and the
 * body hops for `duration` ms, and the new face swaps in at `swapAt`, while the
 * eyes are closed. The CSS keyframes use the same 240ms.
 */
export const NINO_BEAT = { swapAt: 100, duration: 240 } as const;

/**
 * The one place an action's length lives. The component writes it to
 * --i9k-nino-action-duration for the keyframes and uses it for the timer that
 * ends the action, so the two can never drift apart.
 */
export const NINO_ACTION_DURATIONS: Record<I9kNinoAction, number> = {
  wave: 1000,
  jump: 800,
  nod: 900,
  shake: 700,
};
