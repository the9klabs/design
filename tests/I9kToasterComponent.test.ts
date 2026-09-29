import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';

import I9kToaster from '../src/components/I9kToaster.vue';
import { createI9kToaster, useI9kToastSource } from '../src/composables/i9kToaster';

const mounted: { unmount: () => void }[] = [];
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
});

function mountToaster(props: Record<string, unknown> = {}) {
  const toaster = createI9kToaster();
  const wrapper = mount(I9kToaster, {
    props,
    global: { plugins: [toaster] },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return { toaster, wrapper };
}

describe('I9kToaster', () => {
  it('renders a labelled region with both live regions and no toasts', () => {
    const { wrapper } = mountToaster();
    const region = wrapper.get('section');
    expect(region.attributes('aria-label')).toBe('Notifications');
    expect(wrapper.get('[data-i9k-toaster-status]').attributes('role')).toBe('status');
    expect(wrapper.get('[data-i9k-toaster-alert]').attributes('role')).toBe('alert');
    expect(wrapper.findAll('[data-i9k-toast]')).toHaveLength(0);
  });

  it('renders each toast without a live role, with its detail in its own language', async () => {
    const { toaster, wrapper } = mountToaster();
    toaster.show({
      id: 'save',
      variant: 'error',
      message: 'Failed.',
      detail: 'السعر مطلوب',
      detailLang: 'ar',
      detailDir: 'rtl',
    });
    await nextTick();
    const item = wrapper.get('[data-i9k-toast="save"]');
    expect(item.attributes('data-i9k-toast-variant')).toBe('error');
    expect(item.find('[role]').exists()).toBe(false);
    const detail = item.get('[lang="ar"]');
    expect(detail.text()).toBe('السعر مطلوب');
    expect(detail.attributes('dir')).toBe('rtl');
  });

  it('announces a non-error toast politely and an error assertively', async () => {
    const { toaster, wrapper } = mountToaster();
    toaster.show({ variant: 'success', message: 'Saved.' });
    await nextTick();
    expect(wrapper.get('[data-i9k-toaster-status]').text()).toBe('Saved.');
    expect(wrapper.get('[data-i9k-toaster-alert]').text()).toBe('');
    toaster.show({ variant: 'error', message: 'Failed.', detail: 'Try again.' });
    await nextTick();
    expect(wrapper.get('[data-i9k-toaster-alert]').text()).toBe('Failed. Try again.');
    expect(wrapper.get('[data-i9k-toaster-status]').text()).toBe('');
  });

  it('re-creates the announcement when the same message is raised again', async () => {
    const { toaster, wrapper } = mountToaster();
    toaster.show({ id: 'login', variant: 'error', message: 'Wrong password.' });
    await nextTick();
    const first = wrapper.get('[data-i9k-toaster-alert] span').element;
    toaster.show({ id: 'login', variant: 'error', message: 'Wrong password.' });
    await nextTick();
    const second = wrapper.get('[data-i9k-toaster-alert] span').element;
    expect(second).not.toBe(first);
    expect(second.textContent).toBe('Wrong password.');
  });

  it('does not announce a toast raised before it was created', async () => {
    const toaster = createI9kToaster();
    toaster.show({ variant: 'error', message: 'Earlier.' });
    const wrapper = mount(I9kToaster, { global: { plugins: [toaster] }, attachTo: document.body });
    mounted.push(wrapper);
    await nextTick();
    expect(wrapper.findAll('[data-i9k-toast]')).toHaveLength(1);
    expect(wrapper.get('[data-i9k-toaster-alert]').text()).toBe('');
    toaster.show({ variant: 'error', message: 'Later.' });
    await nextTick();
    expect(wrapper.get('[data-i9k-toaster-alert]').text()).toBe('Later.');
  });

  it('dismisses a toast from its button, named by the dismiss label', async () => {
    const { toaster, wrapper } = mountToaster({ dismissLabel: 'إغلاق' });
    toaster.show({ id: 'a', variant: 'error', message: 'Failed.' });
    await nextTick();
    const button = wrapper.get('[data-i9k-toast-dismiss]');
    expect(button.attributes('aria-label')).toBe('إغلاق');
    await button.trigger('click');
    expect(toaster.toasts).toHaveLength(0);
    expect(wrapper.findAll('[data-i9k-toast]')).toHaveLength(0);
  });

  it('moves focus to the next dismiss button when a focused one dismisses its toast', async () => {
    const { toaster, wrapper } = mountToaster();
    toaster.show({ id: 'a', variant: 'error', message: 'First.' });
    toaster.show({ id: 'b', variant: 'error', message: 'Second.' });
    await nextTick();
    const first = wrapper.get('[data-i9k-toast="a"] [data-i9k-toast-dismiss]');
    (first.element as HTMLElement).focus();
    await first.trigger('click');
    await nextTick();
    expect(document.activeElement).toBe(
      wrapper.get('[data-i9k-toast="b"] [data-i9k-toast-dismiss]').element,
    );
  });

  it('resumes timers when the last toast is dismissed from its focused button', async () => {
    const toaster = createI9kToaster();
    // A real TransitionGroup, so the dismissed item lingers while it leaves, as in a browser.
    const wrapper = mount(I9kToaster, {
      global: { plugins: [toaster], stubs: { 'transition-group': false } },
      attachTo: document.body,
    });
    mounted.push(wrapper);
    toaster.show({ id: 'a', variant: 'error', message: 'Failed.' });
    await nextTick();
    const button = wrapper.get('[data-i9k-toast-dismiss]');
    (button.element as HTMLElement).focus();
    await button.trigger('click');
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 100));
    toaster.show({ variant: 'success', message: 'Saved.', duration: 20 });
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(toaster.toasts).toHaveLength(0);
  });

  describe('focus after the last toast is dismissed', () => {
    function mountWithOutside() {
      const outside = document.createElement('button');
      outside.textContent = 'Save';
      document.body.append(outside);
      const toaster = createI9kToaster();
      // A real TransitionGroup, so the dismissed item lingers while it leaves, as in a browser.
      const wrapper = mount(I9kToaster, {
        global: { plugins: [toaster], stubs: { 'transition-group': false } },
        attachTo: document.body,
      });
      mounted.push(wrapper);
      return { outside, toaster, wrapper };
    }

    const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

    function dismissButton(wrapper: ReturnType<typeof mount>, id: string) {
      return wrapper.get(`[data-i9k-toast="${id}"] [data-i9k-toast-dismiss]`);
    }

    it('returns focus to where it came from', async () => {
      const { outside, toaster, wrapper } = mountWithOutside();
      toaster.show({ id: 'a', variant: 'error', message: 'Failed.' });
      await nextTick();
      outside.focus();
      const button = dismissButton(wrapper, 'a');
      (button.element as HTMLElement).focus();
      await button.trigger('click');
      await nextTick();
      expect(document.activeElement).toBe(outside);
      await settle();
      expect(document.activeElement).toBe(outside);
      // No pause is left behind.
      toaster.show({ variant: 'success', message: 'Saved.', duration: 20 });
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(toaster.toasts).toHaveLength(0);
    });

    it('does not force focus anywhere when that element is gone', async () => {
      const { outside, toaster, wrapper } = mountWithOutside();
      toaster.show({ id: 'a', variant: 'error', message: 'Failed.' });
      await nextTick();
      outside.focus();
      const button = dismissButton(wrapper, 'a');
      (button.element as HTMLElement).focus();
      outside.remove();
      await button.trigger('click');
      await nextTick();
      await settle();
      expect(document.activeElement).toBe(document.body);
      toaster.show({ variant: 'success', message: 'Saved.', duration: 20 });
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(toaster.toasts).toHaveLength(0);
    });

    it('moves focus to the remaining toast first, then back to where it came from', async () => {
      const { outside, toaster, wrapper } = mountWithOutside();
      toaster.show({ id: 'a', variant: 'error', message: 'First.' });
      toaster.show({ id: 'b', variant: 'error', message: 'Second.' });
      await nextTick();
      outside.focus();
      const first = dismissButton(wrapper, 'a');
      (first.element as HTMLElement).focus();
      await first.trigger('click');
      await nextTick();
      const second = dismissButton(wrapper, 'b');
      expect(document.activeElement).toBe(second.element);
      await settle();
      await second.trigger('click');
      await nextTick();
      expect(document.activeElement).toBe(outside);
    });

    it('does not move focus when a toast leaves by its timer', async () => {
      const { outside, toaster, wrapper } = mountWithOutside();
      const input = document.createElement('input');
      document.body.append(input);
      toaster.show({ id: 'a', variant: 'success', message: 'Saved.', duration: 20 });
      await nextTick();
      // Focus came from the outside button, then genuinely left for the input.
      outside.focus();
      (dismissButton(wrapper, 'a').element as HTMLElement).focus();
      input.focus();
      await settle();
      expect(toaster.toasts).toHaveLength(0);
      expect(document.activeElement).toBe(input);
    });
  });

  it('resumes timers when the limit drops a focused toast', async () => {
    const toaster = createI9kToaster();
    const wrapper = mount(I9kToaster, {
      global: { plugins: [toaster], stubs: { 'transition-group': false } },
      attachTo: document.body,
    });
    mounted.push(wrapper);
    for (const id of ['a', 'b', 'c']) toaster.show({ id, variant: 'error', message: id });
    await nextTick();
    (wrapper.get('[data-i9k-toast="a"] [data-i9k-toast-dismiss]').element as HTMLElement).focus();
    toaster.show({ id: 'd', variant: 'success', message: 'Saved.', duration: 20 });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(toaster.toasts.map((toast) => toast.id)).toEqual(['b', 'c']);
  });

  it('resumes timers when the source clears a focused toast', async () => {
    const toaster = createI9kToaster();
    const error = ref<string | null>('Failed.');
    const wrapper = mount(
      defineComponent({
        setup() {
          useI9kToastSource(() =>
            error.value ? { id: 'save', variant: 'error', message: error.value } : null,
          );
          return () => h(I9kToaster);
        },
      }),
      {
        global: { plugins: [toaster], stubs: { 'transition-group': false } },
        attachTo: document.body,
      },
    );
    mounted.push(wrapper);
    await nextTick();
    (wrapper.get('[data-i9k-toast-dismiss]').element as HTMLElement).focus();
    error.value = null;
    await nextTick();
    toaster.show({ variant: 'success', message: 'Saved.', duration: 20 });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(toaster.toasts).toHaveLength(0);
  });

  it('reads its labels from the store unless given props', async () => {
    const { toaster, wrapper } = mountToaster();
    toaster.labels.region = 'الإشعارات';
    await nextTick();
    expect(wrapper.get('section').attributes('aria-label')).toBe('الإشعارات');
    await wrapper.setProps({ label: 'Alerts' });
    expect(wrapper.get('section').attributes('aria-label')).toBe('Alerts');
  });

  it('pauses timers while the pointer or focus is inside and resumes on unmount', async () => {
    const { toaster, wrapper } = mountToaster();
    let pauses = 0;
    const pause = toaster.pause;
    const resume = toaster.resume;
    toaster.pause = () => {
      pauses += 1;
      pause();
    };
    toaster.resume = () => {
      pauses -= 1;
      resume();
    };
    const section = wrapper.get('section');
    await section.trigger('pointerenter');
    expect(pauses).toBe(1);
    await section.trigger('focusin');
    await section.trigger('pointerleave');
    expect(pauses).toBe(1);
    wrapper.unmount();
    mounted.pop();
    expect(pauses).toBe(0);
  });

  describe('re-reading hover when a toast leaves', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    function stubHover(query: string) {
      vi.stubGlobal('matchMedia', (media: string) => ({
        media,
        matches: media === query,
        addEventListener() {},
        removeEventListener() {},
      }));
    }

    // A touch browser can keep :hover on the last tapped element after pointerleave.
    async function tapThenChange() {
      const { toaster, wrapper } = mountToaster();
      let pauses = 0;
      const pause = toaster.pause;
      const resume = toaster.resume;
      toaster.pause = () => {
        pauses += 1;
        pause();
      };
      toaster.resume = () => {
        pauses -= 1;
        resume();
      };
      toaster.show({ id: 'a', message: 'First.' });
      await nextTick();
      const section = wrapper.get('section');
      await section.trigger('pointerenter');
      await section.trigger('pointerleave');
      const matches = section.element.matches.bind(section.element);
      vi.spyOn(section.element, 'matches').mockImplementation(
        (selector: string) => selector === ':hover' || matches(selector),
      );
      toaster.dismiss('a');
      await nextTick();
      return pauses;
    }

    it('ignores a stuck :hover on a device without a hovering pointer', async () => {
      stubHover('(hover: none)');
      expect(await tapThenChange()).toBe(0);
    });

    it('still reads :hover on a device with a hovering pointer', async () => {
      stubHover('(hover: hover)');
      expect(await tapThenChange()).toBe(1);
    });
  });

  it('shows toasts only in the active host, while still announcing them', async () => {
    const { toaster, wrapper } = mountToaster();
    // A host one layer deeper, as an open I9kModal registers.
    const deeper = toaster.registerHost(1);
    toaster.show({ message: 'Saved.' });
    await nextTick();
    expect(wrapper.findAll('[data-i9k-toast]')).toHaveLength(0);
    expect(wrapper.get('[data-i9k-toaster-status]').text()).toBe('Saved.');
    toaster.unregisterHost(deeper);
    await nextTick();
    expect(wrapper.findAll('[data-i9k-toast]')).toHaveLength(1);
  });

  it('server-renders no toast and no style attribute', async () => {
    const toaster = createI9kToaster();
    toaster.show({ variant: 'error', message: 'Failed.' });
    const app = createSSRApp({ render: () => h(I9kToaster) });
    app.use(toaster);
    const html = await renderToString(app);
    expect(html).toContain('aria-label="Notifications"');
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('style=');
    expect(html).not.toContain('data-i9k-toast=');
  });
});
