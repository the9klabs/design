import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import I9kModal from '../src/components/I9kModal.vue';

const mounted: { unmount: () => void }[] = [];

afterEach(() => {
  // Unmount, not just clear the body: a mounted modal keeps its document
  // keydown listener, which would leak into later tests.
  while (mounted.length) mounted.pop()!.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  const wrapper = mount(I9kModal, {
    props: { title: 'Edit module', closeLabel: 'Close dialog', ...props },
    slots: { default: '<input name="title" />', ...slots },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

describe('I9kModal', () => {
  it('renders no content while closed', () => {
    const wrapper = mountModal();
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('opens labelled by its title and described by its description', async () => {
    const wrapper = mountModal({ open: true, description: 'Both languages are required.' });
    await wrapper.vm.$nextTick();
    const dialog = wrapper.get('dialog');
    expect(dialog.attributes('open')).toBeDefined();
    const title = wrapper.get('h2');
    expect(title.text()).toBe('Edit module');
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'));
    expect(wrapper.get(`#${dialog.attributes('aria-describedby')}`).text()).toBe(
      'Both languages are required.',
    );
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('asks to close from its labelled close button', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    const close = wrapper.get('[data-i9k-modal-close]');
    expect(close.attributes('aria-label')).toBe('Close dialog');
    await close.trigger('click');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('asks to close on Escape (the dialog cancel event) and prevents the native close', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    const event = new Event('cancel', { cancelable: true });
    wrapper.get('dialog').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('ignores Escape and disables the close button while not dismissible', async () => {
    const wrapper = mountModal({ open: true, dismissible: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-i9k-modal-close]').attributes('disabled')).toBeDefined();
    wrapper.get('dialog').element.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('does not close when the backdrop (the dialog element itself) is clicked', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    await wrapper.get('dialog').trigger('click');
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('closes when the parent sets open to false and returns focus to the opener', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const wrapper = mountModal({ open: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    (wrapper.get('input').element as HTMLInputElement).focus();
    expect(document.activeElement).not.toBe(opener);
    await wrapper.setProps({ open: false });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('dialog').attributes('open')).toBeUndefined();
    expect(document.activeElement).toBe(opener);
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('renders the footer slot', async () => {
    const wrapper = mountModal({ open: true }, { footer: '<button>Save</button>' });
    await wrapper.vm.$nextTick();
    expect(wrapper.get('footer button').text()).toBe('Save');
  });

  it('cancels an Escape keydown while not dismissible, so the browser never starts a close', async () => {
    const wrapper = mountModal({ open: true, dismissible: false });
    await wrapper.vm.$nextTick();
    const blocked = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
      bubbles: true,
    });
    document.dispatchEvent(blocked);
    expect(blocked.defaultPrevented).toBe(true);

    await wrapper.setProps({ dismissible: true });
    const allowed = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
      bubbles: true,
    });
    document.dispatchEvent(allowed);
    expect(allowed.defaultPrevented).toBe(false);
  });
});

// jsdom has no showModal/close, so the tests above run the attribute fallback.
// These install stand-ins that behave like a browser: close() removes `open`
// and queues the `close` event as a task.
describe('I9kModal with a native dialog', () => {
  const prototype = HTMLDialogElement.prototype as {
    showModal?: () => void;
    close?: () => void;
  };

  beforeEach(() => {
    Object.defineProperty(prototype, 'showModal', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      }),
    });
    Object.defineProperty(prototype, 'close', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        if (!this.hasAttribute('open')) return;
        this.removeAttribute('open');
        setTimeout(() => this.dispatchEvent(new Event('close')), 0);
      }),
    });
  });

  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount();
    delete prototype.showModal;
    delete prototype.close;
    document.body.innerHTML = '';
  });

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  // The browser closing the dialog on its own: `open` goes, then `close` fires.
  function browserClose(element: HTMLDialogElement) {
    element.removeAttribute('open');
    element.dispatchEvent(new Event('close'));
  }

  it('opens with showModal and closes with close', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    expect(prototype.showModal).toHaveBeenCalledTimes(1);
    await wrapper.setProps({ open: false });
    await wrapper.vm.$nextTick();
    expect(prototype.close).toHaveBeenCalledTimes(1);
    await tick();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });

  it('forwards a browser-initiated close once, after a non-cancelable cancel', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    const element = wrapper.get('dialog').element as HTMLDialogElement;
    element.dispatchEvent(new Event('cancel', { cancelable: false }));
    browserClose(element);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('shows the dialog again when the browser closes it but the parent keeps it open', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const wrapper = mountModal({ open: false, dismissible: false });
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    const element = wrapper.get('dialog').element as HTMLDialogElement;

    browserClose(element);
    await wrapper.vm.$nextTick();
    expect(element.hasAttribute('open')).toBe(true);
    expect(wrapper.emitted('update:open')).toBeUndefined();

    // Focus still returns to the original opener, not to whatever was
    // focused when the dialog was shown again.
    (wrapper.get('input').element as HTMLInputElement).focus();
    await wrapper.setProps({ open: false });
    await wrapper.vm.$nextTick();
    expect(document.activeElement).toBe(opener);
  });

  it('ignores a stale close queued before the parent reopened the dialog', async () => {
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    await wrapper.setProps({ open: false });
    await wrapper.vm.$nextTick();
    await wrapper.setProps({ open: true });
    await wrapper.vm.$nextTick();
    await tick();
    expect(wrapper.get('dialog').attributes('open')).toBeDefined();
    expect(wrapper.emitted('update:open')).toBeUndefined();
  });
});
