import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kField from '../src/components/I9kField.vue';
import I9kPhoneInput from '../src/components/I9kPhoneInput.vue';

const meta = {
  title: 'Components/I9kPhoneInput',
  component: I9kPhoneInput,
  args: { modelValue: '', country: 'EG', countryLabel: 'Country code', locale: 'en' },
  argTypes: {
    uiSize: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kPhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kField, I9kPhoneInput },
    setup: () => {
      const phone = ref(args.modelValue);
      const country = ref(args.country);
      return { args, phone, country };
    },
    template: `<I9kField label="WhatsApp number"><I9kPhoneInput v-bind="args" v-model="phone" v-model:country="country" /></I9kField>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kField, I9kPhoneInput },
    template: `
      <div>
        <I9kField label="Small" size="sm"><I9kPhoneInput model-value="" country="EG" country-label="Country code" /></I9kField>
        <I9kField label="Medium" size="md"><I9kPhoneInput model-value="" country="EG" country-label="Country code" /></I9kField>
        <I9kField label="Large" size="lg"><I9kPhoneInput model-value="" country="EG" country-label="Country code" /></I9kField>
      </div>
    `,
  }),
};

export const WithError: Story = {
  render: () => ({
    components: { I9kField, I9kPhoneInput },
    template: `<I9kField label="WhatsApp number" error="That number doesn't look right."><I9kPhoneInput model-value="123" country="AE" country-label="Country code" /></I9kField>`,
  }),
};

export const Arabic: Story = {
  render: () => ({
    components: { I9kField, I9kPhoneInput },
    setup: () => ({ phone: ref(''), country: ref('SA') }),
    template: `
      <div dir="rtl" lang="ar">
        <I9kField label="رقم واتساب لتنبيه الإطلاق (اختياري)">
          <I9kPhoneInput v-model="phone" v-model:country="country" country-label="مفتاح الدولة" locale="ar" />
        </I9kField>
      </div>
    `,
  }),
};
