import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveColor } from '../showcase/extract/tokens';

const themeStyles = readFileSync(resolve('src/styles/theme.css'), 'utf8');
const tokenStyles = readFileSync(resolve('src/styles/tokens.css'), 'utf8');

function hslLightnessToRgb(lightness: number) {
  const channel = lightness / 100;
  return [channel, channel, channel] as const;
}

function relativeLuminance(rgb: readonly number[]) {
  return rgb
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index]!, 0);
}

function contrastRatio(first: readonly number[], second: readonly number[]) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

describe('theme styles', () => {
  beforeEach(() => {
    const style = document.createElement('style');
    style.dataset.testTheme = '';
    style.textContent = `${tokenStyles}\n${themeStyles}`;
    document.head.append(style);
  });

  afterEach(() => {
    document.documentElement.className = '';
    document.body.replaceChildren();
    document.querySelector('[data-test-theme]')?.remove();
  });

  it('applies the dark theme colors to page and design-system surfaces', () => {
    document.documentElement.classList.add('dark');
    const root = document.createElement('main');
    root.classList.add('i9k-root');
    document.body.append(root);

    const bodyStyles = getComputedStyle(document.body);
    const rootStyles = getComputedStyle(root);

    expect(bodyStyles.backgroundColor).toBe('var(--theme-bg-color)');
    expect(bodyStyles.color).toBe('var(--theme-text-color)');
    expect(rootStyles.backgroundColor).toBe('var(--theme-bg-color)');
    expect(rootStyles.color).toBe('var(--theme-text-color)');
    expect(rootStyles.getPropertyValue('--theme-bg-color')).toBe('hsl(0 0% 6%)');
    expect(rootStyles.getPropertyValue('--theme-text-color')).toBe('hsl(0 0% 96%)');
  });

  it('applies the active theme background to the document root', () => {
    document.documentElement.classList.add('dark');

    expect(getComputedStyle(document.documentElement).backgroundColor).toBe(
      'var(--theme-bg-color)',
    );
  });

  it('keeps light-theme muted text at WCAG AA contrast', () => {
    document.documentElement.classList.add('light');
    const mutedToken = getComputedStyle(document.documentElement)
      .getPropertyValue('--text-color-light')
      .trim();
    const lightness = Number(mutedToken.match(/hsl\(0 0% (\d+)%\)/)?.[1]);

    expect(lightness).toBeGreaterThan(0);
    expect(contrastRatio(hslLightnessToRgb(lightness), [1, 1, 1])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(['light', 'dark'])('keeps semantic text and controls legible in %s mode', (theme) => {
    document.documentElement.className = theme;
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => {
      const resolved = resolveColor(styles.getPropertyValue(name));
      if (!resolved) throw new Error(`Unresolved color token: ${name}`);
      return [1, 3, 5].map(
        (offset) => Number.parseInt(resolved.hex.slice(offset, offset + 2), 16) / 255,
      );
    };
    const contrast = (foreground: string, background: string) =>
      contrastRatio(color(foreground), color(background));

    for (const background of ['--theme-bg-color', '--surface-color', '--surface-raised-color']) {
      for (const foreground of [
        '--theme-text-color',
        '--text-color-light',
        '--error-color',
        '--success-color',
      ]) {
        expect(
          contrast(foreground, background),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast('--focus-color', background)).toBeGreaterThanOrEqual(3);
      expect(contrast('--control-border-color', background)).toBeGreaterThanOrEqual(3);
    }
    expect(contrast('--error-color', '--error-bg-color')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('--success-color', '--success-bg-color')).toBeGreaterThanOrEqual(4.5);
    for (const background of [
      '--selected-bg-color',
      '--selected-hover-bg-color',
      '--selected-pressed-bg-color',
    ]) {
      expect(contrast('--primary-text-color', background), background).toBeGreaterThanOrEqual(4.5);
    }
    for (const background of [
      '--primary-color',
      '--primary-hover-color',
      '--primary-pressed-color',
    ]) {
      expect(contrast('--on-primary-color', background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('uses the dark color scheme for native controls', () => {
    document.documentElement.classList.add('dark');

    expect(getComputedStyle(document.documentElement).colorScheme).toBe('dark');
  });
});
