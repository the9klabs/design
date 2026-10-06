import { mount } from '@vue/test-utils';
import { computeAccessibleName } from 'dom-accessibility-api';
import { describe, expect, it, vi } from 'vitest';

import I9kLevelMeter from '../src/components/I9kLevelMeter.vue';

function filledSteps(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('.i9k-level-meter__step--filled').length;
}

describe('I9kLevelMeter', () => {
  it('exposes a named meter with its value out of five by default', () => {
    const wrapper = mount(I9kLevelMeter, {
      props: { value: 3, label: 'Difficulty', valueText: 'Intermediate' },
    });
    const root = wrapper.element;

    expect(root.getAttribute('role')).toBe('meter');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('5');
    expect(root.getAttribute('aria-valuenow')).toBe('3');
    expect(root.getAttribute('aria-valuetext')).toBe('Intermediate');
    expect(computeAccessibleName(root)).toBe('Difficulty');
  });

  it('draws one step per level and fills as many as the value', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 2, label: 'Level' } });

    expect(wrapper.findAll('.i9k-level-meter__step')).toHaveLength(5);
    expect(filledSteps(wrapper)).toBe(2);
  });

  it('keeps the steps out of the accessibility tree', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 2, label: 'Level' } });

    expect(wrapper.get('.i9k-level-meter__steps').attributes('aria-hidden')).toBe('true');
  });

  it('shows the value text beside the steps so the level never rests on the drawing alone', () => {
    const wrapper = mount(I9kLevelMeter, {
      props: { value: 4, label: 'Difficulty', valueText: 'Advanced' },
    });

    expect(wrapper.get('.i9k-level-meter__text').text()).toBe('Advanced');
  });

  it('omits the text and the value text when none is given', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 1, label: 'Level' } });

    expect(wrapper.find('.i9k-level-meter__text').exists()).toBe(false);
    expect(wrapper.attributes('aria-valuetext')).toBeUndefined();
  });

  // A strict Content-Security-Policy (`style-src 'self'`) drops inline style
  // attributes, so the rising steps must not depend on one.
  it.each([5, 3, 8])('renders %s steps without any inline style attribute', (max) => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 2, max, label: 'Level' } });

    expect(wrapper.html()).not.toMatch(/\sstyle=/);
  });

  it('draws each step taller than the one before it', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 2, label: 'Level' } });
    const heights = wrapper
      .findAll('.i9k-level-meter__step')
      .map((step) => Number(step.attributes('height')));

    expect(heights.every((height, index) => index === 0 || height > heights[index - 1]!)).toBe(
      true,
    );
  });

  it('honours a custom maximum', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 2, max: 3, label: 'Level' } });

    expect(wrapper.attributes('aria-valuemax')).toBe('3');
    expect(wrapper.findAll('.i9k-level-meter__step')).toHaveLength(3);
    expect(filledSteps(wrapper)).toBe(2);
  });

  it.each([
    [7, 5],
    [-2, 0],
    [2.6, 3],
    [Number.NaN, 0],
  ])('clamps a value of %s to %s', (value, expected) => {
    const wrapper = mount(I9kLevelMeter, { props: { value, label: 'Level' } });

    expect(wrapper.attributes('aria-valuenow')).toBe(String(expected));
    expect(filledSteps(wrapper)).toBe(expected);
  });

  it('keeps at least one step when the maximum is not a positive whole number', () => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 1, max: 0, label: 'Level' } });

    expect(wrapper.attributes('aria-valuemax')).toBe('1');
    expect(wrapper.findAll('.i9k-level-meter__step')).toHaveLength(1);
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    const wrapper = mount(I9kLevelMeter, { props: { value: 1, label: 'Level', size } });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-level-meter', `i9k-level-meter--${size}`]),
    );
  });

  it('forwards attributes to the root', () => {
    const wrapper = mount(I9kLevelMeter, {
      props: { value: 1, label: 'Level' },
      attrs: { class: 'course-level', 'data-testid': 'level' },
    });

    expect(wrapper.classes()).toContain('course-level');
    expect(wrapper.attributes('data-testid')).toBe('level');
  });

  it('warns when the accessible label is empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(I9kLevelMeter, { props: { value: 1, label: ' ' } });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('non-empty label'));
    warn.mockRestore();
  });
});
