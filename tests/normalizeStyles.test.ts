import { resolve } from 'node:path';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';
import { build } from 'vite';

async function buildStylesheet() {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      rollupOptions: {
        input: resolve('src/styles/index.css'),
      },
    },
  });
  const builds = Array.isArray(result) ? result : [result];
  const outputs = builds.flatMap((buildResult) =>
    'output' in buildResult ? buildResult.output : [],
  );
  const stylesheet = outputs.find(
    (output) => output.type === 'asset' && output.fileName.endsWith('.css'),
  );

  if (stylesheet?.type !== 'asset') {
    throw new Error('Vite did not emit the design-system stylesheet');
  }

  return postcss.parse(stylesheet.source.toString());
}

function findRule(root: Root, selector: string, property: string, value?: string) {
  let match: Rule | undefined;

  root.walkRules(selector, (rule) => {
    const hasDeclaration = rule.nodes.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === property &&
        (value === undefined || node.value === value),
    );
    if (hasDeclaration) {
      match = rule;
    }
  });

  return match;
}

function findRuleContainingSelector(
  root: Root,
  selector: string,
  property: string,
  value?: string,
) {
  let match: Rule | undefined;

  root.walkRules((rule) => {
    const hasDeclaration = rule.nodes.some(
      (node) =>
        node.type === 'decl' &&
        node.prop === property &&
        (value === undefined || node.value === value),
    );
    if (rule.selector.includes(selector) && hasDeclaration) {
      match = rule;
    }
  });

  return match;
}

function parentLayer(rule: Rule | undefined) {
  type ParentNode = {
    type: string;
    name?: string;
    params?: string;
    parent?: ParentNode;
  };
  let parent = rule?.parent as ParentNode | undefined;

  while (parent) {
    if (parent.type === 'atrule' && parent.name === 'layer') {
      return parent.params;
    }
    parent = parent.parent;
  }

  return undefined;
}

describe('normalized styles', () => {
  let stylesheet: Root;

  beforeAll(async () => {
    stylesheet = await buildStylesheet();
  });

  it('normalizes the root line height in the shipped stylesheet', () => {
    const rootRule = findRule(stylesheet, 'html', 'line-height', '1.15');

    expect(parentLayer(rootRule)).toBe('normalize');
  });

  it('declares the complete shared cascade order', () => {
    const layers = stylesheet.nodes
      .filter((node): node is AtRule => node.type === 'atrule' && node.name === 'layer')
      .map((layer) => layer.params);

    expect(layers).toEqual([
      'normalize',
      'fonts',
      'tokens',
      'theme',
      'base',
      'primitives',
      'utilities',
    ]);
  });

  it('keeps Normalize in a lower cascade layer than anchor-button styles', () => {
    const normalizeAnchor = findRule(stylesheet, 'a', 'background-color');
    const primaryButton = findRule(
      stylesheet,
      '.btn--primary',
      '--i9k-button-bg',
      'var(--primary-color)',
    );
    const layers = stylesheet.nodes
      .filter((node): node is AtRule => node.type === 'atrule' && node.name === 'layer')
      .map((layer) => layer.params);

    expect(parentLayer(normalizeAnchor)).toBe('normalize');
    expect(parentLayer(primaryButton)).toBe('primitives');
    expect(layers.indexOf('normalize')).toBeLessThan(layers.indexOf('primitives'));
  });

  it('ships branded element defaults in the base layer', () => {
    const rootTypography = findRule(stylesheet, 'html', 'line-height', '1.5');
    const brandedAnchor = findRule(stylesheet, 'a', 'text-decoration-thickness', '.1em');
    const focusRing = findRule(
      stylesheet,
      ':where(a,button,input,select,textarea):focus-visible',
      'outline',
      '3px solid var(--focus-color)',
    );

    expect(parentLayer(rootTypography)).toBe('base');
    expect(parentLayer(brandedAnchor)).toBe('base');
    expect(parentLayer(focusRing)).toBe('base');
  });

  it('ships the screen-reader-only utility above shared primitives', () => {
    const screenReaderOnly = findRule(stylesheet, '.sr-only', 'position', 'absolute');

    expect(parentLayer(screenReaderOnly)).toBe('utilities');
  });

  it('ships a configurable fading-grid background utility', () => {
    const container = findRule(stylesheet, '.i9k-fading-grid', 'isolation', 'isolate');
    const overlay = findRuleContainingSelector(
      stylesheet,
      '.i9k-fading-grid:',
      'pointer-events',
      'none',
    );
    const declarations = Object.fromEntries(
      overlay?.nodes
        .filter((node) => node.type === 'decl')
        .map((declaration) => [declaration.prop, declaration.value]) ?? [],
    );

    expect(parentLayer(container)).toBe('utilities');
    expect(parentLayer(overlay)).toBe('utilities');
    expect(overlay?.selector).toMatch(/\.i9k-fading-grid:{1,2}before/);
    expect(declarations['background-image']).toContain('var(--i9k-fading-grid-color)');
    expect(declarations['background-size']).toBe(
      'var(--i9k-fading-grid-size) var(--i9k-fading-grid-size)',
    );
    expect(declarations['mask-image']).toContain('var(--i9k-fading-grid-fade-end)');
  });

  it('keeps Arabic display typography inside the fonts layer', () => {
    const arabicDisplay = findRuleContainingSelector(
      stylesheet,
      '.i9k-arabic-display',
      'font-feature-settings',
      '"ss01"',
    );

    expect(parentLayer(arabicDisplay)).toBe('fonts');
  });
});
