import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { build } from 'vite';
import { createSSRApp, h, nextTick } from 'vue';

import I9kNino from '../src/components/I9kNino.vue';
import { NINO_ACTION_DURATIONS, NINO_BEAT, NINO_FACES, NINO_TALK_MOUTH } from '../src/data/nino';
import {
  I9K_NINO_ACTIONS,
  I9K_NINO_EXPRESSIONS,
  type I9kNinoActionResult,
  type I9kNinoExposed,
} from '../src/types/components';

async function buildComponentStylesheet(componentName: string): Promise<Root> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [vue()],
    build: {
      write: false,
      lib: {
        entry: resolve(`src/components/${componentName}.vue`),
        formats: ['es'],
        fileName: componentName,
      },
      rollupOptions: {
        external: ['vue'],
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((buildResult) =>
    'output' in buildResult ? buildResult.output : [],
  );
  const stylesheet = outputs.find(
    (output) => output.type === 'asset' && output.fileName.endsWith('.css'),
  );

  if (stylesheet?.type !== 'asset') {
    throw new Error(`Vite did not emit the ${componentName} stylesheet`);
  }

  return postcss.parse(stylesheet.source.toString());
}

function isReducedMotionRule(rule: Rule) {
  const parent = rule.parent;

  return (
    parent?.type === 'atrule' &&
    (parent as AtRule).name === 'media' &&
    (parent as AtRule).params.includes('prefers-reduced-motion')
  );
}

/** Every number in a drawn part's geometry: a rect's box or a path's coordinates. */
function coordinatesOf(part: DOMWrapper<Element>): number[] {
  const d = part.attributes('d');
  if (d !== undefined) return (d.match(/\d+/g) ?? []).map(Number);
  return (['x', 'y', 'width', 'height'] as const).map((name) => Number(part.attributes(name)));
}

/** The height of a rect, or of a path drawn with absolute M, H and V commands. */
function verticalExtent(part: DOMWrapper<Element>): number {
  const d = part.attributes('d');
  if (d === undefined) return Number(part.attributes('height'));
  const ys: number[] = [];
  for (const [, command, args] of d.matchAll(/([MHVZ])([^MHVZ]*)/g)) {
    const numbers = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (command === 'M') ys.push(numbers[1]);
    if (command === 'V') ys.push(numbers[0]);
  }
  return Math.max(...ys) - Math.min(...ys);
}

/** The box a rect, or a path drawn with absolute M, H and V commands, covers. */
function boundsOf(part: DOMWrapper<Element>) {
  const d = part.attributes('d');
  if (d === undefined) {
    const [x, y, width, height] = coordinatesOf(part);
    return { left: x, top: y, right: x + width, bottom: y + height };
  }
  const xs: number[] = [];
  const ys: number[] = [];
  for (const [, command, args] of d.matchAll(/([MHVZ])([^MHVZ]*)/g)) {
    const numbers = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (command === 'M') xs.push(numbers[0]);
    if (command === 'M') ys.push(numbers[1]);
    if (command === 'H') xs.push(numbers[0]);
    if (command === 'V') ys.push(numbers[0]);
  }
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

function drawnParts(wrapper: VueWrapper) {
  return wrapper
    .findAll('[data-nino-part]')
    .filter((part) => ['rect', 'path'].includes(part.element.tagName.toLowerCase()));
}

/** Every `animation` declaration outside the reduced-motion block, with its selector. */
function animationRules(stylesheet: Root) {
  const found: { selector: string; value: string }[] = [];
  stylesheet.walkDecls('animation', (decl) => {
    const rule = decl.parent as Rule;
    if (!isReducedMotionRule(rule)) found.push({ selector: rule.selector, value: decl.value });
  });
  return found;
}

/** Every `transition` declaration outside the reduced-motion block, with its selector. */
function transitionRules(stylesheet: Root) {
  const found: { selector: string; value: string }[] = [];
  stylesheet.walkDecls('transition', (decl) => {
    const rule = decl.parent as Rule;
    if (!isReducedMotionRule(rule)) found.push({ selector: rule.selector, value: decl.value });
  });
  return found;
}

/** A rule inside an @keyframes block: its declarations describe one frame, not a motion. */
function isKeyframeRule(rule: Rule) {
  return rule.parent?.type === 'atrule' && /keyframes$/.test((rule.parent as AtRule).name);
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// jsdom has never implemented window.matchMedia.
function stubReducedMotion() {
  vi.stubGlobal('matchMedia', (media: string) => ({
    media,
    matches: media === REDUCED_MOTION_QUERY,
    addEventListener() {},
    removeEventListener() {},
  }));
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await nextTick();
}

describe('I9kNino', () => {
  it('is decorative unless it is given a name', () => {
    const wrapper = mount(I9kNino);
    const svg = wrapper.get('svg');

    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
    expect(svg.attributes('role')).toBeUndefined();
    expect(wrapper.find('title').exists()).toBe(false);
  });

  it('becomes an image with the caller-supplied localized name', () => {
    const wrapper = mount(I9kNino, { props: { label: 'نينو' } });
    const svg = wrapper.get('svg');

    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.get('title').text()).toBe('نينو');
    expect(svg.attributes('aria-labelledby')).toBe(wrapper.get('title').attributes('id'));
  });

  it('keeps two eyes and one mouth in the default expression', () => {
    const wrapper = mount(I9kNino);

    expect(wrapper.findAll('[data-nino-part="eye"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-nino-part="mouth"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-nino-part="brow"]')).toHaveLength(0);
    expect(wrapper.classes()).toContain('i9k-nino--idle');
  });

  it('draws brows only for the moods that raise or knit them', () => {
    for (const expression of I9K_NINO_EXPRESSIONS) {
      const brows = mount(I9kNino, { props: { expression } }).findAll('[data-nino-part="brow"]');
      expect(brows).toHaveLength(expression === 'thinking' || expression === 'worried' ? 2 : 0);
    }
  });

  it.each(I9K_NINO_EXPRESSIONS)('renders the %s expression with two eyes', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression } });

    expect(wrapper.findAll('[data-nino-part="eye"]')).toHaveLength(2);
    expect(wrapper.get('[data-nino-part="mouth"]').attributes('d')).toBeTruthy();
    expect(wrapper.classes()).toContain(`i9k-nino--${expression}`);
  });

  it('gives every expression a mouth of its own', () => {
    const mouths = I9K_NINO_EXPRESSIONS.map((expression) =>
      mount(I9kNino, { props: { expression } }).get('[data-nino-part="mouth"]').attributes('d'),
    );

    expect(new Set(mouths).size).toBe(I9K_NINO_EXPRESSIONS.length);
  });

  it('closes the eyes into flatter shapes than the open ones', () => {
    const open = mount(I9kNino).findAll('[data-nino-part="eye"]');
    const closed = mount(I9kNino, { props: { expression: 'eyes-closed' } }).findAll(
      '[data-nino-part="eye"]',
    );

    const openHeight = verticalExtent(open[0]);
    const closedHeight = verticalExtent(closed[0]);

    expect(closedHeight).toBeLessThan(openHeight);
  });

  it('reports the gaze direction as state', () => {
    expect(mount(I9kNino).classes()).toContain('i9k-nino--look-center');
    expect(mount(I9kNino, { props: { look: 'end' } }).classes()).toContain('i9k-nino--look-end');
    expect(mount(I9kNino, { props: { look: 'up' } }).classes()).toContain('i9k-nino--look-up');
  });

  it('moves only the eyes when it looks somewhere', () => {
    const wrapper = mount(I9kNino, { props: { look: 'start' } });

    expect(wrapper.get('[data-nino-part="eyes"]').classes()).toContain('i9k-nino__eyes');
    expect(wrapper.get('[data-nino-part="head"]').attributes('d')).toBe(
      mount(I9kNino).get('[data-nino-part="head"]').attributes('d'),
    );
  });

  it("keeps the caller's look and his own glance on separate layers", () => {
    const wrapper = mount(I9kNino);
    const eyes = wrapper.get('[data-nino-part="eyes"]');
    const glance = eyes.get('[data-nino-part="glance"]');

    expect(glance.classes()).toContain('i9k-nino__glance');
    expect(glance.findAll('[data-nino-part="eye"]')).toHaveLength(2);
  });

  it('animates by default and goes still when asked not to', () => {
    expect(mount(I9kNino).classes()).toContain('i9k-nino--animated');
    expect(mount(I9kNino, { props: { animated: false } }).classes()).not.toContain(
      'i9k-nino--animated',
    );
  });

  it('keeps the chosen expression when it is not animating', () => {
    const still = mount(I9kNino, { props: { expression: 'worried', animated: false } });
    const moving = mount(I9kNino, { props: { expression: 'worried' } });

    expect(still.get('[data-nino-part="mouth"]').attributes('d')).toBe(
      moving.get('[data-nino-part="mouth"]').attributes('d'),
    );
    expect(still.findAll('[data-nino-part="brow"]')).toHaveLength(2);
  });

  it('sizes itself from the scale, and steps aside for a host svg when asked', () => {
    expect(mount(I9kNino, { props: { size: 'lg' } }).classes()).toContain('i9k-nino--lg');
    expect(mount(I9kNino, { props: { size: 'auto' } }).classes()).toContain('i9k-nino--auto');
  });

  it('lets a host svg position it through fallthrough attributes', () => {
    const wrapper = mount(I9kNino, {
      props: { size: 'auto' },
      attrs: { x: '40', y: '80', width: '40', height: '40' },
    });
    const svg = wrapper.get('svg');

    expect(svg.attributes('x')).toBe('40');
    expect(svg.attributes('y')).toBe('80');
    expect(svg.attributes('width')).toBe('40');
  });

  it('draws on a crisp 64-unit canvas', () => {
    const wrapper = mount(I9kNino);

    expect(wrapper.get('svg').attributes('shape-rendering')).toBe('crispEdges');
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 64 64');
  });

  // The grid is what keeps Nino crisp at 32px, and a single stray coordinate in
  // one path is invisible in review but not on screen.
  it.each(I9K_NINO_EXPRESSIONS)('keeps every %s coordinate on the two-unit grid', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression } });
    const parts = drawnParts(wrapper);

    expect(parts.length).toBeGreaterThan(10);
    expect(parts.flatMap(coordinatesOf).filter((value) => value % 2 !== 0)).toEqual([]);
  });

  it.each(I9K_NINO_EXPRESSIONS)('keeps his body whole when %s', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression } });

    for (const part of ['antenna', 'antenna-stem', 'glint', 'head', 'screen']) {
      expect(wrapper.findAll(`[data-nino-part="${part}"]`)).toHaveLength(1);
    }
    expect(wrapper.findAll('[data-nino-part="leg"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-nino-part="foot"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-nino-part="arm"]')).toHaveLength(2);
  });

  // A shadow needs ground: Nino floating in a sky must not drag one along, so
  // it is opt-in.
  it('draws no shadow unless asked', () => {
    expect(mount(I9kNino).findAll('[data-nino-part="shadow"]')).toHaveLength(0);
    expect(
      mount(I9kNino, { props: { shadow: true } }).findAll('[data-nino-part="shadow"]'),
    ).toHaveLength(1);
  });

  it('blushes only when happy or resting his eyes', () => {
    for (const expression of I9K_NINO_EXPRESSIONS) {
      const cheeks = mount(I9kNino, { props: { expression } }).findAll('[data-nino-part="cheek"]');
      expect(cheeks).toHaveLength(expression === 'happy' || expression === 'eyes-closed' ? 2 : 0);
    }
  });

  it('raises his hands only when hiding', () => {
    for (const expression of I9K_NINO_EXPRESSIONS) {
      const hands = mount(I9kNino, { props: { expression } }).findAll('[data-nino-part="hand"]');
      expect(hands).toHaveLength(expression === 'hiding' ? 2 : 0);
    }
  });

  it('covers each eye with a hand while hiding', () => {
    const wrapper = mount(I9kNino, { props: { expression: 'hiding' } });
    const eyes = wrapper.findAll('[data-nino-part="eye"]').map(boundsOf);
    const hands = wrapper.findAll('[data-nino-part="hand"]').map(boundsOf);

    eyes.forEach((eye, index) => {
      const hand = hands[index];
      expect(hand.left).toBeLessThanOrEqual(eye.left);
      expect(hand.right).toBeGreaterThanOrEqual(eye.right);
      // Below the fingertips, so the eye never shows between the fingers.
      expect(hand.top + 4).toBeLessThanOrEqual(eye.top);
      expect(hand.bottom).toBeGreaterThanOrEqual(eye.bottom);
    });
  });

  it('peeks with the right-hand hand on screen', () => {
    const hands = mount(I9kNino, { props: { expression: 'hiding' } }).findAll(
      '[data-nino-part="hand"]',
    );

    expect(hands[0].classes()).not.toContain('i9k-nino__hand--peek');
    expect(hands[1].classes()).toContain('i9k-nino__hand--peek');
    expect(boundsOf(hands[1]).left).toBeGreaterThan(boundsOf(hands[0]).left);
  });

  it('swirls a mirrored pair of eyes in the open eyes’ boxes when dizzy', () => {
    const [left, right] = mount(I9kNino, { props: { expression: 'dizzy' } })
      .findAll('[data-nino-part="eye"]')
      .map(boundsOf);

    expect(left).toEqual({ left: 18, top: 16, right: 30, bottom: 28 });
    expect(right).toEqual({ left: 34, top: 16, right: 46, bottom: 28 });
    expect(NINO_FACES.dizzy.eyes[1]).toEqual({
      d: (NINO_FACES.dizzy.eyes[0] as { d: string }).d.replace(
        /([MH])(\d+)/g,
        (_, command: string, x: string) => `${command}${64 - Number(x)}`,
      ),
    });
  });

  // A strict Content-Security-Policy (`style-src 'self'`) drops inline style
  // attributes, so an idle Nino must not render one, not even an empty one.
  it('renders on the server without a style attribute', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(I9kNino) }));

    expect(html).toContain('<svg');
    expect(html).not.toMatch(/\sstyle=/);
  });
});

