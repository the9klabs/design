import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { provide, ref } from 'vue';

import I9kButton from '../src/components/I9kButton.vue';
import I9kModal from '../src/components/I9kModal.vue';
import I9kToaster from '../src/components/I9kToaster.vue';
import {
  createI9kToaster,
  I9K_TOASTER_KEY,
  type I9kToasterLabels,
} from '../src/composables/i9kToaster';

/**
 * Stands in for `app.use(createI9kToaster())`: each story provides its own
 * store, so notifications raised in one story never leak into another.
 */
function provideToaster(labels?: Partial<I9kToasterLabels>) {
  const toaster = createI9kToaster({ labels });
  provide(I9K_TOASTER_KEY, toaster);
  return toaster;
}

const meta = {
  title: 'Components/I9kToaster',
  component: I9kToaster,
  args: { size: 'md' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof I9kToaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kButton, I9kToaster },
    setup: () => ({ args, toaster: provideToaster() }),
    template: `<div class="cluster">
      <I9kButton @click="toaster.show({ variant: 'info', message: 'Your changes are syncing.' })">Info</I9kButton>
      <I9kButton @click="toaster.show({ variant: 'success', message: 'Changes saved.' })">Success</I9kButton>
      <I9kButton @click="toaster.show({ id: 'unsaved', variant: 'warning', message: 'You have unsaved changes.' })">Warning</I9kButton>
      <I9kButton @click="toaster.show({ id: 'save', variant: 'error', message: 'Could not save changes.', detail: 'تعذّر الاتصال بالخادم', detailLang: 'ar', detailDir: 'rtl' })">Error</I9kButton>
      <I9kButton @click="toaster.clear()">Clear</I9kButton>
      <I9kToaster v-bind="args" />
    </div>`,
  }),
};

export const Rtl: Story = {
  render: (args) => ({
    components: { I9kButton, I9kToaster },
    setup: () => ({
      args,
      toaster: provideToaster({ region: 'الإشعارات', dismiss: 'إغلاق' }),
    }),
    template: `<div lang="ar" dir="rtl" class="cluster">
      <I9kButton @click="toaster.show({ variant: 'success', message: 'تم الحفظ بنجاح' })">حفظ</I9kButton>
      <I9kButton @click="toaster.show({ id: 'save', variant: 'error', message: 'تعذّر حفظ التغييرات' })">خطأ</I9kButton>
      <I9kToaster v-bind="args" />
    </div>`,
  }),
};

export const InsideModal: Story = {
  render: (args) => ({
    components: { I9kButton, I9kModal, I9kToaster },
    setup: () => {
      const open = ref(false);
      return { args, open, toaster: provideToaster() };
    },
    template: `<div>
      <I9kButton @click="open = true">Edit module</I9kButton>
      <I9kModal v-model:open="open" title="Edit module" description="The modal hosts its own toaster while open.">
        <p>A notification raised here shows above the backdrop and can be dismissed.</p>
        <template #footer>
          <I9kButton @click="toaster.show({ id: 'save', variant: 'error', message: 'Could not save the module.' })">Fail to save</I9kButton>
          <I9kButton variant="primary" @click="toaster.show({ variant: 'success', message: 'Module saved.' })">Save</I9kButton>
        </template>
      </I9kModal>
      <I9kToaster v-bind="args" />
    </div>`,
  }),
};
