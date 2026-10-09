import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kSticker from '../src/components/I9kSticker.vue';

const src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='6' y='6' width='88' height='88' rx='22' fill='%23fff'/%3E%3Crect x='14' y='14' width='72' height='72' rx='16' fill='%23eef0f6' stroke='%23111' stroke-width='5'/%3E%3Cpath d='M50 26l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z' fill='none' stroke='%23111' stroke-width='5' stroke-linejoin='round'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/I9kSticker',
  component: I9kSticker,
  args: { src, alt: 'Star', size: 'lg' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kSticker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    components: { I9kSticker },
    setup: () => ({ src }),
    template: `
      <div style="display: flex; gap: var(--spacing-8); align-items: center">
        <I9kSticker :src="src" alt="Star" size="sm" />
        <I9kSticker :src="src" alt="Star" size="md" />
        <I9kSticker :src="src" alt="Star" size="lg" />
      </div>
    `,
  }),
};

export const AsALink: Story = {
  render: () => ({
    components: { I9kSticker },
    setup: () => ({ src }),
    template: `<a href="#certificate"><I9kSticker :src="src" alt="View the certificate" size="lg" /></a>`,
  }),
};
