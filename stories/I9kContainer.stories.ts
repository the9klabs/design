import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kContainer from '../src/components/I9kContainer.vue';
import I9kPanel from '../src/components/I9kPanel.vue';
import I9kText from '../src/components/I9kText.vue';

const meta = {
  title: 'Components/I9kContainer',
  component: I9kContainer,
  args: { size: 'md' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof I9kContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kContainer, I9kPanel, I9kText },
    setup: () => ({ args }),
    template: `
      <I9kContainer v-bind="args" style="outline: 1px dashed var(--border-color)">
        <I9kText variant="lede">The page column: the header, the footer and every section share it.</I9kText>
        <I9kPanel size="sm">Section content</I9kPanel>
      </I9kContainer>
    `,
  }),
};

export const Columns: Story = {
  render: () => ({
    components: { I9kContainer, I9kPanel },
    template: `
      <div style="display: grid; gap: var(--spacing-13)">
        <I9kContainer size="sm" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Reading column (sm)</I9kPanel></I9kContainer>
        <I9kContainer size="md" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Site column (md)</I9kPanel></I9kContainer>
        <I9kContainer size="lg" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Wide work area (lg)</I9kPanel></I9kContainer>
      </div>
    `,
  }),
};

export const InAFullBleedBand: Story = {
  render: () => ({
    components: { I9kContainer, I9kText },
    template: `
      <section style="padding-block: var(--spacing-13); background: var(--surface-sunken-color)">
        <I9kContainer style="outline: 1px dashed var(--border-color)">
          <I9kText>The band fills the page; only its content keeps to the column.</I9kText>
        </I9kContainer>
      </section>
    `,
  }),
};
