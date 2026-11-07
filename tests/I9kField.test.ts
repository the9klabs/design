import { defineComponent, h, onUnmounted } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import I9kField from '../src/components/I9kField.vue';
import { useI9kField } from '../src/composables/i9kField';

const RegisteredControl = defineComponent({
  setup() {
    const field = useI9kField();

    if (!field) {
      throw new Error('I9kField context is required.');
    }

    const unregister = field.registerControl();
    onUnmounted(unregister);

    return () => h('input', { id: field.controlId.value });
  },
});

describe('I9kField', () => {
  it('associates its label and hint with an arbitrary native control', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'Email', hint: 'Use your work address', controlId: 'email' },
      slots: {
        default: ({ controlId, describedBy, required }) =>
          h('input', { id: controlId, 'aria-describedby': describedBy, required }),
      },
    });

    expect(wrapper.get('label').attributes('for')).toBe('email');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(
      wrapper.get('.i9k-field__hint').attributes('id'),
    );
  });

  it('shows an alert error instead of the hint and exposes invalid slot state', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'Email', hint: 'Hint', error: 'Enter an email' },
      slots: {
        default: ({ controlId, describedBy, invalid }) =>
          h('input', { id: controlId, 'aria-describedby': describedBy, 'aria-invalid': invalid }),
      },
    });

    const error = wrapper.get('[role="alert"]');
    expect(wrapper.text()).not.toContain('Hint');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe(error.attributes('id'));
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const wrapper = mount(I9kField, {
      props: { label: 'Name', size },
      slots: { default: ({ controlId }) => h('input', { id: controlId }) },
    });

    expect(wrapper.classes()).toContain(`i9k-field--${size}`);
  });

  it('warns when it has no label content', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(I9kField, { slots: { default: '<input />' } });

    try {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('label'));
    } finally {
      wrapper.unmount();
      warn.mockRestore();
    }
  });

  it('warns when its label slot only contains whitespace', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(I9kField, {
      props: { label: 'Fallback label' },
      slots: { label: '  \n  ', default: () => h('input') },
    });

    try {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('label'));
    } finally {
      wrapper.unmount();
      warn.mockRestore();
    }
  });

  it('warns when more than one library control registers', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(I9kField, {
      props: { label: 'Email' },
      slots: { default: () => [h(RegisteredControl), h(RegisteredControl)] },
    });

    try {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('exactly one registered control'));
    } finally {
      wrapper.unmount();
      warn.mockRestore();
    }
  });

  it('draws an action beside its control, with the hint below both', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'Search', hint: 'An order reference', controlId: 'reference' },
      slots: {
        default: () => h('input', { id: 'reference' }),
        action: () => h('button', { type: 'submit' }, 'Find'),
      },
    });
    const row = wrapper.get('.i9k-field__row');

    expect(row.find('.i9k-field__control input#reference').exists()).toBe(true);
    expect(row.get('.i9k-field__action button').text()).toBe('Find');
    expect(row.find('#reference-hint').exists()).toBe(false);
    expect(wrapper.find('#reference-hint').exists()).toBe(true);
  });

  it('renders its control without a row when there is no action', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'Search', controlId: 'reference' },
      slots: { default: () => h('input', { id: 'reference' }) },
    });

    expect(wrapper.find('.i9k-field__row').exists()).toBe(false);
    expect(wrapper.find('input#reference').exists()).toBe(true);
  });
});
