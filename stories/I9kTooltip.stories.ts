import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kButton from '../src/components/I9kButton.vue';
import I9kTooltip from '../src/components/I9kTooltip.vue';

const meta = {
  title: 'Components/I9kTooltip',
  component: I9kTooltip,
  args: { text: 'Up to 2 years in a real team; you ship tasks with someone reviewing them.' },
  render: (args) => ({
    components: { I9kButton, I9kTooltip },
    setup: () => ({ args }),
    template: `
      <div style="padding-block-start: 6rem">
        <I9kTooltip v-bind="args" v-slot="{ describedBy }">
          <I9kButton :aria-describedby="describedBy">Junior</I9kButton>
        </I9kTooltip>
      </div>
    `,
  }),
} satisfies Meta<typeof I9kTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Arabic: Story = {
  render: () => ({
    components: { I9kButton, I9kTooltip },
    template: `
      <div dir="rtl" lang="ar" style="padding-block-start: 6rem">
        <I9kTooltip text="لحد سنتين في فريق حقيقي، وبتسلّم tasks بمراجعة." v-slot="{ describedBy }">
          <I9kButton :aria-describedby="describedBy">جونيور</I9kButton>
        </I9kTooltip>
      </div>
    `,
  }),
};
