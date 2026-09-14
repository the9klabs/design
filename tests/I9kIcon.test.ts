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

describe('I9kIcon editor icons', () => {
  it.each(editorIcons)('ships the %s icon', (name) => {
    expect(I9K_ICON_NAMES).toContain(name);
    const wrapper = mount(I9kIcon, { props: { name } });
    expect(wrapper.get('svg').attributes('viewBox')).toBe('0 0 24 24');
    expect(wrapper.get('path').attributes('d')).toMatch(/^M/);
  });
});
