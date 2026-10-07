import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kLevelMeter from '../src/components/I9kLevelMeter.vue';

const meta = {
  title: 'Components/I9kLevelMeter',
  component: I9kLevelMeter,
  args: { value: 3, max: 5, label: 'Level', valueText: 'Junior', size: 'md' },
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
        <I9kLevelMeter :value="1" label="Level" value-text="Newcomer" />
        <I9kLevelMeter :value="2" label="Level" value-text="Fresh" />
        <I9kLevelMeter :value="3" label="Level" value-text="Junior" />
        <I9kLevelMeter :value="4" label="Level" value-text="Mid-level" />
        <I9kLevelMeter :value="5" label="Level" value-text="Senior" />
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div style="padding-block-start: 6rem">
        <I9kLevelMeter
          :value="3"
          label="Level"
          value-text="Junior"
          description="Up to 2 years in a real team; you ship tasks with someone reviewing them."
        />
      </div>
    `,
  }),
};

export const Arabic: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div dir="rtl" lang="ar" style="display: grid; gap: var(--spacing-6)">
        <I9kLevelMeter :value="1" label="المستوى" value-text="من الصفر" />
        <I9kLevelMeter :value="3" label="المستوى" value-text="جونيور" />
        <I9kLevelMeter :value="5" label="المستوى" value-text="سينيور" />
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kLevelMeter },
    template: `
      <div style="display: grid; gap: var(--spacing-6)">
        <I9kLevelMeter :value="2" label="Level" value-text="Fresh" size="sm" />
        <I9kLevelMeter :value="3" label="Level" value-text="Junior" size="md" />
        <I9kLevelMeter :value="4" label="Level" value-text="Mid-level" size="lg" />
      </div>
    `,
  }),
};
