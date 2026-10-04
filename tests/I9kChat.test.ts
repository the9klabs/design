import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import I9kChat from '../src/components/I9kChat.vue';
import I9kChatBubble from '../src/components/I9kChatBubble.vue';
import I9kChatComposer from '../src/components/I9kChatComposer.vue';
import I9kChatOptions from '../src/components/I9kChatOptions.vue';
import I9kNino from '../src/components/I9kNino.vue';

describe('I9kChat', () => {
  it('renders a feature panel with a header, a labelled live log and a footer', () => {
    const wrapper = mount(I9kChat, {
      props: { title: '9k Labs', logLabel: 'Conversation' },
      slots: { default: '<p>Hi</p>', footer: '<button>Answer</button>' },
    });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-chat', 'i9k-panel', 'i9k-panel--feature']),
    );
    expect(wrapper.find('.i9k-chat__title').text()).toBe('9k Labs');
    const log = wrapper.find('[role="log"]');
    expect(log.attributes('aria-label')).toBe('Conversation');
    expect(log.attributes('aria-live')).toBe('polite');
    expect(log.text()).toBe('Hi');
    expect(wrapper.find('.i9k-chat__footer').text()).toBe('Answer');
  });

  it('shows Nino with the given expression unless an avatar slot replaces him', () => {
    const nino = mount(I9kChat, { props: { logLabel: 'Chat', expression: 'thinking' } });
    expect(nino.findComponent(I9kNino).props('expression')).toBe('thinking');

    const custom = mount(I9kChat, {
      props: { logLabel: 'Chat' },
      slots: { avatar: '<img alt="" class="custom-avatar">' },
    });
    expect(custom.findComponent(I9kNino).exists()).toBe(false);
    expect(custom.find('.custom-avatar').exists()).toBe(true);
  });

  it('renders header actions and omits the footer when it has no content', () => {
    const wrapper = mount(I9kChat, {
      props: { logLabel: 'Chat' },
      slots: { actions: '<button class="restart">Start over</button>' },
    });

    expect(wrapper.find('.i9k-chat__header .restart').exists()).toBe(true);
    expect(wrapper.find('.i9k-chat__footer').exists()).toBe(false);
  });

  it('drops the log height cap when expanded', () => {
    const wrapper = mount(I9kChat, { props: { logLabel: 'Chat', expanded: true } });

    expect(wrapper.find('.i9k-chat__log').classes()).toContain('i9k-chat__log--expanded');
  });

  it('exposes scrollToEnd, which scrolls the log to its bottom', async () => {
    const wrapper = mount(I9kChat, { props: { logLabel: 'Chat' } });
    const log = wrapper.find('.i9k-chat__log').element as HTMLElement;
    log.scrollTo = vi.fn();

    await (wrapper.vm as unknown as { scrollToEnd: () => Promise<void> }).scrollToEnd();

    expect(log.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: log.scrollHeight }));
  });
});

describe('I9kChatBubble', () => {
  it('renders a bot bubble by default', () => {
    const wrapper = mount(I9kChatBubble, { slots: { default: 'Hello' } });

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['i9k-chat-bubble', 'i9k-chat-bubble--bot']),
    );
    expect(wrapper.find('.i9k-chat-bubble__body').text()).toBe('Hello');
  });

  it('renders a user bubble with a screen-reader speaker prefix and an after slot', () => {
    const wrapper = mount(I9kChatBubble, {
      props: { from: 'user', speakerLabel: 'You' },
      slots: { default: 'A website', after: '<button class="change">Change</button>' },
    });

    expect(wrapper.classes()).toContain('i9k-chat-bubble--user');
    expect(wrapper.find('.i9k-chat-bubble__speaker').text()).toBe('You:');
    expect(wrapper.find('.i9k-chat-bubble__body').element.textContent).toBe('You: A website');
    expect(wrapper.find('.i9k-chat-bubble__body').text()).toContain('A website');
    expect(wrapper.find('.change').exists()).toBe(true);
  });

  it('replaces the content with a labelled typing indicator', () => {
    const wrapper = mount(I9kChatBubble, {
      props: { typing: true, typingLabel: 'Typing…' },
      slots: { default: 'Hidden' },
    });

    const status = wrapper.find('[role="status"]');
    expect(status.attributes('aria-label')).toBe('Typing…');
    expect(wrapper.text()).not.toContain('Hidden');
  });

  it('spans the full width when wide', () => {
    const wrapper = mount(I9kChatBubble, { props: { wide: true } });

    expect(wrapper.classes()).toContain('i9k-chat-bubble--wide');
  });

  it('renders an editable bubble as a labelled button that emits edit', async () => {
    const wrapper = mount(I9kChatBubble, {
      props: { from: 'user', editable: true, editLabel: 'Change your answer' },
      slots: { default: 'Ismail' },
    });

    const button = wrapper.find('button.i9k-chat-bubble__body');
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Change your answer');
    await button.trigger('click');
    expect(wrapper.emitted('edit')).toHaveLength(1);
  });
});

