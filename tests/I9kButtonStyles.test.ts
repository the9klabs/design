import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import postcss, { type Root, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';
import { build } from 'vite';

async function buildButtonStylesheet(): Promise<Root> {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [vue()],
    build: {
      write: false,
      lib: {
        entry: resolve('src/components/I9kButton.vue'),
        formats: ['es'],
        fileName: 'i9k-button',
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
    throw new Error('Vite did not emit the I9kButton stylesheet');
  }

  return postcss.parse(stylesheet.source.toString());
}

function declarations(stylesheet: Root, selector: RegExp) {
  const values: Record<string, string> = {};
  stylesheet.walkRules((rule: Rule) => {
    if (selector.test(rule.selector)) {
      rule.walkDecls((declaration) => {
        values[declaration.prop] = declaration.value;
      });
    }
  });
  return values;
}

describe('I9kButton compiled styles', () => {
  it('keeps themed borders and shared action geometry on the scoped root', async () => {
    const stylesheet = await buildButtonStylesheet();
    const root = declarations(stylesheet, /^\.i9k-button\[data-v-[^\]]+\]$/);

    expect(root['--i9k-button-border']).toBe('var(--control-border-color)');
    expect(root.border).toBe('1px solid var(--i9k-button-border)');
    expect(root['border-radius']).toBe('var(--radius-sm)');
    expect(root.background).toBe('var(--i9k-button-bg)');
  });

  it('pairs all primary action backgrounds with the on-primary foreground', async () => {
    const stylesheet = await buildButtonStylesheet();
    const primary = declarations(stylesheet, /^\.i9k-button--primary\[data-v-[^\]]+\]$/);

    expect(primary['--i9k-button-bg']).toBe('var(--primary-color)');
    expect(primary['--i9k-button-hover-bg']).toBe('var(--primary-hover-color)');
    expect(primary['--i9k-button-pressed-bg']).toBe('var(--primary-pressed-color)');
    expect(primary['--i9k-button-color']).toBe('var(--on-primary-color)');
    // Primary and secondary actions inherit the same shape from the root.
    expect(primary['border-radius']).toBeUndefined();
  });
});
