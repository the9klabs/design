import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import {
  createI9kToaster,
  useI9kToaster,
  useI9kToastSource,
  type I9kToastOptions,
} from '../src/composables/i9kToaster';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createI9kToaster', () => {
  it('shows a toast with defaults and returns its id', () => {
    const toaster = createI9kToaster();
    const id = toaster.show({ message: 'Saved.' });
    expect(toaster.toasts).toHaveLength(1);
    expect(toaster.toasts[0]).toMatchObject({
      id,
      variant: 'info',
      message: 'Saved.',
      detail: null,
      duration: 5000,
    });
    expect(toaster.latest?.id).toBe(id);
  });

  it('replaces a toast shown again under the same id with a new key', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'login', variant: 'error', message: 'Wrong password.' });
    const firstKey = toaster.toasts[0].key;
    toaster.show({ id: 'login', variant: 'error', message: 'Wrong password.' });
    expect(toaster.toasts).toHaveLength(1);
    expect(toaster.toasts[0].key).not.toBe(firstKey);
  });

  it('keeps at most the limit, dropping the oldest', () => {
    const toaster = createI9kToaster({ limit: 3 });
    ['a', 'b', 'c', 'd'].forEach((message) => toaster.show({ message }));
    expect(toaster.toasts.map((toast) => toast.message)).toEqual(['b', 'c', 'd']);
  });

  it('dismisses info and success after their duration, never warning or error', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'ok', variant: 'success', message: 'Saved.' });
    toaster.show({ id: 'warn', variant: 'warning', message: 'Careful.' });
    toaster.show({ id: 'err', variant: 'error', message: 'Failed.' });
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts.map((toast) => toast.id)).toEqual(['warn', 'err']);
    vi.advanceTimersByTime(60_000);
    expect(toaster.toasts).toHaveLength(2);
  });

  it('honours an explicit duration, including null', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'short', message: 'a', duration: 1000 });
    toaster.show({ id: 'sticky', message: 'b', duration: null });
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts.map((toast) => toast.id)).toEqual(['sticky']);
  });

  it('keeps a toast with a non-finite or over-long duration, as a sticky one', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'forever', message: 'a', duration: Infinity });
    toaster.show({ id: 'too-long', message: 'b', duration: 2 ** 31 });
    toaster.show({ id: 'nan', message: 'c', duration: NaN });
    expect(toaster.toasts.map((toast) => toast.duration)).toEqual([null, null, null]);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(toaster.toasts).toHaveLength(3);
  });

  it('still times out the longest duration a timer can hold', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'longest', message: 'a', duration: 2 ** 31 - 1 });
    vi.advanceTimersByTime(60_000);
    expect(toaster.toasts).toHaveLength(1);
    vi.advanceTimersByTime(2 ** 31 - 1);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('pauses and resumes the remaining time', () => {
    const toaster = createI9kToaster();
    toaster.show({ message: 'Saved.', duration: 1000 });
    vi.advanceTimersByTime(600);
    toaster.pause();
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts).toHaveLength(1);
    toaster.resume();
    vi.advanceTimersByTime(399);
    expect(toaster.toasts).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('starts no timer for a toast shown while paused until resumed', () => {
    const toaster = createI9kToaster();
    toaster.pause();
    toaster.show({ message: 'Saved.', duration: 1000 });
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts).toHaveLength(1);
    toaster.resume();
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('counts nested pauses', () => {
    const toaster = createI9kToaster();
    toaster.show({ message: 'Saved.', duration: 1000 });
    toaster.pause();
    toaster.pause();
    toaster.resume();
    vi.advanceTimersByTime(5000);
    expect(toaster.toasts).toHaveLength(1);
    toaster.resume();
    vi.advanceTimersByTime(1000);
    expect(toaster.toasts).toHaveLength(0);
  });

  it('clears latest when the latest toast is dismissed, not when an older one is', () => {
    const toaster = createI9kToaster();
    const older = toaster.show({ message: 'a', duration: null });
    const newer = toaster.show({ message: 'b', duration: null });
    toaster.dismiss(older);
    expect(toaster.latest?.id).toBe(newer);
    toaster.dismiss(newer);
    expect(toaster.latest).toBeNull();
  });

  it('clear removes every toast and timer', () => {
    const toaster = createI9kToaster();
    toaster.show({ message: 'a' });
    toaster.show({ message: 'b', variant: 'error' });
    toaster.clear();
    expect(toaster.toasts).toHaveLength(0);
    expect(toaster.latest).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('makes the deepest, then newest, host active', () => {
    const toaster = createI9kToaster();
    const page = toaster.registerHost(0);
    expect(toaster.activeHost).toBe(page);
    const modal = toaster.registerHost(1);
    const latePage = toaster.registerHost(0);
    expect(toaster.activeHost).toBe(modal);
    toaster.unregisterHost(modal);
    expect(toaster.activeHost).toBe(latePage);
    toaster.unregisterHost(latePage);
    expect(toaster.activeHost).toBe(page);
  });

  it('records the host that was active when each toast was shown', () => {
    const toaster = createI9kToaster();
    toaster.show({ id: 'early', message: 'Early.' });
    expect(toaster.latest?.host).toBeNull();
    const page = toaster.registerHost(0);
    toaster.show({ id: 'page', message: 'Page.' });
    expect(toaster.latest?.host).toBe(page);
    const modal = toaster.registerHost(1);
    toaster.show({ id: 'page', message: 'Again.' });
    expect(toaster.latest?.host).toBe(modal);
    expect(toaster.toasts.map((toast) => toast.host)).toEqual([null, modal]);
  });

  it('re-homes an unannounced toast from a leaving host to the next active one', () => {
    const toaster = createI9kToaster();
    const page = toaster.registerHost(0);
    const modal = toaster.registerHost(1);
    toaster.show({ id: 'save', variant: 'error', message: 'Failed.' });
    const { key } = toaster.latest!;
    toaster.unregisterHost(modal);
    // Deferred a macrotask, until the modal dialog has closed and the page is no longer inert.
    expect(toaster.latest?.host).toBe(modal);
    vi.runOnlyPendingTimers();
    expect(toaster.latest).toMatchObject({ id: 'save', key, host: page });
    expect(toaster.toasts).toMatchObject([{ id: 'save', key, host: page }]);
  });

  it('leaves a toast its leaving host announced where it was', () => {
    const toaster = createI9kToaster();
    toaster.registerHost(0);
    const modal = toaster.registerHost(1);
    toaster.show({ id: 'save', variant: 'error', message: 'Failed.' });
    toaster.markAnnounced(toaster.latest!.key);
    toaster.unregisterHost(modal);
    vi.runOnlyPendingTimers();
    expect(toaster.latest?.host).toBe(modal);
  });

  it('drops a pending re-home on clear', () => {
    const toaster = createI9kToaster();
    toaster.registerHost(0);
    const modal = toaster.registerHost(1);
    toaster.show({ id: 'save', variant: 'error', message: 'Failed.' });
    toaster.unregisterHost(modal);
    toaster.clear();
    expect(vi.getTimerCount()).toBe(0);
    expect(toaster.latest).toBeNull();
  });

  it('uses default labels and accepts overrides', () => {
    expect(createI9kToaster().labels).toEqual({ region: 'Notifications', dismiss: 'Dismiss' });
    expect(createI9kToaster({ labels: { region: 'الإشعارات' } }).labels.region).toBe('الإشعارات');
  });

  it('installs itself for injection', () => {
    const toaster = createI9kToaster();
    let injected: unknown = null;
    mount(
      defineComponent({
        setup() {
          injected = useI9kToaster();
          return () => null;
        },
      }),
      { global: { plugins: [toaster] } },
    );
    expect(injected).toBe(toaster);
  });

  it('useI9kToaster throws without a provided toaster', () => {
    const Probe = defineComponent({
      setup() {
        useI9kToaster();
        return () => null;
      },
    });
    expect(() => mount(Probe)).toThrow(/createI9kToaster/);
  });
});

describe('useI9kToastSource', () => {
  function mountSource(source: () => I9kToastOptions | null) {
    const toaster = createI9kToaster();
    const wrapper = mount(
      defineComponent({
        setup() {
          useI9kToastSource(source);
          return () => h('div');
        },
      }),
      { global: { plugins: [toaster] } },
    );
    return { toaster, wrapper };
  }

  it('shows, replaces and dismisses the toast the getter describes', async () => {
    const message = ref<string | null>(null);
    const { toaster } = mountSource(() =>
      message.value ? { id: 'login', variant: 'error', message: message.value } : null,
    );
    expect(toaster.toasts).toHaveLength(0);
    message.value = 'Wrong password.';
    await nextTick();
    expect(toaster.toasts).toMatchObject([{ id: 'login', message: 'Wrong password.' }]);
    message.value = 'Too many attempts.';
    await nextTick();
    expect(toaster.toasts).toMatchObject([{ id: 'login', message: 'Too many attempts.' }]);
    message.value = null;
    await nextTick();
    expect(toaster.toasts).toHaveLength(0);
  });

  it('shows immediately when the getter already has a value', () => {
    const { toaster } = mountSource(() => ({ variant: 'error', message: 'Failed.' }));
    expect(toaster.toasts).toHaveLength(1);
  });

  it('gives a source without an id its own id', async () => {
    const first = ref<string | null>('a');
    const toaster = createI9kToaster();
    mount(
      defineComponent({
        setup() {
          useI9kToastSource(() => (first.value ? { message: first.value, duration: null } : null));
          useI9kToastSource(() => ({ message: 'b', duration: null }));
          return () => null;
        },
      }),
      { global: { plugins: [toaster] } },
    );
    expect(toaster.toasts).toHaveLength(2);
    first.value = null;
    await nextTick();
    expect(toaster.toasts.map((toast) => toast.message)).toEqual(['b']);
  });

  it('counts sources per toaster, so two apps give their first source the same id', () => {
    const ids = [createI9kToaster(), createI9kToaster()].map((toaster) => {
      mount(
        defineComponent({
          setup() {
            useI9kToastSource(() => ({ message: 'a', duration: null }));
            return () => null;
          },
        }),
        { global: { plugins: [toaster] } },
      );
      return toaster.toasts[0].id;
    });
    expect(ids[0]).toBe(ids[1]);
  });

  it('dismisses its toast when the component unmounts', () => {
    const { toaster, wrapper } = mountSource(() => ({ variant: 'error', message: 'Failed.' }));
    wrapper.unmount();
    expect(toaster.toasts).toHaveLength(0);
  });

  it('dismisses the old id when the getter switches ids', async () => {
    const id = ref('a');
    const { toaster } = mountSource(() => ({ id: id.value, message: 'x', duration: null }));
    id.value = 'b';
    await nextTick();
    expect(toaster.toasts.map((toast) => toast.id)).toEqual(['b']);
  });
});
