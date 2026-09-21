import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kSidebarLayout from '../src/components/I9kSidebarLayout.vue';

const meta = {
  title: 'Components/I9kSidebarLayout',
  component: I9kSidebarLayout,
  args: {
    sidebarLabel: 'Course contents',
    toggleLabel: 'Course contents',
    closeLabel: 'Close course contents',
  },
} satisfies Meta<typeof I9kSidebarLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const lessons = `<ol>
  <li><a href="#welcome">Welcome</a></li>
  <li><a href="#setup" aria-current="page">Setup</a></li>
  <li><a href="#prompting">Prompting</a></li>
</ol>`;

export const CoursePlayer: Story = {
  render: (args) => ({
    components: { I9kSidebarLayout },
    setup: () => ({ args }),
    template: `<I9kSidebarLayout v-bind="args">
      <template #bar><strong>Leveraging AI</strong></template>
      <template #sidebar>${lessons}</template>
      <template #sidebar-footer>Progress · 1 of 3</template>
      <p style="padding: var(--spacing-10)">Lesson content.</p>
      <template #footer><p style="padding: var(--spacing-8)">Terms · Privacy</p></template>
    </I9kSidebarLayout>`,
  }),
};

export const ArabicRtl: Story = {
  args: {
    sidebarLabel: 'محتوى الدورة',
    toggleLabel: 'محتوى الدورة',
    closeLabel: 'إغلاق محتوى الدورة',
  },
  render: (args) => ({
    components: { I9kSidebarLayout },
    setup: () => ({ args }),
    template: `<div dir="rtl" lang="ar"><I9kSidebarLayout v-bind="args">
      <template #bar><strong>الدورة</strong></template>
      <template #sidebar><ol><li><a href="#one" aria-current="page">الدرس الأول</a></li></ol></template>
      <p style="padding: var(--spacing-10)">محتوى الدرس.</p>
    </I9kSidebarLayout></div>`,
  }),
};

export const WithoutSidebar: Story = {
  render: (args) => ({
    components: { I9kSidebarLayout },
    setup: () => ({ args }),
    template: `<I9kSidebarLayout v-bind="args">
      <template #bar><strong>Leveraging AI</strong></template>
      <p style="padding: var(--spacing-10)">No outline: no sidebar and no toggle.</p>
    </I9kSidebarLayout>`,
  }),
};
