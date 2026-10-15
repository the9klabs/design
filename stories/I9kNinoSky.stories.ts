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

// Page content above the sky, so a drop above it has somewhere to land: drag
// Nino up into the text and let go, or throw him at the window's edges.
export const UnderAPage: Story = {
  render: (args) => ({
    components: { I9kNinoSky },
    setup: () => ({ args }),
    template: `<div><div style="min-block-size: 70vh; padding: 2rem"><h2>Page content</h2><p>Drag Nino up here and let go: he swoops back to his sky, dizzy. Throw him and he bounces off the window's edges.</p></div><I9kNinoSky v-bind="args" /></div>`,
  }),
};
