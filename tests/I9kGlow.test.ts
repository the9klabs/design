import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kGlow from '../src/components/I9kGlow.vue';
import type { I9kGlowPosition } from '../src/types/components';

describe('I9kGlow', () => {
  it('is a decorative layer hidden from assistive technology', () => {
    const wrapper = mount(I9kGlow);

    expect(wrapper.get('.i9k-glow').attributes('aria-hidden')).toBe('true');
  });

  it('sits at the inline end by default', () => {
    const wrapper = mount(I9kGlow);

    expect(wrapper.classes()).toContain('i9k-glow--end');
  });

  it.each<I9kGlowPosition>(['top', 'top-start', 'top-end', 'start', 'end', 'center'])(
    'places the glow at %s',
    (position) => {
      const wrapper = mount(I9kGlow, { props: { position } });

      expect(wrapper.classes()).toContain(`i9k-glow--${position}`);
    },
  );

  // Plain-JS consumers get no type check, so a typo must still leave a placed glow.
  it.each(['bottom', 'toString', ''])('falls back to the inline end for %j', (position) => {
    const wrapper = mount(I9kGlow, { props: { position: position as I9kGlowPosition } });

    expect(wrapper.classes()).toContain('i9k-glow--end');
    expect(wrapper.classes()).not.toContain(`i9k-glow--${position}`);
  });
});
