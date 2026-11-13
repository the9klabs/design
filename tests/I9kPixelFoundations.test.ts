import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Pixel accents are part of the design language (pixel accents foundation).
// These pin the published names other products build on, not how they look.
const tokens = readFileSync(resolve('src/styles/tokens.css'), 'utf8');
const primitives = readFileSync(resolve('src/styles/primitives.css'), 'utf8');

function block(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return '';
  return source.slice(start, source.indexOf('}', start));
}

describe('pixel accents foundation', () => {
  it('defines the monospace stack and the one pixel unit on :root', () => {
    const root = block(tokens, ':root');
    expect(root).toMatch(/--font-mono:[^;]*ui-monospace[^;]*monospace;/);
    expect(root).toMatch(/--pixel-size: 4px;/);
  });

  it('gives the empty pixel block a colour in both themes', () => {
    expect(block(tokens, 'html.light')).toMatch(/--pixel-track-color:/);
    expect(block(tokens, 'html.dark')).toMatch(/--pixel-track-color:/);
  });

  it('offers the notched corners and the numeric type as primitives', () => {
    expect(block(primitives, '.i9k-pixel-corners')).toMatch(/clip-path:[^;]*var\(--pixel-size\)/);
    const numeric = block(primitives, '.i9k-numeric');
    expect(numeric).toMatch(/font-family: var\(--font-mono\);/);
    expect(numeric).toMatch(/font-variant-numeric: tabular-nums;/);
    expect(numeric).not.toMatch(/direction/);
  });
});
