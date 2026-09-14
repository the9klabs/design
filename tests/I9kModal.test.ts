import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import I9kModal from '../src/components/I9kModal.vue';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function mountModal(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(I9kModal, {
    props: { title: 'Edit module', closeLabel: 'Close dialog', ...props },
    slots: { default: '<input name="title" />', ...slots },
    attachTo: document.body,
  });
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

  it('uses showModal when the browser provides it', async () => {
    const showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value: showModal,
      configurable: true,
    });
    const wrapper = mountModal({ open: true });
    await wrapper.vm.$nextTick();
    expect(showModal).toHaveBeenCalledTimes(1);
    delete (HTMLDialogElement.prototype as { showModal?: unknown }).showModal;
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
});
