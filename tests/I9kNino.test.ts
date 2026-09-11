import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { build } from 'vite';

import I9kNino from '../src/components/I9kNino.vue';
import { I9K_NINO_EXPRESSIONS } from '../src/types/components';

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

  it('draws brows only for the expression that declares them', () => {
    const worried = mount(I9kNino, { props: { expression: 'worried' } });
    const idle = mount(I9kNino, { props: { expression: 'idle' } });

    expect(worried.findAll('[data-nino-part="brow"]')).toHaveLength(2);
    expect(idle.findAll('[data-nino-part="brow"]')).toHaveLength(0);
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

    const openHeight = Number(open[0].attributes('height'));
    const closedHeight = Number(closed[0].attributes('height'));

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
    expect(wrapper.get('[data-nino-part="head"]').attributes('x')).toBe(
      mount(I9kNino).get('[data-nino-part="head"]').attributes('x'),
    );
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

  it('draws on a whole-number pixel grid so it stays crisp when scaled down', () => {
    const wrapper = mount(I9kNino);

    expect(wrapper.get('svg').attributes('shape-rendering')).toBe('crispEdges');
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 64 64');
    for (const eye of wrapper.findAll('[data-nino-part="eye"]')) {
      expect(Number(eye.attributes('x')) % 4).toBe(0);
      expect(Number(eye.attributes('width')) % 4).toBe(0);
    }
  });

  // The grid is what keeps Nino crisp at 16px, and a single stray coordinate in
  // one mouth path is invisible in review but not on screen.
  it.each(I9K_NINO_EXPRESSIONS)('keeps every %s coordinate on the four-unit grid', (expression) => {
    const wrapper = mount(I9kNino, { props: { expression } });
    const offGrid: number[] = [];

    for (const part of wrapper.findAll('[data-nino-part="eye"], [data-nino-part="brow"]')) {
      for (const attribute of ['x', 'y', 'width', 'height'] as const) {
        const value = Number(part.attributes(attribute));
        if (value % 4 !== 0) offGrid.push(value);
      }
    }

    const mouth = wrapper.get('[data-nino-part="mouth"]').attributes('d') ?? '';
    for (const coordinate of mouth.match(/\d+/g) ?? []) {
      if (Number(coordinate) % 4 !== 0) offGrid.push(Number(coordinate));
    }

    expect(offGrid).toEqual([]);
  });
});

describe('I9kNino compiled styles', () => {
  it('stops every animation under prefers-reduced-motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const animated: string[] = [];
    const stilled: string[] = [];

    stylesheet.walkRules((rule) => {
      for (const node of rule.nodes) {
        if (node.type !== 'decl') continue;
        if (node.prop !== 'animation' && !node.prop.startsWith('animation-')) continue;
        if (isReducedMotionRule(rule) && node.value === 'none') stilled.push(rule.selector);
        else if (!isReducedMotionRule(rule)) animated.push(rule.selector);
      }
    });

    expect(animated.length).toBeGreaterThan(0);
    for (const selector of animated) {
      expect(stilled.some((stilledSelector) => stilledSelector.includes(selector))).toBe(true);
    }
  });

  it('reads its colours from overridable custom properties', async () => {
    const stylesheet = await buildComponentStylesheet('I9kNino');
    const source = stylesheet.toString();

    expect(source).toContain('--i9k-nino-body');
    expect(source).toContain('--i9k-nino-eye');
    expect(source).toContain('--i9k-nino-screen');
  });
});
