import { mount, type VueWrapper } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import I9kSidebarLayout from '../src/components/I9kSidebarLayout.vue';

// jsdom has never implemented window.matchMedia; the layout reads it on mount
// to tell the wide column from the narrow drawer.
let wide = true;
let listeners: (() => void)[] = [];

beforeEach(() => {
  wide = true;
  listeners = [];
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return wide;
    },
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_event: string, listener: () => void) => {
      listeners.push(listener);
    },
    removeEventListener: (_event: string, listener: () => void) => {
      listeners = listeners.filter((entry) => entry !== listener);
    },
    dispatchEvent: () => false,
  }));
});

const mounted: VueWrapper[] = [];

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

const slots = {
  bar: '<strong>Course</strong>',
  sidebar:
    '<ol><li><a href="#one">One</a></li><li><a href="#two" aria-current="page">Two</a></li></ol>',
  'sidebar-footer': '<p>Progress</p>',
  default: '<p>Lesson</p>',
};

function mountLayout(
  options: { props?: Record<string, unknown>; slots?: Record<string, string> } = {},
) {
  const wrapper = mount(I9kSidebarLayout, {
    props: {
      sidebarLabel: 'Course contents',
      toggleLabel: 'Course contents',
      closeLabel: 'Close course contents',
      ...options.props,
    },
    slots: options.slots ?? slots,
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

const toggle = (wrapper: VueWrapper) => wrapper.get('button[aria-label="Course contents"]');
const sidebar = (wrapper: VueWrapper) => wrapper.get('.i9k-sidebar-layout__sidebar');

async function resize(toWide: boolean) {
  wide = toWide;
  listeners.forEach((listener) => listener());
  await nextTick();
}

describe('I9kSidebarLayout', () => {
  it('frames the page in a banner, a named sidebar, a main area and an optional footer', () => {
    const wrapper = mountLayout({ slots: { ...slots, footer: '<p>Legal</p>' } });

    expect(wrapper.get('header').text()).toContain('Course');
    expect(wrapper.get('aside').attributes('aria-label')).toBe('Course contents');
    expect(wrapper.get('aside').text()).toContain('Progress');
    expect(wrapper.get('main').text()).toBe('Lesson');
    expect(wrapper.get('footer').text()).toBe('Legal');
  });

  it('renders neither a toggle nor a sidebar without sidebar content', () => {
    const wrapper = mountLayout({ slots: { default: '<p>Lesson</p>' } });

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('aside').exists()).toBe(false);
    expect(wrapper.find('footer').exists()).toBe(false);
  });

  describe('on a wide viewport', () => {
    it('hides and shows the sidebar column from the toggle', async () => {
      const wrapper = mountLayout();
      await nextTick();

      expect(toggle(wrapper).attributes('aria-expanded')).toBe('true');
      expect(toggle(wrapper).attributes('aria-controls')).toBe(sidebar(wrapper).attributes('id'));
      expect(sidebar(wrapper).attributes('hidden')).toBeUndefined();

      await toggle(wrapper).trigger('click');
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('false');
      expect(sidebar(wrapper).attributes('hidden')).toBeDefined();
      expect(wrapper.emitted('update:sidebarHidden')).toEqual([[true]]);

      await toggle(wrapper).trigger('click');
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('true');
      expect(sidebar(wrapper).attributes('hidden')).toBeUndefined();
    });

    it('follows a bound sidebarHidden', async () => {
      const wrapper = mountLayout({ props: { sidebarHidden: true } });
      await nextTick();
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('false');

      await wrapper.setProps({ sidebarHidden: false });
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('true');
    });

    it('never turns the sidebar into a dialog', async () => {
      const wrapper = mountLayout();
      await nextTick();
      await toggle(wrapper).trigger('click');

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('on a narrow viewport', () => {
    beforeEach(() => {
      wide = false;
    });

    async function openDrawer(wrapper: VueWrapper) {
      await nextTick();
      await toggle(wrapper).trigger('click');
      await nextTick();
    }

    it('keeps the drawer closed until the toggle opens it', async () => {
      const wrapper = mountLayout();
      await nextTick();

      expect(toggle(wrapper).attributes('aria-expanded')).toBe('false');
      expect(sidebar(wrapper).attributes('hidden')).toBeDefined();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('opens the sidebar as a modal dialog and moves focus into it', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);
      const dialog = wrapper.get('[role="dialog"]');

      expect(dialog.attributes('aria-modal')).toBe('true');
      expect(dialog.attributes('aria-label')).toBe('Course contents');
      expect(dialog.attributes('hidden')).toBeUndefined();
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('true');
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Close course contents');
      expect(wrapper.emitted('update:drawerOpen')).toEqual([[true]]);
    });

    it('makes the rest of the page inert and stops it scrolling while open', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);

      expect(wrapper.get('header').attributes('inert')).toBeDefined();
      expect(wrapper.get('main').element.closest('[inert]')).not.toBeNull();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('closes on Escape and gives focus back to the toggle', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await nextTick();
      await nextTick();

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(toggle(wrapper).attributes('aria-expanded')).toBe('false');
      expect(wrapper.get('header').attributes('inert')).toBeUndefined();
      expect(document.body.style.overflow).toBe('');
      expect(document.activeElement).toBe(toggle(wrapper).element);
    });

    it('closes from its close button and from the backdrop', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);
      await wrapper.get('button[aria-label="Close course contents"]').trigger('click');
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

      await openDrawer(wrapper);
      await wrapper.get('.i9k-sidebar-layout__backdrop').trigger('click');
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    });

    it('closes when a link inside it is followed', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);

      await wrapper.get('aside a').trigger('click');

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(wrapper.emitted('update:drawerOpen')?.at(-1)).toEqual([false]);
    });

    it('closes when the viewport widens', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);

      await resize(true);

      expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
      expect(sidebar(wrapper).attributes('hidden')).toBeUndefined();
      expect(document.body.style.overflow).toBe('');
    });

    it('releases the scroll lock and stops listening when unmounted open', async () => {
      const wrapper = mountLayout();
      await openDrawer(wrapper);

      mounted.splice(mounted.indexOf(wrapper), 1);
      wrapper.unmount();

      expect(document.body.style.overflow).toBe('');
      expect(listeners).toEqual([]);
    });
  });

  it('scrolls the sidebar itself, not the page, to the current item', async () => {
    // jsdom has no layout: give the scrolling region and the current item boxes.
    const box = (top: number, height: number) =>
      ({ top, bottom: top + height, height, left: 0, right: 0, width: 0, x: 0, y: top }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('i9k-sidebar-layout__scroll')) return box(0, 100);
      if (this.getAttribute('aria-current') === 'page') return box(300, 20);
      return box(0, 0);
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    const scrollTop = vi.spyOn(Element.prototype, 'scrollTop', 'set');

    mountLayout();
    await nextTick();
    await nextTick();

    // Centred: 300 (item top) - 0 (region top) - (100 - 20) / 2.
    expect(scrollTop).toHaveBeenCalledWith(260);
  });

  it('server-renders without inline styles, leaving the narrow drawer to the stylesheet', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            I9kSidebarLayout,
            { sidebarLabel: 'Course contents' },
            { sidebar: () => h('p', 'Outline'), default: () => h('p', 'Lesson') },
          ),
      }),
    );

    expect(html).not.toMatch(/\sstyle="/);
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toMatch(/i9k-sidebar-layout__sidebar"[^>]*\shidden/);
  });
});
