import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kButton from '../src/components/I9kButton.vue';
import I9kChat from '../src/components/I9kChat.vue';
import I9kChatBubble from '../src/components/I9kChatBubble.vue';
import I9kChatComposer from '../src/components/I9kChatComposer.vue';
import I9kChatOptions from '../src/components/I9kChatOptions.vue';

const meta = {
  title: 'Components/I9kChat',
  component: I9kChat,
  args: { title: '9k Labs', logLabel: 'Conversation', expression: 'idle', expanded: false },
  argTypes: {
    expression: {
      control: 'select',
      options: ['idle', 'happy', 'thinking', 'worried', 'surprised', 'eyes-closed'],
    },
  },
} satisfies Meta<typeof I9kChat>;

export default meta;
type Story = StoryObj<typeof meta>;

const components = { I9kButton, I9kChat, I9kChatBubble, I9kChatComposer, I9kChatOptions };

export const Options: Story = {
  render: (args) => ({
    components,
    setup: () => ({ args }),
    template: `
      <I9kChat v-bind="args">
        <template #actions><I9kButton size="sm" variant="link">↺ Start over</I9kButton></template>
        <I9kChatBubble>👋 Hi! A few quick questions, then a ballpark price.</I9kChatBubble>
        <I9kChatBubble>What are you looking to build?</I9kChatBubble>
        <I9kChatBubble from="user" speaker-label="You">AI automation
          <template #after><I9kButton size="sm" variant="link">↩ Change</I9kButton></template>
        </I9kChatBubble>
        <I9kChatBubble>How many of your systems does it connect to?</I9kChatBubble>
        <template #footer>
          <I9kChatOptions label="How many of your systems does it connect to?">
            <I9kButton>0–1</I9kButton>
            <I9kButton>2–3</I9kButton>
            <I9kButton>4 or more</I9kButton>
          </I9kChatOptions>
        </template>
      </I9kChat>
    `,
  }),
};

export const Composer: Story = {
  args: { title: 'Ismail', expression: 'thinking' },
  render: (args) => ({
    components,
    setup: () => ({ args, draft: ref('') }),
    template: `
      <I9kChat v-bind="args">
        <I9kChatBubble>Last thing — what do you need?</I9kChatBubble>
        <I9kChatBubble from="user" speaker-label="You" editable edit-label="Change your name">Ismail</I9kChatBubble>
        <I9kChatBubble typing />
        <template #footer>
          <I9kChatComposer v-model="draft" label="What do you need?" multiline placeholder="A couple of sentences is plenty" />
        </template>
      </I9kChat>
    `,
  }),
};
