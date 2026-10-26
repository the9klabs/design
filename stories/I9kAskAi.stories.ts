import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kAskAi from '../src/components/I9kAskAi.vue';

const meta = {
  title: 'Components/I9kAskAi',
  component: I9kAskAi,
  args: {
    heading: 'Ask AI about 9k School',
    prompt: 'What is 9k School (https://9k.school)? What does it teach, and who is it for?',
  },
} satisfies Meta<typeof I9kAskAi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Arabic: Story = {
  args: {
    heading: 'اسأل الذكاء الاصطناعي عن 9k School',
    prompt: 'إيه هي 9k School (https://9k.school)؟',
  },
  render: (args) => ({
    components: { I9kAskAi },
    setup: () => ({ args }),
    template: '<div lang="ar" dir="rtl"><I9kAskAi v-bind="args" /></div>',
  }),
};
