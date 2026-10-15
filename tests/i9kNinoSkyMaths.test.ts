import { describe, expect, it } from 'vitest';

import {
  AIR_DRAG_MS,
  BOOP_CYCLE,
  BOUNCE,
  HOME_DECAY_MS,
  MAX_THROW_SPEED,
  SKY_GRID,
  SKY_MAX_STARS,
  boopExpression,
  clampPoint,
  createSkyStars,
  createSparkles,
  driftAt,
  easeOutCubic,
  homeOffsetAt,
  isSettled,
  lookToward,
  planetDots,
  releaseVelocity,
  starAlpha,
  stepBody,
  type NinoBody,
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

describe('releaseVelocity', () => {
  it('measures the pointer’s speed over the last 80 ms', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 40, x: 20, y: -10 },
      { t: 80, x: 40, y: -20 },
    ];

    expect(releaseVelocity(samples, 80)).toEqual({ vx: 0.5, vy: -0.25 });
  });

  it('ignores movement older than the window', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 100, x: 500, y: 0 },
      { t: 150, x: 510, y: 0 },
      { t: 180, x: 520, y: 0 },
    ];

    expect(releaseVelocity(samples, 180)).toEqual({ vx: 0.25, vy: 0 });
  });

  it('is zero when the pointer stopped before letting go', () => {
    const samples = [
      { t: 0, x: 0, y: 0 },
      { t: 20, x: 50, y: 0 },
      { t: 200, x: 50, y: 0 },
    ];

    expect(releaseVelocity(samples, 200)).toEqual({ vx: 0, vy: 0 });
  });

  it('is zero with fewer than two samples', () => {
    expect(releaseVelocity([], 0)).toEqual({ vx: 0, vy: 0 });
    expect(releaseVelocity([{ t: 5, x: 9, y: 9 }], 5)).toEqual({ vx: 0, vy: 0 });
  });

  it('caps the speed and keeps the direction', () => {
    const { vx, vy } = releaseVelocity(
      [
        { t: 0, x: 0, y: 0 },
        { t: 10, x: 300, y: 400 },
      ],
      10,
    );

    expect(Math.hypot(vx, vy)).toBeCloseTo(MAX_THROW_SPEED);
    expect(vx / vy).toBeCloseTo(0.75);
  });
});

describe('stepBody', () => {
  const room = { width: 1000, height: 600 };

  it('glides and slows down in the air', () => {
    const next = stepBody({ x: 100, y: 100, vx: 1, vy: 0 }, 16, room);

    expect(next.x).toBeGreaterThan(100);
    expect(next.x).toBeLessThan(116);
    expect(next.vx).toBeCloseTo(Math.exp(-16 / AIR_DRAG_MS));
    expect(next.vy).toBe(0);
  });

  it.each([
    { edge: 'left', body: { x: 4, y: 300, vx: -1, vy: 0.2 }, at: { x: 0 }, axis: 'vx', sign: 1 },
    {
      edge: 'right',
      body: { x: 996, y: 300, vx: 1, vy: 0.2 },
      at: { x: 1000 },
      axis: 'vx',
      sign: -1,
    },
    { edge: 'top', body: { x: 500, y: 4, vx: 0.2, vy: -1 }, at: { y: 0 }, axis: 'vy', sign: 1 },
    {
      edge: 'bottom',
      body: { x: 500, y: 596, vx: 0.2, vy: 1 },
      at: { y: 600 },
      axis: 'vy',
      sign: -1,
    },
  ] as const)('bounces back off the $edge edge, slower', ({ body, at, axis, sign }) => {
    const next = stepBody(body, 16, room);
    const before = Math.abs(body[axis]) * Math.exp(-16 / AIR_DRAG_MS);

    expect(next).toMatchObject(at);
    expect(Math.sign(next[axis])).toBe(sign);
    expect(Math.abs(next[axis])).toBeCloseTo(before * BOUNCE);
  });

  it('keeps its speed along the edge it bounces off', () => {
    const next = stepBody({ x: 4, y: 300, vx: -1, vy: 0.2 }, 16, room);

    expect(next.vy).toBeCloseTo(0.2 * Math.exp(-16 / AIR_DRAG_MS));
  });

  it('pulls a body the window shrank past back inside', () => {
    const next = stepBody({ x: 1200, y: 900, vx: 0, vy: 0 }, 16, room);

    expect(next).toMatchObject({ x: 1000, y: 600 });
  });

  it('never leaves the window, however hard it is thrown, and comes to rest', () => {
    let body: NinoBody = { x: 500, y: 300, vx: MAX_THROW_SPEED, vy: -MAX_THROW_SPEED };
    for (let frame = 0; frame < 600; frame += 1) {
      body = stepBody(body, 16, room);
      expect(body.x).toBeGreaterThanOrEqual(0);
      expect(body.x).toBeLessThanOrEqual(room.width);
      expect(body.y).toBeGreaterThanOrEqual(0);
      expect(body.y).toBeLessThanOrEqual(room.height);
    }

    expect(isSettled(body)).toBe(true);
  });
});

describe('isSettled', () => {
  it('settles once slower than 0.05 px/ms', () => {
    expect(isSettled({ x: 0, y: 0, vx: 0.03, vy: 0.03 })).toBe(true);
    expect(isSettled({ x: 0, y: 0, vx: 0.04, vy: 0.04 })).toBe(false);
  });
});

describe('clampPoint', () => {
  it('keeps a point inside the room and treats a negative room as none', () => {
    expect(clampPoint({ x: -5, y: 700 }, { width: 1000, height: 600 })).toEqual({ x: 0, y: 600 });
    expect(clampPoint({ x: 40, y: 40 }, { width: -10, height: 600 })).toEqual({ x: 0, y: 40 });
  });
});

describe('homeOffsetAt', () => {
  it('starts at the landing offset and fades toward the drift path', () => {
    expect(homeOffsetAt({ x: 100, y: -50 }, 0)).toEqual({ x: 100, y: -50 });
    expect(homeOffsetAt({ x: 100, y: -50 }, HOME_DECAY_MS).x).toBeCloseTo(100 / Math.E);
    const late = homeOffsetAt({ x: 100, y: -50 }, 5000);
    expect(Math.abs(late.x)).toBeLessThan(1);
    expect(Math.abs(late.y)).toBeLessThan(1);
  });
});

describe('easeOutCubic', () => {
  it('runs from 0 to 1, fast first, and clamps outside that range', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});
