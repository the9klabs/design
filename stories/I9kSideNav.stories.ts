import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kSideNav from '../src/components/I9kSideNav.vue';

const meta = {
  title: 'Components/I9kSideNav',
  component: I9kSideNav,
  args: {
    label: 'Admin sections',
    links: [
      { id: 'dashboard', label: 'Dashboard', href: '#dashboard' },
      { id: 'courses', label: 'Courses', href: '#courses', current: true },
      { id: 'learners', label: 'Learners', href: '#learners' },
      { id: 'orders', label: 'Orders', href: '#orders' },
    ],
  },
} satisfies Meta<typeof I9kSideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminSections: Story = {};

export const ArabicRtl: Story = {
  args: {
    label: 'أقسام الحساب',
    links: [
      { id: 'profile', label: 'حسابي', href: '#profile', current: true },
      { id: 'orders', label: 'طلباتي', href: '#orders' },
      { id: 'account', label: 'إعدادات الحساب', href: '#account' },
    ],
  },
  render: (args) => ({
    components: { I9kSideNav },
    setup: () => ({ args }),
    template: `<div dir="rtl" lang="ar" style="max-width: 20rem"><I9kSideNav v-bind="args">
      <template #footer><a href="#courses">تصفّح الدورات</a></template>
    </I9kSideNav></div>`,
  }),
};
