import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kLevelMeter from '../src/components/I9kLevelMeter.vue';

const meta = {
  title: 'Components/I9kLevelMeter',
  component: I9kLevelMeter,
  args: { value: 3, max: 5, label: 'Difficulty', valueText: 'Intermediate', size: 'md' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'number', min: 0, max: 5, step: 1 } },
  },
} satisfies Meta<typeof I9kLevelMeter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FiveLevels: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div style="display: grid; gap: var(--spacing-6)">
        <I9kLevelMeter :value="1" label="Difficulty" value-text="Beginner" />
        <I9kLevelMeter :value="2" label="Difficulty" value-text="Elementary" />
        <I9kLevelMeter :value="3" label="Difficulty" value-text="Intermediate" />
        <I9kLevelMeter :value="4" label="Difficulty" value-text="Advanced" />
        <I9kLevelMeter :value="5" label="Difficulty" value-text="Expert" />
      </div>
    `,
  }),
};

export const Arabic: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div dir="rtl" lang="ar" style="display: grid; gap: var(--spacing-6)">
        <I9kLevelMeter :value="1" label="المستوى" value-text="مبتدئ" />
        <I9kLevelMeter :value="3" label="المستوى" value-text="متوسط" />
        <I9kLevelMeter :value="5" label="المستوى" value-text="خبير" />
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div style="display: grid; gap: var(--spacing-6)">
        <I9kLevelMeter :value="2" label="Difficulty" value-text="Elementary" size="sm" />
        <I9kLevelMeter :value="3" label="Difficulty" value-text="Intermediate" size="md" />
        <I9kLevelMeter :value="4" label="Difficulty" value-text="Advanced" size="lg" />
      </div>
    `,
  }),
};
