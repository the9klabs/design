import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kBreadcrumb from '../src/components/I9kBreadcrumb.vue';

const meta = {
  title: 'Components/I9kBreadcrumb',
  component: I9kBreadcrumb,
  args: {
    items: [
      { id: 'course', label: 'Leveraging AI for Development', href: '/courses/ai' },
      { id: 'lesson', label: 'Hello, Agent' },
    ],
  },
} satisfies Meta<typeof I9kBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CourseAndLesson: Story = {};

export const ArabicRtl: Story = {
  args: {
    label: 'مسار التنقّل',
    items: [
      { id: 'course', label: 'هندسة البرمجيات مع الذكاء الاصطناعي', href: '/courses/ai' },
      { id: 'lesson', label: 'الدرس الأول' },
    ],
  },
  render: (args) => ({
    components: { I9kBreadcrumb },
    setup: () => ({ args }),
    template: '<div dir="rtl" lang="ar"><I9kBreadcrumb v-bind="args" /></div>',
  }),
};
