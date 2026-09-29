import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { afterEach, describe, expect, it } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';

import I9kToaster from '../src/components/I9kToaster.vue';
import { createI9kToaster } from '../src/composables/i9kToaster';

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
