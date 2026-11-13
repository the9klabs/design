import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kPixelAvatar from '../src/components/I9kPixelAvatar.vue';

function filledCells(seed: string): string[] {
  return mount(I9kPixelAvatar, { props: { seed } })
    .findAll('[data-cell][data-filled]')
    .map((cell) => cell.attributes('data-cell')!)
    .sort();
}

describe('I9kPixelAvatar', () => {
  it('is the same drawing for the same seed', () => {
    const a = mount(I9kPixelAvatar, { props: { seed: 'user_1' } });
    const b = mount(I9kPixelAvatar, { props: { seed: 'user_1' } });

    expect(a.html()).toBe(b.html());
  });

  it('differs between seeds', () => {
    expect(filledCells('user_1')).not.toEqual(filledCells('user_2'));
  });

  it('draws a five by five grid mirrored left to right', () => {
    const wrapper = mount(I9kPixelAvatar, { props: { seed: 'mirror-me' } });
    expect(wrapper.findAll('[data-cell]')).toHaveLength(25);

    const filled = new Set(filledCells('mirror-me'));
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        expect(filled.has(`${row}-${col}`)).toBe(filled.has(`${row}-${4 - col}`));
      }
    }
  });

  it('never draws an empty face', () => {
    for (let n = 0; n < 200; n += 1) expect(filledCells(`seed-${n}`).length).toBeGreaterThan(0);
  });

  it('is decorative without alt, and an image named by alt with one', () => {
    const decorative = mount(I9kPixelAvatar, { props: { seed: 'a' } }).get('svg');
    expect(decorative.attributes('aria-hidden')).toBe('true');
    expect(decorative.attributes('role')).toBeUndefined();

    const named = mount(I9kPixelAvatar, { props: { seed: 'a', alt: 'Avatar' } }).get('svg');
    expect(named.attributes('role')).toBe('img');
    expect(named.attributes('aria-label')).toBe('Avatar');
    expect(named.attributes('aria-hidden')).toBeUndefined();
  });

  it('carries no style attribute, so a strict Content-Security-Policy keeps it whole', () => {
    expect(mount(I9kPixelAvatar, { props: { seed: 'csp' } }).findAll('[style]')).toHaveLength(0);
  });
});
