import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kPageContainer from '../src/components/I9kPageContainer.vue';
import I9kPanel from '../src/components/I9kPanel.vue';
import I9kText from '../src/components/I9kText.vue';

const meta = {
  title: 'Components/I9kPageContainer',
  component: I9kPageContainer,
  args: { size: 'md' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof I9kPageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { I9kPageContainer, I9kPanel, I9kText },
    setup: () => ({ args }),
    template: `
      <I9kPageContainer v-bind="args" style="outline: 1px dashed var(--border-color)">
        <I9kText variant="lede">A centered page container in the shared page column, with responsive gutters.</I9kText>
        <I9kPanel size="sm">Page content</I9kPanel>
      </I9kPageContainer>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kPageContainer, I9kPanel },
    template: `
      <div style="display: grid; gap: var(--spacing-13)">
        <I9kPageContainer size="sm" style="min-height: 8rem; outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Small gutter</I9kPanel></I9kPageContainer>
        <I9kPageContainer size="md" style="min-height: 8rem; outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Medium gutter</I9kPanel></I9kPageContainer>
        <I9kPageContainer size="lg" style="min-height: 8rem; outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Large gutter</I9kPanel></I9kPageContainer>
      </div>
    `,
  }),
};

export const LongContent: Story = {
  render: () => ({
    components: { I9kPageContainer, I9kText },
    template: `
      <I9kPageContainer>
        <I9kText v-for="index in 8" :key="index">Long page paragraph {{ index }} keeps the container in normal document flow once content exceeds the minimum height.</I9kText>
      </I9kPageContainer>
    `,
  }),
};
