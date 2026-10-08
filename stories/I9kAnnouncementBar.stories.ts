import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kAnnouncementBar from '../src/components/I9kAnnouncementBar.vue';

const meta = {
  title: 'Components/I9kAnnouncementBar',
  component: I9kAnnouncementBar,
  args: {
    href: '/changelog',
    linkLabel: 'Read the changelog',
    closeLabel: 'Close announcement',
    dismissible: true,
  },
} satisfies Meta<typeof I9kAnnouncementBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kAnnouncementBar },
    setup: () => ({ args }),
    template: '<I9kAnnouncementBar v-bind="args">Version 2 is out.</I9kAnnouncementBar>',
  }),
};

export const WithoutLink: Story = {
  args: { href: null, linkLabel: null },
  render: (args) => ({
    components: { I9kAnnouncementBar },
    setup: () => ({ args }),
    template:
      '<I9kAnnouncementBar v-bind="args">Scheduled maintenance on Sunday from 02:00 to 03:00 UTC.</I9kAnnouncementBar>',
  }),
};

export const NotDismissible: Story = {
  args: { dismissible: false },
  render: (args) => ({
    components: { I9kAnnouncementBar },
    setup: () => ({ args }),
    template: '<I9kAnnouncementBar v-bind="args">Version 2 is out.</I9kAnnouncementBar>',
  }),
};

export const Rtl: Story = {
  args: {
    label: 'إعلان',
    linkLabel: 'اقرأ سجل التغييرات',
    closeLabel: 'إغلاق الإعلان',
  },
  render: (args) => ({
    components: { I9kAnnouncementBar },
    setup: () => ({ args }),
    template:
      '<div lang="ar" dir="rtl"><I9kAnnouncementBar v-bind="args">صدر الإصدار الثاني.</I9kAnnouncementBar></div>',
  }),
};
