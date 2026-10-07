import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kNinoSky from '../src/components/I9kNinoSky.vue';

const meta = {
  title: 'Components/I9kNinoSky',
  component: I9kNinoSky,
  args: { boopLabel: 'Say hi to Nino', height: 'md', animated: true },
  argTypes: {
    boopLabel: { control: 'text' },
    height: { control: 'select', options: ['sm', 'md', 'lg'] },
    animated: { control: 'boolean' },
  },
} satisfies Meta<typeof I9kNinoSky>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = { args: { height: 'sm' } };

export const Still: Story = { args: { animated: false } };

// The planets swap sides and Nino's start/end glance mirrors on an Arabic page.
export const Arabic: Story = {
  args: { boopLabel: 'سلّم على نينو' },
  render: (args) => ({
    components: { I9kNinoSky },
    setup: () => ({ args }),
    template: `<div dir="rtl" lang="ar"><I9kNinoSky v-bind="args" /></div>`,
  }),
};
