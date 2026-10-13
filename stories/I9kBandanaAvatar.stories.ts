import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kBandanaAvatar from '../src/components/I9kBandanaAvatar.vue';

// Stand-ins drawn inline, so the stories need no asset: a face whose eyes sit
// where the default bandana position expects them, and an orange band.
const src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23cfe6d8'/%3E%3Ccircle cx='114' cy='98' r='58' fill='%23e8b98a'/%3E%3Ccircle cx='94' cy='92' r='7' fill='%23222'/%3E%3Ccircle cx='136' cy='92' r='7' fill='%23222'/%3E%3Cpath d='M92 128q22 16 44 0' fill='none' stroke='%23222' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

const bandanaSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 330 100'%3E%3Cpath d='M0 22q165-30 330 0v56q-165 30-330 0z' fill='%23e85a02'/%3E%3Cellipse cx='96' cy='50' rx='26' ry='15' fill='%23fff'/%3E%3Cellipse cx='234' cy='50' rx='26' ry='15' fill='%23fff'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/I9kBandanaAvatar',
  component: I9kBandanaAvatar,
  args: { src, bandanaSrc, alt: 'A person', size: 'md' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'select', options: ['eager', 'lazy'] },
  },
} satisfies Meta<typeof I9kBandanaAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => ({
    components: { I9kBandanaAvatar },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: var(--spacing-11); align-items: center; padding: var(--spacing-8)">
        <I9kBandanaAvatar v-bind="args" size="sm" />
        <I9kBandanaAvatar v-bind="args" size="md" />
        <I9kBandanaAvatar v-bind="args" size="lg" />
      </div>
    `,
  }),
};
