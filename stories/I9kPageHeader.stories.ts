import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kPageHeader from '../src/components/I9kPageHeader.vue';

const meta = {
  title: 'Components/I9kPageHeader',
  component: I9kPageHeader,
  args: {
    title: 'Practical AI from someone who ships.',
    description:
      'Practical talks for builders and technology teams, grounded in real product work.',
  },
} satisfies Meta<typeof I9kPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActionsAndAvatar: Story = {
  render: (args) => ({
    components: { I9kPageHeader },
    setup: () => ({ args }),
    template:
      '<I9kPageHeader v-bind="args"><template #avatar><img alt="" src="https://avatars.githubusercontent.com/u/20756985?s=160&v=4" width="112" height="112" style="border-radius: 50%"></template><template #actions><div class="cluster"><button class="btn btn--primary">Invite Ismail</button></div></template></I9kPageHeader>',
  }),
};
export const CompactOnMobile: Story = {
  args: { compactOnMobile: true, title: "Hi, I'm Abdelrahman Ismail" },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (args) => ({
    components: { I9kPageHeader },
    setup: () => ({ args }),
    template:
      '<I9kPageHeader v-bind="args"><template #avatar><img alt="" src="https://avatars.githubusercontent.com/u/20756985?s=160&v=4" width="88" height="88" style="border-radius: 50%"></template><template #actions><div class="cluster"><button class="btn btn--primary">Invite Ismail</button></div></template></I9kPageHeader>',
  }),
};
