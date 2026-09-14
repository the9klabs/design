import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kToast from '../src/components/I9kToast.vue';

const meta = {
  title: 'Components/I9kToast',
  component: I9kToast,
  args: { variant: 'info' },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kToast },
    setup: () => ({ args }),
    template: '<I9kToast v-bind="args">تم الحفظ بنجاح</I9kToast>',
  }),
};

export const Warning: Story = {
  args: { variant: 'warning' },
  render: (args) => ({
    components: { I9kToast },
    setup: () => ({ args }),
    template: '<I9kToast v-bind="args">لم تُحفظ التغييرات بعد</I9kToast>',
  }),
};

export const ErrorVariant: Story = {
  args: { variant: 'error' },
  render: (args) => ({
    components: { I9kToast },
    setup: () => ({ args }),
    template: '<I9kToast v-bind="args">تعذر إكمال العملية</I9kToast>',
  }),
};

export const Rtl: Story = {
  render: (args) => ({
    components: { I9kToast },
    setup: () => ({ args }),
    template: '<div lang="ar" dir="rtl"><I9kToast v-bind="args">تم الحفظ بنجاح</I9kToast></div>',
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kToast },
    template:
      '<div class="grid"><I9kToast size="sm">Small notification</I9kToast><I9kToast size="md">Medium notification</I9kToast><I9kToast size="lg">Large notification</I9kToast></div>',
  }),
};
