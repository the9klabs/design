import { describe, expect, it } from 'vitest';

import {
  BOOP_CYCLE,
  SKY_GRID,
  SKY_MAX_STARS,
  boopExpression,
  createSkyStars,
  createSparkles,
  driftAt,
  lookToward,
  planetDots,
  starAlpha,
} from '../src/composables/i9kNinoSky';

describe('createSkyStars', () => {
  it('draws the same sky for the same box and seed', () => {
    expect(createSkyStars(800, 288, 9)).toEqual(createSkyStars(800, 288, 9));
  });

  it('gives about one star per 900 px² and never more than the cap', () => {
    expect(createSkyStars(300, 300)).toHaveLength(100);
    expect(createSkyStars(4000, 400)).toHaveLength(SKY_MAX_STARS);
  });

  it('returns no stars for an empty box', () => {
    expect(createSkyStars(0, 288)).toEqual([]);
    expect(createSkyStars(800, -1)).toEqual([]);
  });

  it('keeps every star inside the box, on the pixel grid', () => {
    for (const star of createSkyStars(801, 290)) {
      expect(star.x % SKY_GRID).toBe(0);
      expect(star.y % SKY_GRID).toBe(0);
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x + SKY_GRID).toBeLessThanOrEqual(801);
      expect(star.y + SKY_GRID).toBeLessThanOrEqual(290);
      expect(star.period).toBeGreaterThanOrEqual(2000);
      expect(star.period).toBeLessThanOrEqual(6000);
    }
  });

  it('makes most stars faint and a few warm or cool', () => {
    const stars = createSkyStars(4000, 400);
    const share = (tone: string) =>
      stars.filter((star) => star.tone === tone).length / stars.length;
    expect(share('faint')).toBeGreaterThan(0.7);
    expect(share('warm')).toBeGreaterThan(0.04);
    expect(share('warm')).toBeLessThan(0.16);
    expect(share('cool')).toBeGreaterThan(0.04);
    expect(share('cool')).toBeLessThan(0.16);
  });
});

describe('starAlpha', () => {
  it('stays visible and never exceeds full opacity', () => {
    const [star] = createSkyStars(300, 300);
    for (let time = 0; time < 12000; time += 250) {
      const alpha = starAlpha(star, time);
      expect(alpha).toBeGreaterThanOrEqual(0.15);
      expect(alpha).toBeLessThanOrEqual(1);
    }
  });
});

describe('planetDots', () => {
  it.each(['crescent', 'ringed'] as const)('draws a %s as dots on the pixel grid', (kind) => {
    const dots = planetDots(kind, 100, 100, 40);
    expect(dots.length).toBeGreaterThan(20);
    for (const dot of dots) {
      expect(dot.x % SKY_GRID).toBe(0);
      expect(dot.y % SKY_GRID).toBe(0);
    }
  });
});

describe('lookToward', () => {
  it('looks ahead when the pointer is close', () => {
    expect(lookToward(5, -5, false)).toBe('center');
  });

  it('follows the dominant axis', () => {
    expect(lookToward(10, -200, false)).toBe('up');
    expect(lookToward(-10, 200, false)).toBe('down');
  });

  it('names the reading direction, so a pointer on the right is end in English and start in Arabic', () => {
    expect(lookToward(200, 10, false)).toBe('end');
    expect(lookToward(-200, 10, false)).toBe('start');
    expect(lookToward(200, 10, true)).toBe('start');
    expect(lookToward(-200, 10, true)).toBe('end');
  });
});

describe('boopExpression', () => {
  it('walks the cycle and starts again', () => {
    expect(BOOP_CYCLE).toEqual(['happy', 'surprised', 'thinking', 'eyes-closed', 'worried']);
    expect(boopExpression(0)).toBe('happy');
    expect(boopExpression(4)).toBe('worried');
    expect(boopExpression(5)).toBe('happy');
  });
});

describe('driftAt', () => {
  it('keeps Nino inside the middle 60% of the width and inside the box', () => {
    for (let time = 0; time < 60000; time += 333) {
      const { x, y, tilt } = driftAt(time, 1000, 288, 72);
      expect(Math.abs(x)).toBeLessThanOrEqual(300);
      expect(Math.abs(y)).toBeLessThanOrEqual((288 - 72) / 2);
      expect(Math.abs(tilt)).toBeLessThanOrEqual(8);
    }
  });

  it('holds still in a box too small to drift in', () => {
    expect(driftAt(1234, 1000, 60, 72).y).toBe(0);
  });
});

describe('createSparkles', () => {
  it('bursts a dozen warm and cool sparkles from one point', () => {
    const sparkles = createSparkles(50, 60, 1);
    expect(sparkles).toHaveLength(12);
    expect(sparkles.every((sparkle) => sparkle.x === 50 && sparkle.y === 60)).toBe(true);
    expect(new Set(sparkles.map((sparkle) => sparkle.tone))).toEqual(new Set(['warm', 'cool']));
  });
});
