import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kContainer from '../src/components/I9kContainer.vue';

describe('I9kContainer', () => {
  it('renders a medium div carrying only the container classes', () => {
    const wrapper = mount(I9kContainer, { slots: { default: '<h1>Courses</h1>' } });

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.get('h1').text()).toBe('Courses');
    expect(wrapper.classes()).toEqual(['i9k-container', 'i9k-container--md']);
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s column', (size) => {
    const wrapper = mount(I9kContainer, { props: { size } });

    expect(wrapper.classes()).toContain(`i9k-container--${size}`);
  });

  it('renders the chosen root and forwards attributes to it', () => {
    const wrapper = mount(I9kContainer, {
      props: { as: 'section' },
      attrs: { class: 'hero', 'aria-labelledby': 'hero-title', id: 'hero' },
    });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['hero', 'i9k-container']));
    expect(wrapper.attributes('aria-labelledby')).toBe('hero-title');
    expect(wrapper.attributes('id')).toBe('hero');
  });
});
