import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kInput from '../src/components/I9kInput.vue';
import I9kTabs from '../src/components/I9kTabs.vue';

const meta = {
  title: 'Components/I9kTabs',
  component: I9kTabs,
  args: {
    modelValue: 'login',
    tabs: [
      { value: 'login', label: 'I have an account' },
      { value: 'signup', label: 'New account' },
    ],
    label: 'Sign in',
    size: 'md',
    focusablePanel: false,
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kInput, I9kTabs },
    setup: () => {
      const mode = ref(args.modelValue);
      const email = ref('');
      const name = ref('');
      return { args, mode, email, name };
    },
    template: `<div style="max-width: 28rem">
      <I9kTabs v-bind="args" v-model="mode">
        <template #login><I9kInput v-model="email" label="Email" type="email" /></template>
        <template #signup><I9kInput v-model="name" label="Full name" /></template>
      </I9kTabs>
    </div>`,
  }),
};

export const RightToLeft: Story = {
  args: {
    tabs: [
      { value: 'login', label: 'لدي حساب' },
      { value: 'signup', label: 'حساب جديد' },
    ],
    label: 'تسجيل الدخول',
  },
  render: (args) => ({
    components: { I9kInput, I9kTabs },
    setup: () => {
      const mode = ref(args.modelValue);
      const email = ref('');
      const name = ref('');
      return { args, mode, email, name };
    },
    template: `<div lang="ar" dir="rtl" style="max-width: 28rem">
      <I9kTabs v-bind="args" v-model="mode">
        <template #login><I9kInput v-model="email" label="البريد الإلكتروني" type="email" /></template>
        <template #signup><I9kInput v-model="name" label="الاسم الكامل" /></template>
      </I9kTabs>
    </div>`,
  }),
};
