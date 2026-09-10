import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kButton from '../src/components/I9kButton.vue';
import I9kCluster from '../src/components/I9kCluster.vue';

const meta = {
  title: 'Components/I9kButton',
  component: I9kButton,
  args: { variant: 'default' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'link', 'filter', 'pagination', 'page'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kButton, I9kCluster },
    setup: () => ({ args }),
    template: '<I9kButton v-bind="args">Default button</I9kButton>',
  }),
};
export const Primary: Story = {
  args: { variant: 'primary' },
  render: (args) => ({
    components: { I9kButton, I9kCluster },
    setup: () => ({ args }),
    template: '<I9kButton v-bind="args">Primary action</I9kButton>',
  }),
};
export const States: Story = {
  render: () => ({
    components: { I9kButton, I9kCluster },
    template:
      '<I9kCluster><I9kButton>Default</I9kButton><I9kButton variant="primary">Primary</I9kButton><I9kButton variant="link">Link</I9kButton><I9kButton variant="filter" active>Selected</I9kButton><I9kButton disabled>Disabled</I9kButton><I9kButton variant="primary" disabled aria-busy="true">Saving…</I9kButton></I9kCluster>',
  }),
};

export const Sizes: Story = {
  args: {
    variant: 'link',
  },

  render: () => ({
    components: { I9kButton, I9kCluster },
    template:
      '<I9kCluster><I9kButton size="sm">Small</I9kButton><I9kButton size="md">Medium</I9kButton><I9kButton size="lg">Large</I9kButton></I9kCluster>',
  }),
};

export const Arabic: Story = {
  render: () => ({
    components: { I9kButton, I9kCluster },
    template: `<div lang="ar" dir="rtl"><I9kCluster>
      <I9kButton variant="primary">حفظ التغييرات</I9kButton>
      <I9kButton>إلغاء</I9kButton>
      <I9kButton variant="primary" disabled aria-busy="true">جارٍ الحفظ…</I9kButton>
    </I9kCluster></div>`,
  }),
};
