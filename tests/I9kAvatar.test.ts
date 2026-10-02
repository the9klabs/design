import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kAvatar from '../src/components/I9kAvatar.vue';

describe('I9kAvatar', () => {
  it('renders the picture it is given, decorative by default', () => {
    const wrapper = mount(I9kAvatar, { props: { src: 'data:image/svg+xml,%3Csvg/%3E' } });
    const img = wrapper.get('img');

    expect(img.attributes('src')).toBe('data:image/svg+xml,%3Csvg/%3E');
    expect(img.attributes('alt')).toBe('');
  });

  it('names the picture when given alt text', () => {
    const wrapper = mount(I9kAvatar, { props: { src: '/me.png', alt: 'Ismail' } });

    expect(wrapper.get('img').attributes('alt')).toBe('Ismail');
  });

  it('shows its fallback content when there is no picture', () => {
    const wrapper = mount(I9kAvatar, { slots: { default: 'IK' } });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toBe('IK');
  });

  it('passes attributes such as aria-hidden to its root', () => {
    const wrapper = mount(I9kAvatar, {
      props: { src: '/me.png' },
      attrs: { 'aria-hidden': 'true' },
    });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });
});
