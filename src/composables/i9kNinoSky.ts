import type { I9kNinoExpression, I9kNinoLook } from '../types/components';

/** Everything in the sky sits on a 4 CSS px grid: the dotted-pixel look. */
export const SKY_GRID = 4;
export const SKY_MAX_STARS = 400;
/** About one star per this many CSS px² of sky. */
export const SKY_AREA_PER_STAR = 900;

export type SkyTone = 'faint' | 'warm' | 'cool';

export interface SkyStar {
  x: number;
  y: number;
  tone: SkyTone;
  /** One twinkle, in milliseconds. */
  period: number;
  /** Where in its twinkle the star starts, 0..1. */
  phase: number;
}

export interface SkyDot {
  x: number;
  y: number;
}

/** mulberry32: small, fast and seeded, so one box always gets one sky. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSkyStars(width: number, height: number, seed = 9): SkyStar[] {
  const columns = Math.floor(width / SKY_GRID);
  const rows = Math.floor(height / SKY_GRID);
  if (columns < 1 || rows < 1) return [];

  const count = Math.min(SKY_MAX_STARS, Math.floor((width * height) / SKY_AREA_PER_STAR));
  const random = createRandom(seed);
  const stars: SkyStar[] = [];
  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(random() * columns) * SKY_GRID;
    const y = Math.floor(random() * rows) * SKY_GRID;
    const pick = random();
    const tone: SkyTone = pick < 0.1 ? 'warm' : pick < 0.2 ? 'cool' : 'faint';
    stars.push({ x, y, tone, period: 2000 + random() * 4000, phase: random() });
  }
  return stars;
}

export function starAlpha(star: SkyStar, timeMs: number): number {
  const wave = 0.5 + 0.5 * Math.sin(2 * Math.PI * (timeMs / star.period + star.phase));
  return 0.15 + 0.85 * wave;
}

function snap(value: number): number {
  return Math.round(value / SKY_GRID) * SKY_GRID;
}

/**
 * A planet as halftone dots: one small dot per grid cell inside its disc, so it
 * reads as dotted, never solid. The crescent is the disc minus a second disc
 * shifted toward its centre; the ringed planet adds a flat ellipse of dots.
 */
export function planetDots(
  kind: 'crescent' | 'ringed',
  cx: number,
  cy: number,
  radius: number,
): SkyDot[] {
  const dots: SkyDot[] = [];
  const step = SKY_GRID;
  const reach = kind === 'ringed' ? radius * 1.9 : radius;
  for (let y = snap(cy - reach); y <= cy + reach; y += step) {
    for (let x = snap(cx - reach); x <= cx + reach; x += step) {
      const dx = x - cx;
      const dy = y - cy;
      const inDisc = dx * dx + dy * dy <= radius * radius;
      if (kind === 'crescent') {
        const sx = dx - radius * 0.45;
        const sy = dy + radius * 0.15;
        if (inDisc && sx * sx + sy * sy > radius * radius * 0.8) dots.push({ x, y });
      } else {
        const ring = (dx / (radius * 1.9)) ** 2 + (dy / (radius * 0.45)) ** 2;
        const onRing = ring <= 1 && ring >= 0.6 && !(dy < 0 && inDisc);
        if (inDisc || onRing) dots.push({ x, y });
      }
    }
  }
  return dots;
}

/**
 * Which way Nino looks for a pointer offset from his centre. start and end are
 * reading-direction (I9kNino mirrors them on an Arabic page), so a pointer on
 * the physical right is `end` in English and `start` in Arabic.
 */
export function lookToward(dx: number, dy: number, rtl: boolean, deadZone = 24): I9kNinoLook {
  if (Math.hypot(dx, dy) < deadZone) return 'center';
  if (Math.abs(dy) > Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  const right = dx > 0;
  return right !== rtl ? 'end' : 'start';
}

export const BOOP_CYCLE: readonly I9kNinoExpression[] = [
  'happy',
  'surprised',
  'thinking',
  'eyes-closed',
  'worried',
];

export function boopExpression(count: number): I9kNinoExpression {
  return BOOP_CYCLE[count % BOOP_CYCLE.length];
}

/**
 * Nino's offset from the centre of the sky: a slow Lissajous figure inside the
 * middle 60% of the width, a vertical swing that keeps him inside the box, and
 * a small tilt.
 */
export function driftAt(
  timeMs: number,
  width: number,
  height: number,
  ninoSize: number,
): { x: number; y: number; tilt: number } {
  const turn = (period: number) => Math.sin((2 * Math.PI * timeMs) / period);
  const room = Math.max(0, (height - ninoSize) / 2);
  return {
    x: width * 0.3 * turn(23000),
    y: room * 0.7 * turn(9000),
    tilt: 6 * turn(5000),
  };
}

export interface Sparkle {
  x: number;
  y: number;
  /** CSS px per millisecond. */
  vx: number;
  vy: number;
  tone: 'warm' | 'cool';
}

export function createSparkles(cx: number, cy: number, seed: number, count = 12): Sparkle[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count + random() * 0.4;
    const speed = 0.06 + random() * 0.08;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tone: index % 2 === 0 ? 'warm' : 'cool',
    };
  });
}
