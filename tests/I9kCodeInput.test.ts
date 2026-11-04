import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kCodeInput from '../src/components/I9kCodeInput.vue';

function mountInput(props: Record<string, unknown> = {}) {
  return mount(I9kCodeInput, { props: { modelValue: '', label: 'Sign-in code', ...props } });
}

function paste(wrapper: VueWrapper, text: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true });

  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
  wrapper.get('input').element.dispatchEvent(event);

  return event;
}

describe('I9kCodeInput', () => {
  it.each(['482 913', 'Your code is 482-913.'])('keeps every digit of a real paste: %s', (text) => {
    const wrapper = mountInput();
    const event = paste(wrapper, text);

    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['482913']]);
    expect(wrapper.emitted('complete')).toEqual([['482913']]);
  });

  it('keeps only digits from a paste', async () => {
    const wrapper = mountInput();

    await wrapper.get('input').setValue('482 913');

    expect(wrapper.emitted('update:modelValue')).toEqual([['482913']]);
    expect(wrapper.emitted('complete')).toEqual([['482913']]);
  });

  it('ignores letters', async () => {
    const wrapper = mountInput();

    await wrapper.get('input').setValue('a1b2');

    expect(wrapper.emitted('update:modelValue')).toEqual([['12']]);
    expect(wrapper.emitted('complete')).toBeUndefined();
  });

  it('truncates at length', async () => {
    const wrapper = mountInput();

    await wrapper.get('input').setValue('1234567');

    expect(wrapper.emitted('update:modelValue')).toEqual([['123456']]);
  });

  it('honours a custom length', async () => {
    const wrapper = mountInput({ length: 4 });

    await wrapper.get('input').setValue('123456');

    expect(wrapper.emitted('update:modelValue')).toEqual([['1234']]);
    expect(wrapper.emitted('complete')).toEqual([['1234']]);
    expect(wrapper.get('input').attributes('maxlength')).toBe('4');
    expect(wrapper.findAll('[data-i9k-code-box]')).toHaveLength(4);
  });

  it('emits complete once each time the model reaches length', async () => {
    const wrapper = mountInput();
    const input = wrapper.get('input');

    await input.setValue('123456');
    await wrapper.setProps({ modelValue: '123456' });
    await input.setValue('123456');
    expect(wrapper.emitted('complete')).toHaveLength(1);

    await wrapper.setProps({ modelValue: '12345' });
    await input.setValue('123456');
    expect(wrapper.emitted('complete')).toHaveLength(2);
  });

  it('has one labelled textbox', () => {
    const wrapper = mountInput();
    const input = wrapper.get('input');
    const label = wrapper.get(`label[for="${input.attributes('id')}"]`);

    expect(wrapper.findAll('input, textarea, select')).toHaveLength(1);
    expect(label.text()).toBe('Sign-in code');
  });

  it('autocomplete is one-time-code', () => {
    const input = mountInput().get('input');

    expect(input.attributes('autocomplete')).toBe('one-time-code');
    expect(input.attributes('inputmode')).toBe('numeric');
    expect(input.attributes('pattern')).toBe('[0-9]*');
    expect(input.attributes('maxlength')).toBe('6');
    expect(input.attributes('dir')).toBe('ltr');
  });

  it('draws the model into aria-hidden boxes', () => {
    const wrapper = mountInput({ modelValue: '48' });
    const boxes = wrapper.findAll('[data-i9k-code-box]');

    expect(boxes.map((box) => box.text())).toEqual(['4', '8', '', '', '', '']);
    expect(wrapper.get('[data-i9k-code-boxes]').attributes('aria-hidden')).toBe('true');
  });

  it('sets aria-invalid and disabled', () => {
    const input = mountInput({ invalid: true, disabled: true }).get('input');

    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('re-emits focus and blur', async () => {
    const wrapper = mountInput();

    await wrapper.get('input').trigger('focus');
    await wrapper.get('input').trigger('blur');

    expect(wrapper.emitted('focus')).toHaveLength(1);
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });
});
