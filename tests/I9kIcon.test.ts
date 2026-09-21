import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kIcon from '../src/components/I9kIcon.vue';
import { I9K_ICON_NAMES } from '../src/types/icons';

const editorIcons = [
  'add',
  'edit',
  'delete',
  'close',
  'arrowUp',
  'arrowDown',
  'archive',
  'unarchive',
  'eye',
  'eyeOff',
  'warning',
] as const;

// Material's "menu": three horizontal bars, the sidebar and menu toggle glyph.
// The set's older `menu` key is Material's vertical kebab ("more options").
const BARS_PATH = 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z';

describe('I9kIcon bars icon', () => {
  it('ships three horizontal bars under the name bars', () => {
    expect(I9K_ICON_NAMES).toContain('bars');
    const wrapper = mount(I9kIcon, { props: { name: 'bars' } });
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 24 24');
    expect(wrapper.get('path').attributes('d')).toBe(BARS_PATH);
  });
});

describe('I9kIcon editor icons', () => {
  it.each(editorIcons)('ships the %s icon', (name) => {
    expect(I9K_ICON_NAMES).toContain(name);
    const wrapper = mount(I9kIcon, { props: { name } });
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 24 24');
    expect(wrapper.get('path').attributes('d')).toMatch(/^M/);
  });
});
