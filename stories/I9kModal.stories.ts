import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kButton from '../src/components/I9kButton.vue';
import I9kModal from '../src/components/I9kModal.vue';

const meta = {
  title: 'Components/I9kModal',
  component: I9kModal,
  args: {
    title: 'Edit module',
    description: 'Both languages are required.',
    size: 'md',
    closeLabel: 'Close',
    dismissible: true,
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kButton, I9kModal },
    setup: () => {
      const open = ref(false);
      return { args, open };
    },
    template: `<div>
      <I9kButton @click="open = true">Edit module</I9kButton>
      <I9kModal v-bind="args" v-model:open="open">
        <p>Module fields go here.</p>
      </I9kModal>
    </div>`,
  }),
};

export const WithFooter: Story = {
  render: (args) => ({
    components: { I9kButton, I9kModal },
    setup: () => {
      const open = ref(false);
      return { args, open };
    },
    template: `<div>
      <I9kButton @click="open = true">Edit module</I9kButton>
      <I9kModal v-bind="args" v-model:open="open">
        <label>Title <input name="title" autofocus /></label>
        <template #footer>
          <I9kButton @click="open = false">Cancel</I9kButton>
          <I9kButton variant="primary" @click="open = false">Save</I9kButton>
        </template>
      </I9kModal>
    </div>`,
  }),
};

export const NotDismissible: Story = {
  args: {
    title: 'Saving module',
    description: 'Wait until the save finishes.',
    dismissible: false,
  },
  render: (args) => ({
    components: { I9kButton, I9kModal },
    setup: () => {
      const open = ref(false);
      return { args, open };
    },
    template: `<div>
      <I9kButton @click="open = true">Save module</I9kButton>
      <I9kModal v-bind="args" v-model:open="open">
        <p>Escape is ignored and the close button is disabled.</p>
        <template #footer>
          <I9kButton variant="primary" @click="open = false">Finish</I9kButton>
        </template>
      </I9kModal>
    </div>`,
  }),
};

export const Rtl: Story = {
  render: () => ({
    components: { I9kButton, I9kModal },
    setup: () => {
      const open = ref(false);
      return { open };
    },
    template: `<div dir="rtl" lang="ar">
      <I9kButton @click="open = true">تعديل الوحدة</I9kButton>
      <I9kModal v-model:open="open" title="تعديل الوحدة" description="اللغتان مطلوبتان." close-label="إغلاق">
        <p>حقول الوحدة هنا.</p>
        <template #footer>
          <I9kButton @click="open = false">إلغاء</I9kButton>
          <I9kButton variant="primary" @click="open = false">حفظ</I9kButton>
        </template>
      </I9kModal>
    </div>`,
  }),
};
