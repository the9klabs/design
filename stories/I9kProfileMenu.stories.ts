import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kBrandWordmark from '../src/components/I9kBrandWordmark.vue';
import I9kButton from '../src/components/I9kButton.vue';
import I9kNavigation from '../src/components/I9kNavigation.vue';
import I9kProfileMenu from '../src/components/I9kProfileMenu.vue';

const picture =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e85a02'/%3E%3Ccircle cx='20' cy='20' r='10' fill='%234ade80'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/I9kProfileMenu',
  component: I9kProfileMenu,
  args: {
    label: 'Account menu',
    name: 'Ismail',
    detail: 'me@example.com',
    avatarSrc: picture,
    links: [
      { id: 'profile', label: 'My account', href: '#profile' },
      { id: 'orders', label: 'My orders', href: '#orders' },
    ],
  },
} satisfies Meta<typeof I9kProfileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kProfileMenu, I9kButton },
    setup: () => ({ args }),
    template: `<div style="display: flex; justify-content: flex-end; min-height: 18rem">
  <I9kProfileMenu v-bind="args">
    <template #actions="{ close }"><I9kButton @click="close">Sign out</I9kButton></template>
  </I9kProfileMenu>
</div>`,
  }),
};

export const ArabicRtl: Story = {
  args: {
    label: 'قائمة الحساب',
    name: 'إسماعيل',
    links: [
      { id: 'profile', label: 'حسابي', href: '#profile' },
      { id: 'orders', label: 'طلباتي', href: '#orders' },
    ],
  },
  render: (args) => ({
    components: { I9kProfileMenu, I9kButton },
    setup: () => ({ args }),
    template: `<div dir="rtl" lang="ar" style="display:flex;justify-content:flex-end;min-height:18rem">
  <I9kProfileMenu v-bind="args">
    <template #actions="{ close }"><I9kButton @click="close">تسجيل الخروج</I9kButton></template>
  </I9kProfileMenu>
</div>`,
  }),
};

export const InNavigation: Story = {
  render: (args) => ({
    components: { I9kNavigation, I9kBrandWordmark, I9kProfileMenu, I9kButton },
    setup: () => ({
      args,
      links: [
        { id: 'courses', label: 'Courses', href: '#courses' },
        { id: 'about', label: 'About', href: '#about' },
      ],
    }),
    template: `<div style="min-height: 22rem">
  <I9kNavigation :links="links" brand-label="9k.school">
    <template #brand="{ compact }"><I9kBrandWordmark :compact="compact" /></template>
    <template #actions>
      <I9kProfileMenu v-bind="args" size="sm">
        <template #actions="{ close }"><I9kButton @click="close">Sign out</I9kButton></template>
      </I9kProfileMenu>
    </template>
  </I9kNavigation>
</div>`,
  }),
};
