import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import I9kField from '../src/components/I9kField.vue';
import I9kInput from '../src/components/I9kInput.vue';

describe('I9kInput', () => {
  it('forwards native attributes to the input and emits its value', async () => {
    const wrapper = mount(I9kInput, {
      props: { modelValue: '', label: 'Email' },
      attrs: { name: 'email', autocomplete: 'email' },
    });
    const input = wrapper.get('input');

    expect(input.attributes('name')).toBe('email');
    expect(input.attributes('autocomplete')).toBe('email');
    expect(wrapper.attributes('name')).toBeUndefined();

    await input.setValue('person@example.com');
    expect(wrapper.emitted('update:modelValue')).toEqual([['person@example.com']]);
  });

  it('forwards the native size attribute to the input', () => {
    const wrapper = mount(I9kInput, {
      props: { modelValue: '', label: 'Search' },
      attrs: { size: 32 },
    });

    expect(wrapper.get('input').attributes('size')).toBe('32');
  });

  it('associates an error and suppresses the hint', () => {
    const wrapper = mount(I9kInput, {
      props: {
        modelValue: '',
        label: 'Email',
        hint: 'Use your work address',
        error: 'Enter a valid email',
      },
    });
    const input = wrapper.get('input');
    const error = wrapper.get('[role="alert"]');

    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
    expect(wrapper.text()).not.toContain('Use your work address');
  });

  it.each(['grammar', 'spelling', 'false', false])(
    'preserves explicit aria-invalid="%s" without a local or field error',
    (ariaInvalid) => {
      const wrapper = mount(I9kInput, {
        props: { modelValue: '', label: 'Email' },
        attrs: { 'aria-invalid': ariaInvalid },
      });

      expect(wrapper.get('input').attributes('aria-invalid')).toBe(String(ariaInvalid));
    },
  );

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const wrapper = mount(I9kInput, {
      props: { modelValue: '', label: 'Name', uiSize: size },
    });

    expect(wrapper.get('.i9k-field').classes()).toContain(`i9k-field--${size}`);
    expect(wrapper.get('input').classes()).toContain(`i9k-input--${size}`);
  });

  it('uses enclosing field semantics without duplicate field chrome', () => {
    const wrapper = mount(
      defineComponent({
        components: { I9kField, I9kInput },
        template:
          '<I9kField label="Email" hint="Work address" control-id="email" size="lg" required><I9kInput model-value="" aria-describedby="consumer-note" /></I9kField>',
      }),
    );
    const input = wrapper.get('input');

    expect(wrapper.findAll('.i9k-field')).toHaveLength(1);
    expect(input.attributes('id')).toBe('email');
    expect(input.attributes('aria-describedby')?.split(' ')).toEqual([
      'consumer-note',
      wrapper.get('.i9k-field__hint').attributes('id'),
    ]);
    expect(input.classes()).toContain('i9k-input--lg');
    expect(input.attributes('required')).toBeDefined();
  });

  it('deduplicates a consumer description ID that repeats the field description', () => {
    const wrapper = mount(
      defineComponent({
        components: { I9kField, I9kInput },
        template:
          '<I9kField label="Email" hint="Work address" control-id="email"><I9kInput model-value="" aria-describedby="email-hint" /></I9kField>',
      }),
    );

    expect(wrapper.get('input').attributes('aria-describedby')).toBe('email-hint');
  });

  it('ignores nested local hint and error chrome while preserving explicit ARIA attributes', () => {
    const withoutExplicitAria = mount(I9kField, {
      props: { label: 'Email' },
      slots: {
        default: () => h(I9kInput, { modelValue: '', hint: 'Local hint', error: 'Local error' }),
      },
    });
    const withExplicitAria = mount(I9kField, {
      props: { label: 'Email' },
      slots: {
        default: () =>
          h(I9kInput, {
            modelValue: '',
            hint: 'Local hint',
            error: 'Local error',
            'aria-describedby': 'consumer-note',
            'aria-invalid': 'true',
          }),
      },
    });

    expect(withoutExplicitAria.get('input').attributes('aria-describedby')).toBeUndefined();
    expect(withoutExplicitAria.get('input').attributes('aria-invalid')).toBeUndefined();
    expect(withoutExplicitAria.find('.i9k-field__hint').exists()).toBe(false);
    expect(withoutExplicitAria.find('[role="alert"]').exists()).toBe(false);
    expect(withExplicitAria.get('input').attributes('aria-describedby')).toBe('consumer-note');
    expect(withExplicitAria.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('lets an explicit input UI size override the field size', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'Name', size: 'lg' },
      slots: { default: () => h(I9kInput, { modelValue: '', uiSize: 'sm' }) },
    });

    expect(wrapper.get('input').classes()).toContain('i9k-input--sm');
  });

  it('warns when a field contains multiple library controls', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(I9kField, {
      props: { label: 'Names' },
      slots: {
        default: () => [h(I9kInput, { modelValue: '' }), h(I9kInput, { modelValue: '' })],
      },
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('exactly one registered control'));
    warn.mockRestore();
  });

  it('warns for an unnamed standalone input and a conflicting nested ID', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(I9kInput, { props: { modelValue: '' } });
    mount(I9kField, {
      props: { label: 'Email', controlId: 'email' },
      slots: { default: () => h(I9kInput, { modelValue: '', id: 'different-email' }) },
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('controlId'));
    warn.mockRestore();
  });

  it('draws an action beside the input, with the hint and error below both', () => {
    const wrapper = mount(I9kInput, {
      props: { modelValue: '', label: 'Coupon code', error: 'Unknown code' },
      slots: { action: () => h('button', { type: 'submit' }, 'Apply') },
    });
    const row = wrapper.get('.i9k-field__row');

    expect(row.find('input').exists()).toBe(true);
    expect(row.get('.i9k-field__action button').text()).toBe('Apply');
    expect(row.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toBe('Unknown code');
  });

  it('renders no action container without an action', () => {
    const wrapper = mount(I9kInput, { props: { modelValue: '', label: 'Email' } });

    expect(wrapper.find('.i9k-field__action').exists()).toBe(false);
  });
});
