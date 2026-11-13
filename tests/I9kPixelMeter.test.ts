import { mount } from '@vue/test-utils';
import { computeAccessibleName } from 'dom-accessibility-api';
import { describe, expect, it, vi } from 'vitest';

import I9kPixelMeter from '../src/components/I9kPixelMeter.vue';

function meter(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[role="meter"]').element;
}

describe('I9kPixelMeter', () => {
  it('exposes a named meter clamped to its range, out of four by default', () => {
    const wrapper = mount(I9kPixelMeter, {
      props: { value: 6, label: 'Tech level', valueText: 'Shipper' },
    });
    const root = meter(wrapper);

    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('4');
    expect(root.getAttribute('aria-valuenow')).toBe('4');
    expect(root.getAttribute('aria-valuetext')).toBe('Shipper');
    expect(computeAccessibleName(root)).toBe('Tech level');
  });

  it('reads a negative or unknown value as empty', () => {
    expect(
      meter(mount(I9kPixelMeter, { props: { value: -1, label: 'L' } })).getAttribute(
        'aria-valuenow',
      ),
    ).toBe('0');
    expect(
      meter(mount(I9kPixelMeter, { props: { value: Number.NaN, label: 'L' } })).getAttribute(
        'aria-valuenow',
      ),
    ).toBe('0');
  });

  it('draws one block per unit and marks the filled ones', () => {
    const wrapper = mount(I9kPixelMeter, { props: { value: 2, max: 4, label: 'Level' } });

    expect(wrapper.findAll('[data-pixel-block]')).toHaveLength(4);
    expect(wrapper.findAll('[data-pixel-block][data-filled]')).toHaveLength(2);
  });

  it('marks only the current block when blink is on', () => {
    const on = mount(I9kPixelMeter, { props: { value: 2, label: 'Level', blink: true } });
    const current = on.findAll('[data-current]');
    expect(current).toHaveLength(1);
    expect(
      on
        .findAll('[data-pixel-block]')
        .map((block) => block.element)
        .indexOf(current[0]!.element),
    ).toBe(1);

    expect(
      mount(I9kPixelMeter, { props: { value: 2, label: 'Level' } }).findAll('[data-current]'),
    ).toHaveLength(0);
    expect(
      mount(I9kPixelMeter, { props: { value: 0, label: 'Level', blink: true } }).findAll(
        '[data-current]',
      ),
    ).toHaveLength(0);
  });

  it('draws a continuous fill when segments is off', () => {
    const wrapper = mount(I9kPixelMeter, {
      props: { value: 21, max: 100, label: 'Progress', segments: false },
    });

    expect(meter(wrapper).getAttribute('aria-valuenow')).toBe('21');
    expect(wrapper.findAll('[data-pixel-block]')).toHaveLength(0);
    expect(wrapper.find('[data-pixel-fill]').exists()).toBe(true);
  });

  it('keeps the drawing out of the accessibility tree', () => {
    const wrapper = mount(I9kPixelMeter, { props: { value: 1, label: 'Level' } });

    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
  });

  it('renders the default and end slots around the drawing, outside the meter', () => {
    const wrapper = mount(I9kPixelMeter, {
      props: { value: 1, label: 'Level' },
      slots: { default: '<a href="/quiz">Vibe Coder</a>', end: '<span>1 / 4</span>' },
    });

    expect(wrapper.get('a').text()).toBe('Vibe Coder');
    expect(wrapper.text()).toContain('1 / 4');
    expect(wrapper.get('[role="meter"]').find('a').exists()).toBe(false);
  });

  it('carries no style attribute, so a strict Content-Security-Policy keeps it whole', () => {
    for (const props of [
      { value: 2, label: 'Level', blink: true },
      { value: 37, max: 100, label: 'Progress', segments: false },
    ]) {
      const wrapper = mount(I9kPixelMeter, { props });
      expect(wrapper.findAll('[style]')).toHaveLength(0);
    }
  });

  it('warns when the accessible label is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(I9kPixelMeter, { props: { value: 1, label: ' ' } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('non-empty label'));
    warn.mockRestore();
  });
});
