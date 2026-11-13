import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kPixelAvatar from '../src/components/I9kPixelAvatar.vue';

const meta = {
  title: 'Components/I9kPixelAvatar',
  component: I9kPixelAvatar,
  args: { seed: 'user_1', alt: '', size: 'md' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof I9kPixelAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Many: Story = {
  render: () => ({
    components: { I9kPixelAvatar },
    template: `<div style="display: flex; flex-wrap: wrap; gap: var(--spacing-5)"><I9kPixelAvatar v-for="n in 12" :key="n" :seed="'user_' + n" /></div>`,
  }),
};
