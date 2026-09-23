import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import postcss, { type Root, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';
import { build } from 'vite';

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

function hasDeclaration(rule: Rule, property: string, value: string) {
  return rule.nodes.some(
    (node) => node.type === 'decl' && node.prop === property && node.value === value,
  );
}

function isMediaRule(rule: Rule, condition: string) {
  const params = rule.parent?.type === 'atrule' ? rule.parent.params.replaceAll(' ', '') : '';
  const normalizedCondition = condition.replaceAll(' ', '');
  const matchesCondition =
    params.includes(normalizedCondition) ||
    (normalizedCondition === 'max-width:768px' && params.includes('width<=768px'));

  return rule.parent?.type === 'atrule' && rule.parent.name === 'media' && matchesCondition;
}

describe('surface and layout compiled styles', () => {
  it('collapses multi-column grids at the shared mobile breakpoint', async () => {
    const stylesheet = await buildComponentStylesheet('I9kGrid');
    let mobileRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (
        rule.selector.includes('.i9k-grid--columns-2') &&
        rule.selector.includes('.i9k-grid--columns-3') &&
        rule.selector.includes('.i9k-grid--columns-auto') &&
        isMediaRule(rule, 'max-width: 768px')
      ) {
        mobileRule = rule;
      }
    });

    expect(mobileRule?.selector).toMatch(/\.i9k-grid--columns-2\[data-v-[^\]]+\]/);
    expect(mobileRule && hasDeclaration(mobileRule, 'grid-template-columns', '1fr')).toBe(true);
  });

  it('keeps the tag decoration logical and its dark override scoped', async () => {
    const stylesheet = await buildComponentStylesheet('I9kBadge');
    let tagDecorationRule: Rule | undefined;
    let darkTagRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (rule.selector.includes('.i9k-badge__decoration')) {
        tagDecorationRule = rule;
      }
      if (rule.selector.includes('.dark') && rule.selector.includes('.i9k-badge--tag')) {
        darkTagRule = rule;
      }
    });

    expect(tagDecorationRule?.selector).toMatch(/\.i9k-badge__decoration\[data-v-[^\]]+\]/);
    expect(
      tagDecorationRule &&
        hasDeclaration(tagDecorationRule, 'margin-inline-end', 'var(--spacing-1)'),
    ).toBe(true);
    expect(darkTagRule?.selector).toMatch(/\.dark \.i9k-badge--tag/);
    expect(
      darkTagRule && hasDeclaration(darkTagRule, 'background', 'var(--white-color-alpha-05)'),
    ).toBe(true);
  });

  it('preserves the legacy medium badge line height', async () => {
    const stylesheet = await buildComponentStylesheet('I9kBadge');
    let badgeRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (
        /^\.i9k-badge\[data-v-[^\]]+\]$/.test(rule.selector) &&
        hasDeclaration(rule, 'line-height', '1.5')
      ) {
        badgeRule = rule;
      }
    });

    expect(badgeRule && hasDeclaration(badgeRule, 'line-height', '1.5')).toBe(true);
  });

  it('connects body text sizes to the shared typography tokens', async () => {
    const stylesheet = await buildComponentStylesheet('I9kText');
    let textRule: Rule | undefined;
    let smallTextRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (/^\.i9k-text\[data-v-[^\]]+\]$/.test(rule.selector)) textRule = rule;
      if (/^\.i9k-text--sm\[data-v-[^\]]+\]$/.test(rule.selector)) smallTextRule = rule;
    });

    expect(textRule && hasDeclaration(textRule, '--i9k-text-font-size', 'var(--text-size-2)')).toBe(
      true,
    );
    expect(
      smallTextRule && hasDeclaration(smallTextRule, '--i9k-text-font-size', 'var(--text-size-1)'),
    ).toBe(true);
  });

  it('removes Panel transitions for reduced motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kPanel');
    let reducedMotionRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (
        rule.selector.includes('.i9k-panel') &&
        isMediaRule(rule, 'prefers-reduced-motion: reduce') &&
        hasDeclaration(rule, 'transition', 'none')
      ) {
        reducedMotionRule = rule;
      }
    });

    expect(reducedMotionRule?.selector).toMatch(/\.i9k-panel\[data-v-[^\]]+\]/);
  });

  it('removes the flat Panel border instead of reserving transparent space', async () => {
    const stylesheet = await buildComponentStylesheet('I9kPanel');
    let flatRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (rule.selector.includes('.i9k-panel--flat')) flatRule = rule;
    });

    expect(flatRule?.selector).toMatch(/\.i9k-panel--flat\[data-v-[^\]]+\]/);
    expect(flatRule && hasDeclaration(flatRule, 'border', 'none')).toBe(true);
  });

  it('pins PageContainer to the safe mobile gutter', async () => {
    const stylesheet = await buildComponentStylesheet('I9kPageContainer');
    let mobileRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (
        rule.selector.includes('.i9k-page-container') &&
        isMediaRule(rule, 'max-width: 768px') &&
        hasDeclaration(rule, '--i9k-page-container-gutter', 'var(--spacing-8)')
      ) {
        mobileRule = rule;
      }
    });

    expect(mobileRule?.selector).toMatch(/\.i9k-page-container\[data-v-[^\]]+\]/);
    expect(mobileRule && hasDeclaration(mobileRule, 'width', '100%')).toBe(true);
  });

  it('derives the PageContainer measure from the shared page column', async () => {
    const stylesheet = await buildComponentStylesheet('I9kPageContainer');
    let width: string | undefined;

    stylesheet.walkRules((rule) => {
      if (rule.selector.includes('.i9k-page-container') && rule.parent?.type !== 'atrule') {
        rule.walkDecls('width', (decl) => {
          width = decl.value;
        });
      }
    });

    expect(width).toContain('var(--container-width-md)');
  });

  it('pins Container to the shared column and the safe mobile gutter', async () => {
    const stylesheet = await buildComponentStylesheet('I9kContainer');
    let baseRule: Rule | undefined;
    let mobileRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (!rule.selector.includes('.i9k-container')) return;
      if (rule.parent?.type !== 'atrule') {
        if (hasDeclaration(rule, '--i9k-container-width', 'var(--container-width-md)')) {
          baseRule = rule;
        }
      } else if (
        isMediaRule(rule, 'max-width: 768px') &&
        hasDeclaration(rule, '--i9k-container-gutter', 'var(--spacing-8)')
      ) {
        mobileRule = rule;
      }
    });

    expect(baseRule?.selector).toMatch(/\.i9k-container\[data-v-[^\]]+\]/);
    expect(
      baseRule && hasDeclaration(baseRule, '--i9k-container-gutter', 'var(--container-gutter)'),
    ).toBe(true);
    expect(mobileRule?.selector).toMatch(/\.i9k-container\[data-v-[^\]]+\]/);
  });
});
