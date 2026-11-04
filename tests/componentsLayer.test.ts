import { readFileSync } from 'node:fs';
import postcss, { type AtRule, type Root } from 'postcss';
import { describe, expect, it } from 'vitest';
import { componentsLayer, LAYER_ORDER } from '../build/postcss-components-layer';

const STYLE_BLOCK = '/src/components/I9kExample.vue?vue&type=style&index=0&scoped=abc123&lang.css';

function layer(css: string, from = STYLE_BLOCK): Root {
  return postcss([componentsLayer()]).process(css, { from }).root;
}

function topLevel(root: Root) {
  return root.nodes.map((node) =>
    node.type === 'atrule' ? `@${node.name} ${node.params}` : node.type,
  );
}

describe('the components cascade layer', () => {
  it('opens a component stylesheet with the full order and puts its rules in components', () => {
    const root = layer(`
      .i9k-example[data-v-abc123] { color: red; }
      .i9k-example[data-v-abc123] .inner { color: blue; }
      @media (max-width: 768px) { .i9k-example[data-v-abc123] { color: green; } }
      @supports (display: grid) { .i9k-example[data-v-abc123] { display: grid; } }
      @container (min-width: 20rem) { .i9k-example[data-v-abc123] { gap: 1rem; } }
    `);

    expect(topLevel(root)).toEqual([`@layer ${LAYER_ORDER}`, '@layer components']);
    const block = root.nodes[1] as AtRule;
    expect(
      block.nodes?.map((node) =>
        node.type === 'rule' ? node.selector : `@${(node as AtRule).name}`,
      ),
    ).toEqual([
      '.i9k-example[data-v-abc123]',
      '.i9k-example[data-v-abc123] .inner',
      '@media',
      '@supports',
      '@container',
    ]);
  });

  it('leaves font faces and keyframes outside the layer', () => {
    const root = layer(`
      @keyframes i9k-example-spin { to { transform: rotate(1turn); } }
      .i9k-example[data-v-abc123] { animation: i9k-example-spin 1s; }
      @font-face { font-family: Example; src: local(Example); }
    `);

    expect(topLevel(root)).toEqual([
      `@layer ${LAYER_ORDER}`,
      '@layer components',
      '@keyframes i9k-example-spin',
      '@font-face ',
    ]);
  });

  it('leaves stylesheets that are not a Vue style block alone', () => {
    const css = '.sr-only { position: absolute; }';

    expect(layer(css, '/src/styles/utilities.css').toString()).toBe(css);
  });

  it('declares the same order as the shared stylesheet', () => {
    const shared = readFileSync('src/styles/index.css', 'utf8');

    expect(shared.startsWith(`@layer ${LAYER_ORDER};`)).toBe(true);
  });
});
