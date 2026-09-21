import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import postcss, { type AtRule, type Root, type Rule } from 'postcss';
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

function findRule(stylesheet: Root, property: string, value: string, selectorPart: string) {
  let match: Rule | undefined;

  stylesheet.walkRules((rule) => {
    if (rule.selector.includes(selectorPart) && hasDeclaration(rule, property, value)) {
      match = rule;
    }
  });

  return match;
}

function declarations(rule: Rule | undefined) {
  const values = new Map<string, string>();

  rule?.walkDecls((decl) => {
    values.set(decl.prop, decl.value);
  });

  return values;
}

function isMediaRule(rule: Rule, query: string) {
  const parent = rule.parent;

  return parent?.type === 'atrule' && (parent as AtRule).params.includes(query);
}

type Rgba = [number, number, number, number];

const tokenSource = readFileSync(resolve('src/styles/tokens.css'), 'utf8');

function tokenValue(name: string) {
  const match = tokenSource.match(new RegExp(`${name}:\\s*([^;]+);`));

  if (!match) throw new Error(`tokens.css defines no ${name}`);
  return match[1].trim();
}

function parseHsl(value: string): Rgba {
  const match = value.match(/^hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%(?: \/ ([\d.]+))?\)$/);

  if (!match) throw new Error(`Cannot parse ${value}`);
  const [hue, saturation, lightness] = [
    Number(match[1]),
    Number(match[2]) / 100,
    Number(match[3]) / 100,
  ];
  const chroma = saturation * Math.min(lightness, 1 - lightness);
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12;
    return 255 * (lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };

  return [channel(0), channel(8), channel(4), match[4] === undefined ? 1 : Number(match[4])];
}

// Resolves a custom property value the way the browser does on the element
// that declares `scope`: a var() reads that element's own declarations first.
function resolveColor(value: string, scope: Map<string, string>, brand: Rgba): Rgba {
  const variable = value.match(/^var\((--[\w-]+)\)$/);

  if (variable) {
    const name = variable[1];
    if (name === '--i9k-section-bg') return brand;
    const declared = scope.get(name);
    return declared ? resolveColor(declared, scope, brand) : parseHsl(tokenValue(name));
  }

  const mix = value.match(/^color-mix\(in srgb,\s*(.+?)\s+([\d.]+)%,\s*(.+)\)$/);

  if (mix) {
    const first = resolveColor(mix[1], scope, brand);
    const share = Number(mix[2]) / 100;
    if (mix[3] === 'transparent') return [first[0], first[1], first[2], first[3] * share];
    const second = resolveColor(mix[3], scope, brand);
    return [0, 1, 2, 3].map((index) => first[index] * share + second[index] * (1 - share)) as Rgba;
  }

  return parseHsl(value);
}

function over(top: Rgba, bottom: Rgba): Rgba {
  return [0, 1, 2]
    .map((index) => top[index] * top[3] + bottom[index] * (1 - top[3]))
    .concat(1) as Rgba;
}

