import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kAvatar from '../src/components/I9kAvatar.vue';

const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e85a02'/%3E%3Ccircle cx='20' cy='20' r='10' fill='%234ade80'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/I9kAvatar',
  component: I9kAvatar,
  args: {
    src: picture,
  },
} satisfies Meta<typeof I9kAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Picture: Story = {};

export const Sizes: Story = {
  render: (args) => ({
    components: { I9kAvatar },
    setup: () => ({ args }),
    template: `<div style="display: flex; gap: 1rem; align-items: center">
  <I9kAvatar v-bind="args" size="sm" />
  <I9kAvatar v-bind="args" size="md" />
  <I9kAvatar v-bind="args" size="lg" />
</div>`,
  }),
};

export const Fallback: Story = {
  args: {
    src: null,
  },
  render: (args) => ({
    components: { I9kAvatar },
    setup: () => ({ args }),
    template: '<I9kAvatar v-bind="args">IK</I9kAvatar>',
  }),
};
