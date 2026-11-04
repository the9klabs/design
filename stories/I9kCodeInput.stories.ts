import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kCodeInput from '../src/components/I9kCodeInput.vue';

const meta = {
  title: 'Components/I9kCodeInput',
  component: I9kCodeInput,
  args: { modelValue: '', label: 'رمز الدخول', length: 6 },
} satisfies Meta<typeof I9kCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const render: Story['render'] = (args) => ({
  components: { I9kCodeInput },
  setup: () => ({ args, code: ref(args.modelValue) }),
  template: '<I9kCodeInput v-bind="args" v-model="code" />',
});

export const Default: Story = { render };

export const Invalid: Story = { args: { modelValue: '123456', invalid: true }, render };

export const Disabled: Story = { args: { modelValue: '123', disabled: true }, render };

export const Rtl: Story = {
  render: (args) => ({
    components: { I9kCodeInput },
    setup: () => ({ args, code: ref('') }),
    template: '<div lang="ar" dir="rtl"><I9kCodeInput v-bind="args" v-model="code" /></div>',
  }),
};