describe('I9kNino compiled styles', () => {
  it('stops every animation and transition under prefers-reduced-motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const moving: string[] = [];
    const stilled: string[] = [];

    stylesheet.walkRules((rule) => {
      if (isKeyframeRule(rule)) return;
      for (const node of rule.nodes) {
        if (node.type !== 'decl') continue;
        if (!/^(animation|transition)(-|$)/.test(node.prop)) continue;
        if (isReducedMotionRule(rule) && node.value === 'none') stilled.push(rule.selector);
        else if (!isReducedMotionRule(rule) && node.value !== 'none') moving.push(rule.selector);
      }
    });

    expect(moving.length).toBeGreaterThan(0);
    for (const selector of moving) {
      expect(
        stilled.some((stilledSelector) => stilledSelector.includes(selector)),
        selector,
      ).toBe(true);
    }
  });

  it('reads its colours from overridable custom properties', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const source = stylesheet.toString();

    expect(source).toContain('--i9k-nino-body');
    expect(source).toContain('--i9k-nino-eye');
    expect(source).toContain('--i9k-nino-screen');
    expect(source).toContain('--i9k-nino-cheek');
    expect(source).toContain('--i9k-nino-glint');
  });

  it('lets a jump or a raised arm leave his box', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    let visible = false;

    stylesheet.walkDecls('overflow', (decl) => {
      const rule = decl.parent as Rule;
      if (/^\.i9k-nino\[data-v-[\w-]+\]$/.test(rule.selector) && decl.value === 'visible') {
        visible = true;
      }
    });

    expect(visible).toBe(true);
  });
});