describe('I9kChatOptions', () => {
  it('renders a labelled group and focuses its first control', () => {
    const wrapper = mount(I9kChatOptions, {
      props: { label: 'What are you building?' },
      slots: { default: '<button class="first">A</button><button>B</button>' },
      attachTo: document.body,
    });

    expect(wrapper.attributes('role')).toBe('group');
    expect(wrapper.attributes('aria-label')).toBe('What are you building?');
    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement?.className).toBe('first');
    wrapper.unmount();
  });
});

describe('I9kChatComposer', () => {
  const mountComposer = (props = {}) =>
    mount(I9kChatComposer, {
      props: { label: 'Your name', modelValue: '', ...props },
      attachTo: document.body,
    });

  it('renders a labelled single-line field and a disabled send button while empty', () => {
    const wrapper = mountComposer({ placeholder: 'Your name', sendLabel: 'Send' });

    const input = wrapper.find('input');
    expect(input.attributes('aria-label')).toBe('Your name');
    expect(input.attributes('placeholder')).toBe('Your name');
    const send = wrapper.find('button.i9k-chat-composer__send');
    expect(send.attributes('aria-label')).toBe('Send');
    expect(send.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('updates v-model and submits on Enter, ignoring blank input', async () => {
    const wrapper = mountComposer();
    const input = wrapper.find('input');

    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('submit')).toBeUndefined();

    await input.setValue('Ismail');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Ismail']);
    await wrapper.setProps({ modelValue: 'Ismail' });
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('submit')).toEqual([['Ismail']]);
    wrapper.unmount();
  });

  it('submits from the send button', async () => {
    const wrapper = mountComposer({ modelValue: 'Hello' });

    await wrapper.find('button.i9k-chat-composer__send').trigger('click');
    expect(wrapper.emitted('submit')).toEqual([['Hello']]);
    wrapper.unmount();
  });

  it('uses a textarea when multiline, where Shift+Enter does not submit', async () => {
    const wrapper = mountComposer({ multiline: true, modelValue: 'Line one' });
    const field = wrapper.find('textarea');

    await field.trigger('keydown', { key: 'Enter', shiftKey: true });
    expect(wrapper.emitted('submit')).toBeUndefined();
    await field.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('submit')).toEqual([['Line one']]);
    wrapper.unmount();
  });

  it('marks itself invalid, forwards maxlength and blocks input when disabled', async () => {
    const wrapper = mountComposer({
      invalid: true,
      maxlength: 100,
      disabled: true,
      modelValue: 'x',
    });
    const input = wrapper.find('input');

    expect(wrapper.classes()).toContain('i9k-chat-composer--invalid');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('maxlength')).toBe('100');
    expect(input.attributes('disabled')).toBeDefined();
    await wrapper.find('button.i9k-chat-composer__send').trigger('click');
    expect(wrapper.emitted('submit')).toBeUndefined();
    wrapper.unmount();
  });

  it('exposes focus', () => {
    const wrapper = mountComposer();

    (wrapper.vm as unknown as { focus: () => void }).focus();
    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });
});
