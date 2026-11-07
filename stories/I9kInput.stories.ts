import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kButton from '../src/components/I9kButton.vue';
import I9kField from '../src/components/I9kField.vue';
import I9kInput from '../src/components/I9kInput.vue';

const meta = {
  title: 'Components/I9kInput',
  component: I9kInput,
  args: { modelValue: '', label: 'البريد الإلكتروني', type: 'email' },
  argTypes: {
    uiSize: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kInput },
    setup: () => ({ args }),
    template: '<I9kInput v-bind="args" @update:modelValue="() => {}" />',
  }),
};

export const WithError: Story = {
  args: { error: 'هذا الحقل مطلوب' },
  render: (args) => ({
    components: { I9kInput },
    setup: () => ({ args }),
    template: '<I9kInput v-bind="args" @update:modelValue="() => {}" />',
  }),
};

export const Rtl: Story = {
  render: (args) => ({
    components: { I9kInput },
    setup: () => ({ args }),
    template:
      '<div lang="ar" dir="rtl"><I9kInput v-bind="args" @update:modelValue="() => {}" /></div>',
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kField, I9kInput },
    template:
      '<div><I9kInput model-value="" label="Standalone small" ui-size="sm" /><I9kInput model-value="" label="Standalone medium" ui-size="md" /><I9kInput model-value="" label="Standalone large" ui-size="lg" /><I9kField label="Field small" size="sm"><I9kInput model-value="" /></I9kField><I9kField label="Field medium" size="md"><I9kInput model-value="" /></I9kField><I9kField label="Field large" size="lg"><I9kInput model-value="" /></I9kField></div>',
  }),
};

export const InField: Story = {
  render: () => ({
    components: { I9kField, I9kInput },
    template:
      '<I9kField label="البريد الإلكتروني" hint="استخدم بريد العمل"><I9kInput model-value="" type="email" /></I9kField>',
  }),
};

export const InFieldWithError: Story = {
  render: () => ({
    components: { I9kField, I9kInput },
    template:
      '<I9kField label="البريد الإلكتروني" error="أدخل بريدًا إلكترونيًا صالحًا"><I9kInput model-value="" type="email" /></I9kField>',
  }),
};

export const FieldSizeInheritance: Story = {
  render: () => ({
    components: { I9kField, I9kInput },
    template:
      '<div><I9kField label="Inherited large" size="lg"><I9kInput model-value="" /></I9kField><I9kField label="Overridden small" size="lg"><I9kInput model-value="" ui-size="sm" /></I9kField></div>',
  }),
};

export const WithAction: Story = {
  render: () => ({
    components: { I9kButton, I9kField, I9kInput },
    template: `<div lang="ar" dir="rtl" style="display: grid; gap: 1rem; max-width: 28rem">
  <I9kInput model-value="" label="كود الخصم" dir="ltr">
    <template #action><I9kButton type="submit">تطبيق</I9kButton></template>
  </I9kInput>
  <I9kInput model-value="NOPE" label="كود الخصم" dir="ltr" error="الكود ده مش صالح">
    <template #action><I9kButton type="submit">تطبيق</I9kButton></template>
  </I9kInput>
  <I9kField label="رقم الطلب" hint="الرقم اللي في رسالة التأكيد" size="sm">
    <I9kInput model-value="" />
    <template #action>
      <I9kButton type="submit" size="sm">بحث</I9kButton>
      <I9kButton type="button" size="sm">أحدث الطلبات</I9kButton>
    </template>
  </I9kField>
</div>`,
  }),
};
