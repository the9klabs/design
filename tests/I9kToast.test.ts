import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kToast from '../src/components/I9kToast.vue';

describe('I9kToast', () => {
  it.each([
    ['info', 'status'],
    ['success', 'status'],
    ['warning', 'status'],
    ['error', 'alert'],
  ] as const)('renders %s with the %s role', (variant, role) => {
    const wrapper = mount(I9kToast, {
      props: { variant },
      slots: { default: variant },
    });

    expect(wrapper.attributes('role')).toBe(role);
    expect(wrapper.classes()).toContain(`i9k-toast--${variant}`);
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const wrapper = mount(I9kToast, {
      props: { size },
      slots: { default: size },
    });

    expect(wrapper.classes()).toContain(`i9k-toast--${size}`);
  });
});
