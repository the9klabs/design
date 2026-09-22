import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { computeAccessibleName } from 'dom-accessibility-api';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, onMounted, onUnmounted } from 'vue';
import type { VNode } from 'vue';

import I9kTabs from '../src/components/I9kTabs.vue';
import type { I9kTabItem } from '../src/types/components';

const signInTabs: I9kTabItem[] = [
  { value: 'login', label: 'I have an account' },
  { value: 'signup', label: 'New account' },
];

const threeTabs: I9kTabItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];

const mounted: VueWrapper[] = [];

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

interface MountOptions {
  modelValue?: string;
  tabs?: I9kTabItem[];
  focusablePanel?: boolean;
  slots?: Record<string, string | ((props: { value: string }) => VNode)>;
  /** Wraps the component in an element with this dir attribute. */
  dir?: 'ltr' | 'rtl';
}

/** Mounts I9kTabs with its v-model driven the way a parent's v-model would drive it. */
function mountTabs(options: MountOptions = {}) {
  const host = document.createElement('div');
  if (options.dir) host.setAttribute('dir', options.dir);
  document.body.append(host);

  const tabs = options.tabs ?? signInTabs;
  const wrapper = mount(I9kTabs, {
    attachTo: host,
    props: {
      modelValue: options.modelValue ?? tabs[0].value,
      tabs,
      label: 'Sign in',
      ...(options.focusablePanel === undefined ? {} : { focusablePanel: options.focusablePanel }),
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    slots:
      options.slots ??
      Object.fromEntries(tabs.map((tab) => [tab.value, `<p>${tab.label} panel</p>`])),
  });
  mounted.push(wrapper);
  return wrapper;
}

const tabsOf = (wrapper: VueWrapper) => wrapper.findAll('[role="tab"]');
const selectedStates = (wrapper: VueWrapper) =>
  tabsOf(wrapper).map((tab) => tab.attributes('aria-selected'));

/** Dispatches a keydown on a tab and reports whether the component prevented its default. */
async function press(
  wrapper: VueWrapper,
  index: number,
  key: string,
  init: KeyboardEventInit = {},
) {
  const tab = tabsOf(wrapper)[index].element as HTMLElement;
  tab.focus();
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  tab.dispatchEvent(event);
  await nextTick();
  return event.defaultPrevented;
}

describe('I9kTabs', () => {
  it('names one tablist, labels each tab, and links the selected tab to its panel', () => {
    const wrapper = mountTabs();
    const tablists = wrapper.findAll('[role="tablist"]');
    const tabs = tabsOf(wrapper);
    const panel = wrapper.get('[role="tabpanel"]');

    expect(tablists).toHaveLength(1);
    expect(computeAccessibleName(tablists[0].element)).toBe('Sign in');
    expect(tabs.map((tab) => tab.text())).toEqual(['I have an account', 'New account']);
    expect(tabs.map((tab) => tab.element.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(tabs.map((tab) => tab.attributes('type'))).toEqual(['button', 'button']);
    expect(selectedStates(wrapper)).toEqual(['true', 'false']);

    expect(tabs[0].attributes('id')).toBeTruthy();
    expect(tabs[0].attributes('id')).not.toBe(tabs[1].attributes('id'));
    expect(tabs[0].attributes('aria-controls')).toBe(panel.attributes('id'));
    expect(tabs[1].attributes('aria-controls')).toBeUndefined();
    expect(panel.attributes('aria-labelledby')).toBe(tabs[0].attributes('id'));
    expect(computeAccessibleName(panel.element)).toBe('I have an account');
  });

  it('keeps only the selected tab in the tab order', async () => {
    const wrapper = mountTabs();
    expect(tabsOf(wrapper).map((tab) => tab.attributes('tabindex'))).toEqual(['0', '-1']);

    await tabsOf(wrapper)[1].trigger('click');

    expect(tabsOf(wrapper).map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0']);
  });

  it('renders only the selected panel, remounting content on every switch', async () => {
    const log: string[] = [];
    const probe = (name: string) =>
      defineComponent({
        props: { value: { type: String, required: true } },
        setup(props) {
          onMounted(() => log.push(`mounted ${name}`));
          onUnmounted(() => log.push(`unmounted ${name}`));
          return () => h('p', `${name} form for ${props.value}`);
        },
      });
    const LoginForm = probe('login');
    const SignupForm = probe('signup');
    const wrapper = mountTabs({
      slots: {
        login: ({ value }) => h(LoginForm, { value }),
        signup: ({ value }) => h(SignupForm, { value }),
      },
    });

    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1);
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('login form for login');
    expect(log).toEqual(['mounted login']);

    await tabsOf(wrapper)[1].trigger('click');

    expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(1);
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('signup form for signup');
    expect(log).toEqual(['mounted login', 'unmounted login', 'mounted signup']);

    await tabsOf(wrapper)[0].trigger('click');

    expect(log.slice(3)).toEqual(['unmounted signup', 'mounted login']);
  });

  it('selects a tab on click', async () => {
    const wrapper = mountTabs();

    await tabsOf(wrapper)[1].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['signup']]);
    expect(selectedStates(wrapper)).toEqual(['false', 'true']);
    expect(wrapper.get('[role="tabpanel"]').text()).toBe('New account panel');
  });

  it('emits nothing for a click on the tab that is already selected', async () => {
    const wrapper = mountTabs();

    await tabsOf(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('ignores a click on a disabled tab', async () => {
    const wrapper = mountTabs({
      tabs: [signInTabs[0], { ...signInTabs[1], disabled: true }],
    });
    const disabled = tabsOf(wrapper)[1];

    expect(disabled.attributes('disabled')).toBeDefined();
    await disabled.trigger('click');
    (disabled.element as HTMLButtonElement).click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(selectedStates(wrapper)).toEqual(['true', 'false']);
  });

  it('moves and selects with the arrow keys, wrapping at both ends, and focus follows', async () => {
    const wrapper = mountTabs({ tabs: threeTabs });

    expect(await press(wrapper, 0, 'ArrowRight')).toBe(true);
    expect(selectedStates(wrapper)).toEqual(['false', 'true', 'false']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[1].element);

    await press(wrapper, 1, 'ArrowRight');
    await press(wrapper, 2, 'ArrowRight');
    expect(selectedStates(wrapper)).toEqual(['true', 'false', 'false']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[0].element);

    expect(await press(wrapper, 0, 'ArrowLeft')).toBe(true);
    expect(selectedStates(wrapper)).toEqual(['false', 'false', 'true']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[2].element);

    expect(wrapper.emitted('update:modelValue')).toEqual([['two'], ['three'], ['one'], ['three']]);
  });

  it('goes to the first and last tab with Home and End', async () => {
    const wrapper = mountTabs({ tabs: threeTabs, modelValue: 'two' });

    expect(await press(wrapper, 1, 'End')).toBe(true);
    expect(selectedStates(wrapper)).toEqual(['false', 'false', 'true']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[2].element);

    expect(await press(wrapper, 2, 'Home')).toBe(true);
    expect(selectedStates(wrapper)).toEqual(['true', 'false', 'false']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[0].element);
  });

  it('skips disabled tabs with the arrow keys, Home, and End', async () => {
    const wrapper = mountTabs({
      tabs: [
        { value: 'first', label: 'First', disabled: true },
        { value: 'second', label: 'Second' },
        { value: 'third', label: 'Third', disabled: true },
        { value: 'fourth', label: 'Fourth' },
        { value: 'fifth', label: 'Fifth', disabled: true },
      ],
      modelValue: 'second',
    });

    await press(wrapper, 1, 'ArrowRight');
    expect(document.activeElement).toBe(tabsOf(wrapper)[3].element);

    await press(wrapper, 3, 'ArrowRight');
    expect(document.activeElement).toBe(tabsOf(wrapper)[1].element);

    await press(wrapper, 1, 'ArrowLeft');
    expect(document.activeElement).toBe(tabsOf(wrapper)[3].element);

    await press(wrapper, 3, 'Home');
    expect(document.activeElement).toBe(tabsOf(wrapper)[1].element);

    await press(wrapper, 1, 'End');
    expect(document.activeElement).toBe(tabsOf(wrapper)[3].element);

    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['fourth'],
      ['second'],
      ['fourth'],
      ['second'],
      ['fourth'],
    ]);
  });

  it('leaves every other key, and modified arrows, to the browser', async () => {
    const wrapper = mountTabs({ tabs: threeTabs });

    for (const key of ['ArrowDown', 'ArrowUp', 'Tab', 'a', 'PageDown']) {
      expect(await press(wrapper, 0, key), key).toBe(false);
    }
    expect(await press(wrapper, 0, 'ArrowLeft', { altKey: true })).toBe(false);
    expect(await press(wrapper, 0, 'ArrowLeft', { metaKey: true })).toBe(false);
    expect(await press(wrapper, 0, 'ArrowRight', { ctrlKey: true })).toBe(false);

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(selectedStates(wrapper)).toEqual(['true', 'false', 'false']);
  });

  it('mirrors the arrow keys in a right-to-left context', async () => {
    const wrapper = mountTabs({ tabs: threeTabs, dir: 'rtl' });

    await press(wrapper, 0, 'ArrowLeft');
    expect(selectedStates(wrapper)).toEqual(['false', 'true', 'false']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[1].element);

    await press(wrapper, 1, 'ArrowRight');
    await press(wrapper, 0, 'ArrowRight');
    expect(selectedStates(wrapper)).toEqual(['false', 'false', 'true']);
    expect(document.activeElement).toBe(tabsOf(wrapper)[2].element);
  });

  it('keeps the arrow keys unmirrored under an explicit ltr inside rtl', async () => {
    const outer = document.createElement('div');
    outer.setAttribute('dir', 'rtl');
    document.body.append(outer);
    const wrapper = mountTabs({ tabs: threeTabs, dir: 'ltr' });
    outer.append(wrapper.element.closest('[dir="ltr"]')!);

    await press(wrapper, 0, 'ArrowRight');

    expect(selectedStates(wrapper)).toEqual(['false', 'true', 'false']);
  });

  // The computed direction decides, not the attribute's spelling: upper-case
  // dir and a CSS direction mirror the arrows too.
  it.each([
    ['an upper-case dir attribute', (host: HTMLElement) => host.setAttribute('dir', 'RTL')],
    ['a CSS direction', (host: HTMLElement) => host.style.setProperty('direction', 'rtl')],
  ])('mirrors the arrow keys under %s', async (_label, makeRtl) => {
    const wrapper = mountTabs({ tabs: threeTabs });
    makeRtl(wrapper.element.parentElement as HTMLElement);

    await press(wrapper, 0, 'ArrowLeft');

    expect(selectedStates(wrapper)).toEqual(['false', 'true', 'false']);
  });

  it('shows the first enabled tab when the model names no enabled tab, without emitting', () => {
    const unknown = mountTabs({ modelValue: 'missing' });
    expect(selectedStates(unknown)).toEqual(['true', 'false']);
    expect(unknown.get('[role="tabpanel"]').text()).toBe('I have an account panel');
    expect(unknown.emitted('update:modelValue')).toBeUndefined();

    const disabledFirst = mountTabs({
      tabs: [{ ...signInTabs[0], disabled: true }, signInTabs[1]],
      modelValue: 'login',
    });
    expect(selectedStates(disabledFirst)).toEqual(['false', 'true']);
    expect(tabsOf(disabledFirst).map((tab) => tab.attributes('tabindex'))).toEqual(['-1', '0']);
    expect(disabledFirst.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe(
      tabsOf(disabledFirst)[1].attributes('id'),
    );
    expect(disabledFirst.emitted('update:modelValue')).toBeUndefined();
  });

  it('emits when the user selects the fallback tab, so the parent can catch up', async () => {
    const wrapper = mountTabs({ modelValue: 'missing' });

    await tabsOf(wrapper)[0].trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['login']]);
  });

  it('puts the panel in the tab order by default', () => {
    const wrapper = mountTabs();

    expect(wrapper.get('[role="tabpanel"]').attributes('tabindex')).toBe('0');
  });

  it('leaves the panel out of the tab order when focusablePanel is false', () => {
    const wrapper = mountTabs({ focusablePanel: false });

    expect(wrapper.get('[role="tabpanel"]').attributes('tabindex')).toBeUndefined();
  });
});
