import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { I9K_COUNTRY_DIAL_CODES, I9kPhoneInput as PublicI9kPhoneInput } from '../src';
import I9kField from '../src/components/I9kField.vue';
import I9kPhoneInput from '../src/components/I9kPhoneInput.vue';

const baseProps = { modelValue: '', country: 'EG', countryLabel: 'Country code' };

function mountStandalone(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  return mount(I9kPhoneInput, {
    props: { ...baseProps, ...props },
    attrs: { 'aria-label': 'Phone number', ...attrs },
  });
}

function optionTexts(wrapper: ReturnType<typeof mountStandalone>) {
  return wrapper.findAll('option').map((option) => option.text());
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('I9kPhoneInput', () => {
  it('is exported from the public entrypoint', () => {
    expect(PublicI9kPhoneInput).toBe(I9kPhoneInput);
  });

  it('shows the selected country as its flag and calling code', () => {
    const wrapper = mountStandalone({ country: 'AE' });

    expect(wrapper.get('.i9k-phone-input__face').text()).toBe('🇦🇪 +971');
  });

  it('offers every country by name in the given locale once mounted', async () => {
    const wrapper = mountStandalone({ locale: 'ar' });
    await nextTick();

    expect(wrapper.findAll('option')).toHaveLength(Object.keys(I9K_COUNTRY_DIAL_CODES).length);
    expect(optionTexts(wrapper)).toContain('مصر +20');
    expect(wrapper.get('select').element.value).toBe('EG');
  });

  it('orders countries by their localized name', async () => {
    // Jordan is الأردن and Egypt is مصر, so Arabic reverses the English order.
    const arabic = mountStandalone({ locale: 'ar' });
    const english = mountStandalone({ locale: 'en' });
    await nextTick();

    const arabicCodes = arabic.findAll('option').map((option) => option.attributes('value'));
    const englishCodes = english.findAll('option').map((option) => option.attributes('value'));
    expect(arabicCodes.indexOf('JO')).toBeLessThan(arabicCodes.indexOf('EG'));
    expect(englishCodes.indexOf('EG')).toBeLessThan(englishCodes.indexOf('JO'));
  });

  it.each(['ar', 'en'])('has a real %s name for every country it offers', async (locale) => {
    const wrapper = mountStandalone({ locale });
    await nextTick();

    // Intl.DisplayNames falls back to the bare region code for a region it
    // cannot name, which would show up here as "XK +383".
    const unnamed = Object.entries(I9K_COUNTRY_DIAL_CODES)
      .map(([code, dialCode]) => `${code} +${dialCode}`)
      .filter((fallback) => optionTexts(wrapper).includes(fallback));
    expect(unnamed).toEqual([]);
  });

  it('emits the country that is picked', async () => {
    const wrapper = mountStandalone();
    await nextTick();

    await wrapper.get('select').setValue('SA');

    expect(wrapper.emitted('update:country')).toEqual([['SA']]);
  });

  it('emits what is typed as the number', async () => {
    const wrapper = mountStandalone();

    await wrapper.get('input').setValue('0501234567');

    expect(wrapper.emitted('update:modelValue')).toEqual([['0501234567']]);
  });

  it('takes the field label, description and error for the number, and names the country itself', () => {
    const wrapper = mount(I9kField, {
      props: { label: 'WhatsApp number', error: 'That number does not look right.' },
      slots: { default: () => h(I9kPhoneInput, baseProps) },
    });
    const input = wrapper.get('input');
    const select = wrapper.get('select');

    expect(input.attributes('id')).toBe(wrapper.get('label').attributes('for'));
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.get('.i9k-field__error').attributes('id'),
    );
    expect(select.attributes('aria-label')).toBe('Country code');
    expect(select.attributes('id')).not.toBe(wrapper.get('label').attributes('for'));
  });

  it('forwards attributes to the number input and names the country select separately', () => {
    const wrapper = mountStandalone(
      { countryName: 'whatsappCountry' },
      { name: 'whatsapp', autocomplete: 'tel' },
    );

    expect(wrapper.get('input').attributes('name')).toBe('whatsapp');
    expect(wrapper.get('input').attributes('autocomplete')).toBe('tel');
    expect(wrapper.get('input').attributes('type')).toBe('tel');
    expect(wrapper.get('select').attributes('name')).toBe('whatsappCountry');
  });

  it('keeps the calling code before the number on right-to-left pages', () => {
    const wrapper = mountStandalone();

    expect(wrapper.get('.i9k-phone-input').attributes('dir')).toBe('ltr');
  });

  // The server's ICU and the browser's name and sort countries differently,
  // so a named list rendered on both would hydrate with each option's value
  // and label out of step.
  it('server-renders only the selected country, unnamed', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kPhoneInput, { ...baseProps, country: 'AE' }) }),
    );
    const options = html.match(/<option[^>]*>[^<]*<\/option>/g) ?? [];

    expect(options).toHaveLength(1);
    expect(options[0]).toMatch(/value="AE"/);
    expect(options[0]).toMatch(/\sselected/);
    expect(options[0]).toContain('+971');
  });

  it('hydrates without a mismatch and then lists every country', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const render = () =>
      h(I9kPhoneInput, { ...baseProps, country: 'AE', locale: 'ar', 'aria-label': 'Phone' });
    const container = document.createElement('div');
    container.innerHTML = await renderToString(createSSRApp({ render }));
    document.body.append(container);

    createSSRApp({ render }).mount(container);
    await nextTick();

    const mismatches = [...warn.mock.calls, ...error.mock.calls].filter((call) =>
      String(call[0]).includes('Hydration'),
    );
    expect(mismatches).toEqual([]);
    expect(container.querySelectorAll('option')).toHaveLength(
      Object.keys(I9K_COUNTRY_DIAL_CODES).length,
    );
    expect(container.querySelector('select')?.value).toBe('AE');
  });
});
