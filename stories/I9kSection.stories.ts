import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';

import I9kButton from '../src/components/I9kButton.vue';
import I9kCluster from '../src/components/I9kCluster.vue';
import I9kIcon from '../src/components/I9kIcon.vue';
import I9kIconButton from '../src/components/I9kIconButton.vue';
import I9kPanel from '../src/components/I9kPanel.vue';
import I9kSection from '../src/components/I9kSection.vue';

const meta = {
  title: 'Components/I9kSection',
  component: I9kSection,
  args: { title: 'Team', level: 2, collapsible: false, defaultOpen: true },
  argTypes: {
    level: { control: 'select', options: [2, 3, 4, 5, 6] },
  },
} satisfies Meta<typeof I9kSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithActions: Story = {
  render: (args) => ({
    components: { I9kButton, I9kIcon, I9kPanel, I9kSection },
    setup: () => ({ args }),
    template: `<I9kSection v-bind="args">
      <template #actions>
        <I9kButton size="sm"><I9kIcon name="add" /> Invite member</I9kButton>
      </template>
      <I9kPanel size="sm">Member list</I9kPanel>
    </I9kSection>`,
  }),
};

export const Collapsible: Story = {
  args: { collapsible: true },
  render: (args) => ({
    components: { I9kButton, I9kIcon, I9kPanel, I9kSection },
    setup: () => ({ args }),
    template: `<I9kSection v-bind="args">
      <template #actions>
        <I9kButton size="sm"><I9kIcon name="add" /> Invite member</I9kButton>
      </template>
      <I9kPanel size="sm">Member list</I9kPanel>
    </I9kSection>`,
  }),
};

export const ControlledWithToolbar: Story = {
  render: () => ({
    components: { I9kButton, I9kCluster, I9kIcon, I9kIconButton, I9kPanel, I9kSection },
    setup: () => {
      const open = ref({ projects: true, billing: false });
      const setAll = (value: boolean) => {
        open.value = { projects: value, billing: value };
      };
      return { open, setAll };
    },
    template: `<div style="display: grid; gap: var(--spacing-13)">
      <I9kSection id="projects" v-model:open="open.projects" title="Projects">
        <template #actions>
          <I9kButton size="sm" variant="primary"><I9kIcon name="add" /> New project</I9kButton>
        </template>
        <template #toolbar>
          <I9kCluster size="sm" role="group" aria-label="Sections">
            <I9kButton size="sm" @click="setAll(true)">Expand all</I9kButton>
            <I9kButton size="sm" @click="setAll(false)">Collapse all</I9kButton>
          </I9kCluster>
        </template>
        <I9kPanel size="sm">Project list</I9kPanel>
      </I9kSection>
      <I9kSection id="billing" v-model:open="open.billing" title="Billing details">
        <template #actions>
          <I9kIconButton icon="edit" size="sm" label="Edit billing details" />
        </template>
        <I9kPanel size="sm">Billing address and tax number.</I9kPanel>
      </I9kSection>
    </div>`,
  }),
};

export const Rtl: Story = {
  render: () => ({
    components: { I9kButton, I9kIcon, I9kPanel, I9kSection },
    template: `<div dir="rtl" lang="ar" style="display: grid; gap: var(--spacing-13)">
      <I9kSection title="الملاحظات" collapsible>
        <template #actions>
          <I9kButton size="sm"><I9kIcon name="add" /> أضف ملاحظة</I9kButton>
        </template>
        <I9kPanel size="sm">قائمة الملاحظات.</I9kPanel>
      </I9kSection>
      <I9kSection title="المشاريع" collapsible :default-open="false">
        <I9kPanel size="sm">قائمة المشاريع.</I9kPanel>
      </I9kSection>
    </div>`,
  }),
};