describe('I9kNino ambient life', () => {
  let stylesheet: Root;

  beforeAll(async () => {
    stylesheet = await buildComponentStylesheet('I9kNino');
  });

  it('breathes and bobs continuously rather than in steps', () => {
    const rules = animationRules(stylesheet);
    const valueFor = (fragment: string) =>
      rules.find(({ selector }) => selector.includes(fragment))?.value ?? '';

    expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('alternate');
    expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('ease-in-out');
    expect(valueFor('.i9k-nino--thinking .i9k-nino__figure')).toContain('alternate');
    expect(valueFor('.i9k-nino--worried .i9k-nino__figure')).toContain('linear');
  });

  it('eases each blink shut and open', () => {
    const timings: string[] = [];
    stylesheet.walkAtRules(/keyframes$/, (atRule) => {
      if (!atRule.params.startsWith('i9k-nino-blink')) return;
      atRule.walkDecls('animation-timing-function', (decl) => {
        timings.push(decl.value);
      });
    });

    expect(timings).toContain('ease-in');
    expect(timings.some((value) => /cubic-bezier\(0?\.23,\s*1,\s*0?\.32,\s*1\)/.test(value))).toBe(
      true,
    );
  });

  // Task 4 makes this file-wide once the beat and the actions are eased too.
  it('keeps the ambient motion it had, now eased', () => {
    const pending = /--action-/;
    for (const { selector, value } of animationRules(stylesheet)) {
      if (pending.test(selector)) continue;
      expect(value, selector).not.toMatch(/steps\(|step-end|step-start/);
    }
  });

  it('breathes, blinks and pulses his antenna in every mood', () => {
    const rules = animationRules(stylesheet);
    const valueFor = (fragment: string) =>
      rules.find(({ selector }) => selector.includes(fragment))?.value;

    expect(valueFor('.i9k-nino--animated .i9k-nino__upper')).toContain('i9k-nino-breathe');
    expect(valueFor('.i9k-nino--animated .i9k-nino__antenna')).toContain('i9k-nino-antenna');
    expect(valueFor(':not(.i9k-nino--eyes-closed) .i9k-nino__eye')).toContain('i9k-nino-blink');
  });

  it('glances about only when idle and free to look', () => {
    const glances = animationRules(stylesheet).filter(
      ({ selector, value }) => selector.includes('.i9k-nino__glance') && value !== 'none',
    );

    expect(glances.length).toBeGreaterThan(0);
    for (const { selector } of glances) {
      expect(selector).toContain('.i9k-nino--idle');
      expect(selector).toContain('.i9k-nino--look-center');
    }
  });

  // A transition cannot hand over to an animation created or cancelled in the same
  // style change, so the look and the ambient glance must live on different elements.
  it('glides his eyes to a new look', () => {
    const glide = transitionRules(stylesheet).find(({ selector }) =>
      selector.includes('.i9k-nino--animated .i9k-nino__eyes'),
    );

    expect(glide?.value).toContain('transform');
    expect(glide?.value).toMatch(/200ms|\.2s/);
    expect(glide?.value).toMatch(/cubic-bezier\(0?\.23,\s*1,\s*0?\.32,\s*1\)/);
    expect(
      animationRules(stylesheet).filter(({ selector }) => /\.i9k-nino__eyes\[/.test(selector)),
    ).toEqual([]);
  });

  it('peeks over one hand only while hiding', () => {
    const peeks = animationRules(stylesheet).filter(({ value }) => value.includes('i9k-nino-peek'));

    expect(peeks).toHaveLength(1);
    expect(peeks[0].selector).toContain('.i9k-nino--hiding');
    expect(peeks[0].selector).toContain('.i9k-nino__hand--peek');
  });

  it('lifts his arms off his sides to hide, and lowers his hands to act', () => {
    const hidden: string[] = [];
    stylesheet.walkDecls('opacity', (decl) => {
      if (decl.value === '0') hidden.push((decl.parent as Rule).selector);
    });

    expect(
      hidden.some(
        (selector) =>
          selector.includes('.i9k-nino--hiding:not(.i9k-nino--acting)') &&
          selector.includes('.i9k-nino__arm'),
      ),
    ).toBe(true);
    expect(
      hidden.some(
        (selector) =>
          selector.includes('.i9k-nino--hiding.i9k-nino--acting') &&
          selector.includes('.i9k-nino__hand'),
      ),
    ).toBe(true);
  });

  it('fades his arms and hands rather than popping them', () => {
    const fades = transitionRules(stylesheet).filter(({ value }) => value.includes('opacity'));

    expect(fades.some(({ selector }) => selector.includes('.i9k-nino__arm['))).toBe(true);
    expect(fades.some(({ selector }) => selector.includes('.i9k-nino__hand['))).toBe(true);
    for (const { selector } of fades) expect(selector).toContain('.i9k-nino--animated');
  });

  it('keeps his eyes behind his hands wherever he is asked to look', () => {
    let held = false;
    stylesheet.walkDecls('transform', (decl) => {
      const selector = (decl.parent as Rule).selector;
      if (selector.includes('.i9k-nino--hiding') && selector.includes('.i9k-nino__eyes')) {
        held = decl.value === 'none';
      }
    });

    expect(held).toBe(true);
  });

  it('glances the other way first on a right-to-left page', () => {
    const flips: string[] = [];
    stylesheet.walkDecls('--i9k-nino-dir', (decl) => {
      if (decl.value.trim() === '-1') flips.push((decl.parent as Rule).selector);
    });

    expect(flips.join(' ')).toContain('rtl');
  });

  it('sways only his head and arms when dizzy', () => {
    const dizzy = animationRules(stylesheet).filter(({ selector }) =>
      selector.includes('action-dizzy'),
    );

    expect(dizzy).toHaveLength(1);
    expect(dizzy[0].selector).toContain('.i9k-nino__upper');
    expect(dizzy[0].value).toContain('i9k-nino-dizzy');
  });

  it('sways in two-unit steps and ends the dizzy spell at rest', () => {
    const frames: { at: string; numbers: number[] }[] = [];
    stylesheet.walkAtRules(/keyframes$/, (atRule) => {
      // Scoped styles suffix keyframe names with the component's id.
      if (!atRule.params.startsWith('i9k-nino-dizzy')) return;
      atRule.walkDecls('transform', (decl) => {
        frames.push({
          at: (decl.parent as Rule).selector,
          numbers: (decl.value.match(/-?\d+(\.\d+)?/g) ?? []).map(Number),
        });
      });
    });

    expect(frames.length).toBeGreaterThan(4);
    for (const { numbers } of frames) {
      expect(numbers.filter((value) => value % 2 !== 0)).toEqual([]);
    }
    const last = frames.find(({ at }) =>
      at.split(',').some((part) => ['to', '100%'].includes(part.trim())),
    );
    expect(last?.numbers.every((value) => value === 0)).toBe(true);
  });
});

describe('I9kNino mood beat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('blinks the old face shut and swaps the new one in behind its eyes', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'worried' });
    expect(wrapper.classes()).toContain('i9k-nino--beat');
    expect(wrapper.classes()).toContain('i9k-nino--beat-shut');
    expect(wrapper.classes()).toContain('i9k-nino--idle');
    expect(wrapper.findAll('[data-nino-part="brow"]')).toHaveLength(0);

    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toContain('i9k-nino--worried');
    expect(wrapper.findAll('[data-nino-part="brow"]')).toHaveLength(2);
    expect(wrapper.classes()).toContain('i9k-nino--beat');
    expect(wrapper.classes()).toContain('i9k-nino--beat-open');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat-shut');

    await advance(NINO_BEAT.duration - NINO_BEAT.swapAt);
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
    expect(wrapper.classes().filter((name) => name.startsWith('i9k-nino--beat'))).toEqual([]);
  });

  it('lands on the latest mood when moods change mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'worried' });
    await advance(NINO_BEAT.swapAt / 2);
    await wrapper.setProps({ expression: 'happy' });
    await advance(NINO_BEAT.swapAt / 2);
    expect(wrapper.classes()).toContain('i9k-nino--idle');

    await advance(NINO_BEAT.swapAt / 2);
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--worried');
  });

  it('shuts again when a second mood arrives mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'thinking' });
    await advance(NINO_BEAT.swapAt + 20);
    expect(wrapper.classes()).toContain('i9k-nino--beat-open');

    await wrapper.setProps({ expression: 'worried' });
    expect(wrapper.classes()).toContain('i9k-nino--beat-shut');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat-open');
    expect(wrapper.classes()).toContain('i9k-nino--thinking');

    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toContain('i9k-nino--worried');
    expect(wrapper.classes()).toContain('i9k-nino--beat-open');

    await advance(NINO_BEAT.duration - NINO_BEAT.swapAt);
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('shuts and opens every face part through the beat', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const rules = animationRules(stylesheet);

    for (const part of ['eye', 'brow', 'mouth', 'hand', 'cheek']) {
      const shut = rules.find(({ selector }) =>
        selector.includes(`--beat-shut .i9k-nino__${part}[`),
      );
      const open = rules.find(({ selector }) =>
        selector.includes(`--beat-open .i9k-nino__${part}[`),
      );
      expect(shut?.value, `${part} shut`).toContain('forwards');
      expect(shut?.value, `${part} shut`).toMatch(/120ms|\.12s/);
      expect(open?.value, `${part} open`).toMatch(/180ms|\.18s/);
      expect(open?.value, `${part} open`).not.toContain('forwards');
    }
    const hop = rules.find(({ selector }) => selector.includes('--beat .i9k-nino__figure['));
    expect(hop?.value).toContain('i9k-nino-beat-hop');
    expect(hop?.value).toMatch(/300ms|\.3s/);
  });

  // The talk frame carries the mouth class too, so the beat's rules must come later
  // in the stylesheet than talking's to win at equal specificity.
  it('lets the beat take the mouth from the talk loop', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const order: string[] = [];
    stylesheet.walkRules((rule) => {
      if (!isReducedMotionRule(rule) && !isKeyframeRule(rule)) order.push(rule.selector);
    });
    const talking = order.findIndex((selector) => selector.includes('--talking .i9k-nino__mouth['));
    const beat = order.findIndex((selector) => selector.includes('--beat-shut .i9k-nino__mouth['));

    expect(talking).toBeGreaterThan(-1);
    expect(beat).toBeGreaterThan(talking);
  });

  it('raises his hands while the face opens', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'hiding' });
    expect(wrapper.findAll('[data-nino-part="hand"]')).toHaveLength(0);

    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toContain('i9k-nino--beat-open');
    expect(wrapper.findAll('[data-nino-part="hand"]')).toHaveLength(2);
  });

  it('swaps at once when it is not animating', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle', animated: false } });

    await wrapper.setProps({ expression: 'happy' });
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('swaps at once for a visitor who prefers reduced motion', async () => {
    stubReducedMotion();
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'happy' });
    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
  });

  it('shows the new mood at once when motion is switched off mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'happy' });
    await wrapper.setProps({ animated: false });

    expect(wrapper.classes()).toContain('i9k-nino--happy');
    expect(wrapper.classes()).not.toContain('i9k-nino--beat');
    expect(wrapper.classes().filter((name) => name.startsWith('i9k-nino--beat'))).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no timer behind when it is unmounted mid-beat', async () => {
    const wrapper = mount(I9kNino, { props: { expression: 'idle' } });

    await wrapper.setProps({ expression: 'happy' });
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('I9kNino talking', () => {
  it('adds an open-mouth frame while talking', () => {
    const wrapper = mount(I9kNino, { props: { talking: true } });

    expect(wrapper.classes()).toContain('i9k-nino--talking');
    expect(wrapper.get('[data-nino-part="talk-mouth"]').attributes('d')).toBe(NINO_TALK_MOUTH);
    expect(wrapper.findAll('[data-nino-part="mouth"]')).toHaveLength(1);
  });

  it('keeps one plain mouth when quiet', () => {
    const wrapper = mount(I9kNino);

    expect(wrapper.classes()).not.toContain('i9k-nino--talking');
    expect(wrapper.find('[data-nino-part="talk-mouth"]').exists()).toBe(false);
  });

  it.each(I9K_NINO_EXPRESSIONS)('talks while %s and keeps the mouth of that mood', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression, talking: true } });

    expect(wrapper.get('[data-nino-part="mouth"]').attributes('d')).toBe(
      NINO_FACES[expression].mouth,
    );
    expect(wrapper.find('[data-nino-part="talk-mouth"]').exists()).toBe(true);
  });

  // With motion off, the talk keyframes never run, so the open frame must be
  // hidden by default rather than shown by default.
  it('keeps his ordinary mouth showing when talking cannot animate', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const hidden: string[] = [];

    stylesheet.walkDecls('visibility', (decl) => {
      const rule = decl.parent as Rule;
      if (rule.parent?.type === 'root' && decl.value === 'hidden') hidden.push(rule.selector);
    });

    expect(
      hidden.some((selector) => /^\.i9k-nino__mouth--talk\[data-v-[\w-]+\]$/.test(selector)),
    ).toBe(true);
  });

  it('trades mouth heights instead of cutting between frames', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const frames: { name: string; prop: string; value: string }[] = [];
    stylesheet.walkAtRules(/keyframes$/, (atRule) => {
      if (!atRule.params.startsWith('i9k-nino-talk-')) return;
      atRule.walkDecls((decl) => {
        frames.push({ name: atRule.params, prop: decl.prop, value: decl.value });
      });
    });

    const open = frames.filter(({ name }) => name.startsWith('i9k-nino-talk-open'));
    expect(
      open.filter(({ prop }) => prop === 'visibility').every(({ value }) => value === 'visible'),
    ).toBe(true);
    expect(
      open.some(({ prop, value }) => prop === 'transform' && /scaleY\(0?\.2\)/.test(value)),
    ).toBe(true);
    expect(
      frames.some(
        ({ name, prop, value }) =>
          name.startsWith('i9k-nino-talk-closed') &&
          prop === 'transform' &&
          /scaleY\(0?\.2\)/.test(value),
      ),
    ).toBe(true);
  });
});

