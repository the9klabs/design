import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kPixelMeter from '../src/components/I9kPixelMeter.vue';

const meta = {
  title: 'Components/I9kPixelMeter',
  component: I9kPixelMeter,
  args: {
    value: 2,
    max: 4,
    label: 'Tech level',
    valueText: 'Vibe Coder',
    segments: true,
    tone: 'accent',
    blink: true,
    size: 'md',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    tone: { control: 'select', options: ['accent', 'primary'] },
  },
} satisfies Meta<typeof I9kPixelMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level: Story = {};

export const CourseProgress: Story = {
  args: {
    value: 21,
    max: 100,
    segments: false,
    tone: 'primary',
    blink: false,
    label: 'Course progress',
    valueText: '21%',
  },
};

export const RightToLeft: Story = {
  render: () => ({
    components: { I9kPixelMeter },
    template: `
      <div dir="rtl" style="display: grid; gap: var(--spacing-6)">
        <I9kPixelMeter :value="2" label="المستوى" value-text="Vibe Coder" blink><span>Vibe Coder</span><template #end>2 / 4</template></I9kPixelMeter>
        <I9kPixelMeter :value="21" :max="100" :segments="false" tone="primary" label="التقدم" />
      </div>
    `,
  }),
};