function contrast(first: Rgba, second: Rgba) {
  const luminance = ([red, green, blue]: Rgba) =>
    [red, green, blue]
      .map((channel) => channel / 255)
      .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

function isReducedMotionRule(rule: Rule) {
  const parent = rule.parent;

  return (
    parent?.type === 'atrule' &&
    (parent as AtRule).name === 'media' &&
    (parent as AtRule).params.includes('prefers-reduced-motion')
  );
}

describe('scoped existing component compiled styles', () => {
  it('disables the ProfileCard scoped transition for reduced motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kProfileCard');
    let reducedMotionRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (
        isReducedMotionRule(rule) &&
        rule.selector.includes('.i9k-profile-card') &&
        hasDeclaration(rule, 'transition', 'none')
      ) {
        reducedMotionRule = rule;
      }
    });

    expect(reducedMotionRule?.selector).toMatch(/^\.i9k-profile-card\[data-v-[^\]]+\]$/);
  });

  it('keeps the LinkCard RTL arrow scoped without overruling reduced motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kLinkCard');
    const orderedRules: Rule[] = [];
    let reducedMotionRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      orderedRules.push(rule);
      if (
        isReducedMotionRule(rule) &&
        rule.selector.includes('.link-card-arrow') &&
        hasDeclaration(rule, 'transform', 'none')
      ) {
        reducedMotionRule = rule;
      }
    });

    const rtlRule = findRule(
      stylesheet,
      'transform',
      'translate(-1px,-1px)scaleX(-1)',
      '[dir=rtl]',
    );
    const rtlSelector = rtlRule?.selector;
    const reducedArrowSelector = reducedMotionRule?.selector
      .split(',')
      .find((selector) => selector.includes('.link-card-arrow'));
    const restMirrorRule = orderedRules.find(
      (rule) =>
        !isReducedMotionRule(rule) &&
        rule.selector.includes('[dir=rtl]') &&
        !rule.selector.includes(':hover') &&
        hasDeclaration(rule, 'transform', 'scaleX(-1)'),
    );
    const reducedMirrorRule = orderedRules.find(
      (rule) =>
        isReducedMotionRule(rule) &&
        rule.selector.includes('[dir=rtl]') &&
        hasDeclaration(rule, 'transform', 'scaleX(-1)'),
    );

    expect(rtlSelector).toMatch(
      /\.link-card:hover \.link-card-arrow\[data-v-[^\]]+\]:where\(\[dir=rtl\] \*\)$/,
    );
    expect(reducedArrowSelector).toBe(rtlSelector?.replace(':where([dir=rtl] *)', ''));
    expect(orderedRules.indexOf(reducedMotionRule!)).toBeGreaterThan(
      orderedRules.indexOf(rtlRule!),
    );

    // The glyph is mirrored with scaleX, so reduced motion must drop the hover nudge
    // without also un-mirroring the arrow.
    expect(restMirrorRule?.selector).toMatch(
      /^\.link-card-arrow\[data-v-[^\]]+\]:where\(\[dir=rtl\] \*\)$/,
    );
    expect(reducedMirrorRule?.selector).toBe(rtlSelector);
    expect(orderedRules.indexOf(reducedMirrorRule!)).toBeGreaterThan(
      orderedRules.indexOf(reducedMotionRule!),
    );
  });

  it('retains TimelineCard scope attributes on RTL and dark ancestor-state selectors', async () => {
    const stylesheet = await buildComponentStylesheet('I9kTimelineCard');
    const rtlRailRule = findRule(stylesheet, 'transform', 'translate(5px)', '[dir=rtl]');
    const rtlTimeRule = findRule(stylesheet, 'transform-origin', '100%', '[dir=rtl]');
    const darkRailStartRule = findRule(
      stylesheet,
      'border-color',
      'var(--white-color-alpha-20)',
      '.dark',
    );
    const darkRailEndRule = findRule(
      stylesheet,
      'background-color',
      'var(--white-color-alpha-20)',
      '.dark',
    );

    expect(rtlRailRule?.selector).toMatch(
      /^\.i9k-timeline-card__rail\[data-v-[^\]]+\]:where\(\[dir=rtl\] \*\)$/,
    );
    expect(rtlTimeRule?.selector).toMatch(
      /^\.i9k-timeline-card__time\[data-v-[^\]]+\]:where\(\[dir=rtl\] \*\)$/,
    );
    expect(darkRailStartRule?.selector).toMatch(
      /^\.i9k-timeline-card__rail\[data-v-[^\]]+\]:where\(\.dark \*\):before$/,
    );
    expect(darkRailEndRule?.selector).toMatch(
      /^\.i9k-timeline-card__rail\[data-v-[^\]]+\]:where\(\.dark \*\):after$/,
    );
  });

  it('renders the TimelineCard slotted thumbnail image as a block', async () => {
    const stylesheet = await buildComponentStylesheet('I9kTimelineCard');
    const thumbnailRule = findRule(
      stylesheet,
      'object-fit',
      'cover',
      '.i9k-timeline-card__thumbnail img',
    );

    expect(thumbnailRule?.selector).toMatch(
      /^\.i9k-timeline-card__thumbnail img\[data-v-[^\]]+-s\]$/,
    );
    expect(thumbnailRule && hasDeclaration(thumbnailRule, 'display', 'block')).toBe(true);
  });

  it('limits the TimelineCard stretched title link to linked cards', async () => {
    const stylesheet = await buildComponentStylesheet('I9kTimelineCard');
    const stretchedLinkRule = findRule(stylesheet, 'inset', '0', '.i9k-timeline-card__title');

    expect(stretchedLinkRule?.selector).toMatch(
      /^\.i9k-timeline-card__card--linked \.i9k-timeline-card__title a\[data-v-[^\]]+-s\]:after$/,
    );
  });

  it('preserves the TimelineCard legacy radius at the default size', async () => {
    const stylesheet = await buildComponentStylesheet('I9kTimelineCard');
    const cardRule = findRule(stylesheet, 'border-radius', '15px', '.i9k-timeline-card__card');

    expect(cardRule?.selector).toMatch(/^\.i9k-timeline-card__card\[data-v-[^\]]+\]$/);
  });

  it('bleeds the full-width primary I9kSection with a border-image outset, not a 100vw box', async () => {
    const stylesheet = await buildComponentStylesheet('I9kSection');
    let bandRule: Rule | undefined;
    const viewportSizedBoxes: string[] = [];

    stylesheet.walkDecls((decl) => {
      if (decl.prop === 'border-image-outset' && decl.value.includes('100vw')) {
        bandRule = decl.parent as Rule;
      }
      if (/^(width|min-width|margin|margin-inline|margin-left|margin-right)$/.test(decl.prop)) {
        if (decl.value.includes('vw')) viewportSizedBoxes.push(`${decl.prop}: ${decl.value}`);
      }
    });
    const bandValue = (prop: string) =>
      bandRule?.nodes.find((node) => node.type === 'decl' && node.prop === prop)?.toString() ?? '';

    // Border-image outset is ink overflow: the band reaches the viewport edges
    // without widening the page, so no horizontal scrollbar appears.
    expect(bandRule?.selector).toContain('.i9k-section--primary');
    expect(bandRule?.selector).toContain('.i9k-section--full-width');
    expect(bandValue('border-image-source')).toContain('var(--i9k-section-bg)');
    // Without `fill` the image paints only the (zero-width) border, not the band.
    expect(bandValue('border-image-slice')).toContain('fill');
    // A second, background layer under the column would antialias a fractional
    // edge differently from the bleed and show a hairline where they meet.
    expect(bandValue('background-color')).toMatch(/:(transparent|#0000)$/);
    expect(viewportSizedBoxes).toEqual([]);
  });

  it('re-themes the primary I9kSection content, not its root, so the band stays green', async () => {
    const stylesheet = await buildComponentStylesheet('I9kSection');
    const rootRule = findRule(
      stylesheet,
      '--i9k-section-bg',
      'var(--primary-color)',
      '.i9k-section--primary',
    );
    const contentRule = findRule(
      stylesheet,
      '--focus-color',
      'var(--white-color)',
      '.i9k-section--primary',
    );

    // The root resolves the brand green before anything is remapped; remapping
    // --primary-color there would turn its own background white.
    expect(rootRule?.selector).toMatch(/^\.i9k-section--primary\[data-v-[^\]]+\]$/);
    expect(
      rootRule?.nodes.some((node) => node.type === 'decl' && node.prop === '--primary-color'),
    ).toBe(false);

    // Its header and body invert the tokens nested buttons, links and focus rings read.
    expect(contentRule?.selector).toContain('.i9k-section__header');
    expect(contentRule?.selector).toContain('.i9k-section__body');
    expect(
      contentRule && hasDeclaration(contentRule, '--primary-color', 'var(--white-color)'),
    ).toBe(true);
    expect(
      contentRule && hasDeclaration(contentRule, '--on-primary-color', 'var(--i9k-section-bg)'),
    ).toBe(true);
    expect(
      contentRule && hasDeclaration(contentRule, '--theme-text-color', 'var(--white-color)'),
    ).toBe(true);
  });

  it('keeps the text on every primary I9kSection surface at WCAG AA contrast', async () => {
    const stylesheet = await buildComponentStylesheet('I9kSection');
    const scope = declarations(
      findRule(stylesheet, '--focus-color', 'var(--white-color)', '.i9k-section--primary'),
    );
    const brand = parseHsl(tokenValue('--primary-color'));
    // [foreground, surface under it (none = the bare green), minimum ratio]
    const pairs: [string, string | null, number][] = [
      ['--text-color-light', null, 4.5],
      ['--text-color-light', '--surface-color', 4.5],
      ['--text-color-light', '--surface-raised-color', 4.5],
      ['--text-color-light', '--selected-bg-color', 4.5],
      ['--theme-text-color', '--surface-hover-color', 4.5],
      ['--theme-text-color', '--surface-sunken-color', 4.5],
      ['--theme-text-color', '--selected-hover-bg-color', 4.5],
      ['--theme-text-color', '--selected-pressed-bg-color', 4.5],
      ['--on-primary-color', '--primary-color', 4.5],
      ['--on-primary-color', '--primary-hover-color', 4.5],
      ['--on-primary-color', '--primary-pressed-color', 4.5],
      // Non-text UI: focus rings and control borders need 3:1.
      ['--focus-color', null, 3],
      ['--control-border-color', null, 3],
    ];
    const failures = pairs.flatMap(([foreground, surface, minimum]) => {
      const background = surface
        ? over(resolveColor(`var(${surface})`, scope, brand), brand)
        : brand;
      const ratio = contrast(
        over(resolveColor(`var(${foreground})`, scope, brand), background),
        background,
      );
      return ratio >= minimum
        ? []
        : [`${foreground} on ${surface ?? 'the green'}: ${ratio.toFixed(2)}:1`];
    });

    expect(failures).toEqual([]);
  });

  it('gives native controls on a primary I9kSection a dark color scheme', async () => {
    const stylesheet = await buildComponentStylesheet('I9kSection');
    const rootRule = findRule(
      stylesheet,
      '--i9k-section-bg',
      'var(--primary-color)',
      '.i9k-section--primary',
    );

    // In the light theme the green is still a dark surface: without this, a
    // select's option list draws the white option text on a light popup.
    expect(declarations(rootRule).get('color-scheme')).toBe('dark');
  });

  it('keeps the primary I9kSection delineated in forced colors', async () => {
    const stylesheet = await buildComponentStylesheet('I9kSection');
    const forcedRules: Rule[] = [];

    stylesheet.walkRules((rule) => {
      if (isMediaRule(rule, 'forced-colors')) forcedRules.push(rule);
    });
    const contained = forcedRules.find(
      (rule) =>
        rule.selector.includes('.i9k-section--primary') &&
        !rule.selector.includes('.i9k-section--full-width'),
    );
    const band = forcedRules.find((rule) => rule.selector.includes('.i9k-section--full-width'));

    // Forced colors drops the background fill but not the border-image, so the
    // contained section needs a system-colored edge and the band must drop its
    // green instead of leaving it behind system-colored text.
    expect(declarations(contained).get('border')?.toLowerCase()).toContain('canvastext');
    expect(declarations(band).get('border-image-source')).toBe('none');
  });

  it('stops the I9kGlow drift for reduced motion', async () => {
    const stylesheet = await buildComponentStylesheet('I9kGlow');
    let animatedRule: Rule | undefined;
    let reducedMotionRule: Rule | undefined;

    stylesheet.walkRules((rule) => {
      if (!rule.selector.includes('.i9k-glow__light')) return;
      const animation = declarations(rule).get('animation');
      if (isReducedMotionRule(rule) && animation === 'none') reducedMotionRule = rule;
      else if (!isReducedMotionRule(rule) && animation) animatedRule = rule;
    });

    expect(animatedRule).toBeDefined();
    expect(reducedMotionRule?.selector).toMatch(/^\.i9k-glow__light\[data-v-[^\]]+\]$/);
  });

  it('places I9kGlow with logical properties only, so start and end mirror in RTL', async () => {
    const stylesheet = await buildComponentStylesheet('I9kGlow');
    const physical: string[] = [];

    stylesheet.walkDecls((decl) => {
      if (/^(left|right|(margin|padding|inset)-(left|right))$/.test(decl.prop)) {
        physical.push(`${(decl.parent as Rule).selector} { ${decl.prop} }`);
      }
    });
    const endRule = findRule(
      stylesheet,
      'inset-inline-end',
      'calc(var(--i9k-glow-size) / -2)',
      '.i9k-glow--end',
    );

    expect(physical).toEqual([]);
    expect(endRule).toBeDefined();
  });
});
