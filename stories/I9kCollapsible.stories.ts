import type { Meta, StoryObj } from '@storybook/vue3-vite';

import { ref } from 'vue';

import I9kCollapsible from '../src/components/I9kCollapsible.vue';

const meta = {
  title: 'Components/I9kCollapsible',
  component: I9kCollapsible,
  args: { defaultOpen: false },
} satisfies Meta<typeof I9kCollapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  render: (args) => ({
    components: { I9kCollapsible },
    setup: () => ({ args }),
    template:
      '<I9kCollapsible v-bind="args"><template #summary>Course module</template><p>Module lessons and resources.</p></I9kCollapsible>',
  }),
};

export const InitiallyOpen: Story = {
  args: { defaultOpen: true },
  render: (args) => ({
    components: { I9kCollapsible },
    setup: () => ({ args }),
    template:
      '<I9kCollapsible v-bind="args"><template #summary>Course module</template><p>Module lessons and resources.</p></I9kCollapsible>',
  }),
};

export const RichSummary: Story = {
  render: () => ({
    components: { I9kCollapsible },
    template: `<I9kCollapsible>
      <template #summary><span><strong>Module 03</strong> · 9 topics</span></template>
      <ol><li>Plan</li><li>Design</li><li>Build</li></ol>
    </I9kCollapsible>`,
  }),
};

export const Independent: Story = {
  render: () => ({
    components: { I9kCollapsible },
    template: `<div style="display: grid; gap: var(--spacing-6)">
      <I9kCollapsible :default-open="true"><template #summary>First</template>Open together.</I9kCollapsible>
      <I9kCollapsible :default-open="true"><template #summary>Second</template>Also open.</I9kCollapsible>
    </div>`,
  }),
};

export const Controlled: Story = {
  render: () => ({
    components: { I9kCollapsible },
    setup: () => {
      const open = ref(true);
      return { open };
    },
    template: `<div style="display: grid; gap: var(--spacing-6)">
      <button type="button" @click="open = !open">{{ open ? 'Collapse all' : 'Expand all' }}</button>
      <I9kCollapsible v-model:open="open"><template #summary>First</template>Follows the button.</I9kCollapsible>
      <I9kCollapsible v-model:open="open"><template #summary>Second</template>Follows the button too.</I9kCollapsible>
    </div>`,
  }),
};

export const Rtl: Story = {
  render: () => ({
    components: { I9kCollapsible },
    template: `<div dir="rtl" lang="ar">
      <I9kCollapsible :default-open="true"><template #summary>الوحدة الأولى</template><p>محتوى الوحدة وتفاصيلها.</p></I9kCollapsible>
    </div>`,
  }),
};