describe('I9kNino actions', () => {
  const ninoOf = (wrapper: VueWrapper) => wrapper.vm as unknown as I9kNinoExposed;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(I9K_NINO_ACTIONS)('plays %s to the end and reports it', async (action) => {
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play(action);
    await nextTick();

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-nino--acting', `i9k-nino--action-${action}`]),
    );
    expect(wrapper.attributes('style')).toContain(
      `--i9k-nino-action-duration: ${NINO_ACTION_DURATIONS[action]}ms`,
    );

    await advance(NINO_ACTION_DURATIONS[action] - 1);
    expect(wrapper.emitted('action-end')).toBeUndefined();

    await advance(1);
    await expect(done).resolves.toEqual({ action, completed: true });
    expect(wrapper.emitted('action-end')).toEqual([[{ action, completed: true }]]);
    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
  });

  it('cuts a running action off when another starts', async () => {
    const wrapper = mount(I9kNino);
    const wave = ninoOf(wrapper).play('wave');
    await advance(100);
    const shake = ninoOf(wrapper).play('shake');

    await expect(wave).resolves.toEqual({ action: 'wave', completed: false });
    await nextTick();
    expect(wrapper.classes()).toContain('i9k-nino--action-shake');
    expect(wrapper.classes()).not.toContain('i9k-nino--action-wave');

    await advance(NINO_ACTION_DURATIONS.shake);
    await expect(shake).resolves.toEqual({ action: 'shake', completed: true });
    expect(wrapper.emitted('action-end')).toEqual([
      [{ action: 'wave', completed: false }],
      [{ action: 'shake', completed: true }],
    ]);
  });

  it('settles every call exactly once when the button is mashed', async () => {
    const wrapper = mount(I9kNino);
    const calls = [
      ninoOf(wrapper).play('jump'),
      ninoOf(wrapper).play('jump'),
      ninoOf(wrapper).play('jump'),
    ];

    await advance(NINO_ACTION_DURATIONS.jump);
    await expect(Promise.all(calls)).resolves.toEqual([
      { action: 'jump', completed: false },
      { action: 'jump', completed: false },
      { action: 'jump', completed: true },
    ]);
    expect(wrapper.emitted('action-end')).toHaveLength(3);
  });

  it('restarts the same action from its first frame', async () => {
    const wrapper = mount(I9kNino);
    void ninoOf(wrapper).play('nod');
    await nextTick();
    const firstStage = wrapper.get('[data-nino-part="stage"]').element;

    void ninoOf(wrapper).play('nod');
    await nextTick();
    expect(wrapper.get('[data-nino-part="stage"]').element).not.toBe(firstStage);
  });

  it('keeps acting while his mood changes', async () => {
    const wrapper = mount(I9kNino);
    void ninoOf(wrapper).play('jump');

    await wrapper.setProps({ expression: 'happy' });
    await advance(NINO_BEAT.swapAt);
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-nino--happy', 'i9k-nino--action-jump']),
    );
  });

  it('reports at once and moves nothing when it is not animating', async () => {
    const wrapper = mount(I9kNino, { props: { animated: false } });
    const done = ninoOf(wrapper).play('wave');
    await nextTick();

    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
    await expect(done).resolves.toEqual({ action: 'wave', completed: true });
    expect(wrapper.emitted('action-end')).toEqual([[{ action: 'wave', completed: true }]]);
  });

  it('reports at once for a visitor who prefers reduced motion', async () => {
    stubReducedMotion();
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play('jump');
    await nextTick();

    expect(wrapper.classes()).not.toContain('i9k-nino--acting');
    await expect(done).resolves.toEqual({ action: 'jump', completed: true });
  });

  // A consumer that queues or retries actions plays again from action-end; that
  // call must settle like any other and must not cut a later action short.
  it('settles a call made from an action-end handler', async () => {
    let chained: Promise<I9kNinoActionResult> | undefined;
    let chainedResult: I9kNinoActionResult | undefined;
    const wrapper: VueWrapper = mount(I9kNino, {
      attrs: {
        onActionEnd: (result: I9kNinoActionResult) => {
          if (result.completed || chained) return;
          chained = ninoOf(wrapper).play('nod');
          void chained.then((settled) => {
            chainedResult = settled;
          });
        },
      },
    });

    const wave = ninoOf(wrapper).play('wave');
    await advance(100);
    const shake = ninoOf(wrapper).play('shake');
    await advance(NINO_ACTION_DURATIONS.nod);

    await expect(wave).resolves.toEqual({ action: 'wave', completed: false });
    await expect(shake).resolves.toEqual({ action: 'shake', completed: false });
    expect(chainedResult).toEqual({ action: 'nod', completed: true });
    // shake never started, so it resolves without an action-end of its own.
    expect(wrapper.emitted('action-end')).toEqual([
      [{ action: 'wave', completed: false }],
      [{ action: 'nod', completed: true }],
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  // A handler that plays again on every action-end must not end up cutting off
  // its own action, call after call.
  it('stops when a handler replays on every action-end', async () => {
    let replays = 0;
    const wrapper: VueWrapper = mount(I9kNino, {
      attrs: {
        onActionEnd: () => {
          replays += 1;
          if (replays < 50) void ninoOf(wrapper).play('nod');
        },
      },
    });

    void ninoOf(wrapper).play('nod');
    await advance(100);
    const wave = ninoOf(wrapper).play('wave');

    await expect(wave).resolves.toEqual({ action: 'wave', completed: false });
    expect(replays).toBe(1);
    await nextTick();
    expect(wrapper.classes()).toContain('i9k-nino--action-nod');
  });

  it('settles even when an action-end handler throws', async () => {
    let settled: I9kNinoActionResult | undefined;
    const wrapper = mount(I9kNino, {
      attrs: {
        onActionEnd: () => {
          throw new Error('handler failed');
        },
      },
    });

    void ninoOf(wrapper)
      .play('wave')
      .then((result) => {
        settled = result;
      });
    // Vue rethrows a handler's error in development; it surfaces from the timer.
    await vi.advanceTimersByTimeAsync(NINO_ACTION_DURATIONS.wave).catch(() => undefined);
    await nextTick();

    expect(settled).toEqual({ action: 'wave', completed: true });
  });

  it('settles a pending action quietly when unmounted', async () => {
    const wrapper = mount(I9kNino);
    const done = ninoOf(wrapper).play('wave');

    wrapper.unmount();
    await expect(done).resolves.toEqual({ action: 'wave', completed: false });
    expect(wrapper.emitted('action-end')).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});
