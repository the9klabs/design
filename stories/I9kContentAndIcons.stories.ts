import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kArticleHeader from '../src/components/I9kArticleHeader.vue';
import I9kBlurredCircles from '../src/components/I9kBlurredCircles.vue';
import I9kFaqList from '../src/components/I9kFaqList.vue';
import I9kGlow from '../src/components/I9kGlow.vue';
import I9kIcon from '../src/components/I9kIcon.vue';

const meta = { title: 'Components/Content and icons' } satisfies Meta;
export default meta;
type Story = StoryObj;

export const Icon: Story = {
  render: () => ({
    components: { I9kIcon },
    template:
      '<div style="font-size: 2rem; color: var(--primary-color)"><I9kIcon name="github" title="GitHub" /></div>',
  }),
};
export const FaqList: Story = {
  render: () => ({
    components: { I9kFaqList },
    template:
      "<I9kFaqList :items=\"[{ question: 'What does this include?', answer: 'Reusable brand components, tokens, and typography.' }, { question: 'Does it support Arabic?', answer: 'Yes, it supports the Thmanyah Arabic type system.' }]\" />",
  }),
};
export const ArticleHeader: Story = {
  render: () => ({
    components: { I9kArticleHeader },
    template: '<I9kArticleHeader title="An article about practical AI" watermark="AI" />',
  }),
};
export const AmbientBackground: Story = {
  render: () => ({
    components: { I9kBlurredCircles },
    template:
      '<div style="position: relative; min-height: 18rem; isolation: isolate; overflow: hidden"><I9kBlurredCircles /><p style="padding: 4rem 2rem">Ambient brand background</p></div>',
  }),
};
export const AmbientGlow: Story = {
  args: { position: 'end' },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'top-start', 'top-end', 'start', 'end', 'center'],
    },
  },
  render: (args) => ({
    components: { I9kGlow },
    setup: () => ({ args }),
    // The transform makes the fixed glow's containing block this box instead of the viewport.
    template:
      '<div style="position: relative; min-height: 24rem; overflow: hidden; transform: translateZ(0)"><I9kGlow v-bind="args" /><p style="position: relative; padding: 4rem 2rem">Ambient brand glow</p></div>',
  }),
};
