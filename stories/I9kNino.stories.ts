import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import I9kNino from '../src/components/I9kNino.vue';
import {
  I9K_NINO_ACTIONS,
  I9K_NINO_EXPRESSIONS,
  type I9kNinoAction,
  type I9kNinoExposed,
} from '../src/types/components';

const row = 'display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)';

const meta = {
  title: 'Components/I9kNino',
  component: I9kNino,
  args: {
    expression: 'idle',
    look: 'center',
    size: 'lg',
    animated: true,
    talking: false,
    label: null,
  },
  argTypes: {
    expression: { control: 'select', options: [...I9K_NINO_EXPRESSIONS] },
    look: { control: 'select', options: ['center', 'up', 'down', 'start', 'end'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'auto'] },
    animated: { control: 'boolean' },
    talking: { control: 'boolean' },
    label: { control: 'text' },
  },
} satisfies Meta<typeof I9kNino>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ExpressionSet: Story = {
  render: () => ({
    components: { I9kNino },
    setup: () => ({ expressions: I9K_NINO_EXPRESSIONS }),
    template: `<div style="${row}"><I9kNino v-for="expression in expressions" :key="expression" :expression="expression" size="lg" /></div>`,
  }),
};

export const LookingAround: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div style="${row}"><I9kNino look="center" size="lg" /><I9kNino look="up" size="lg" /><I9kNino look="down" size="lg" /><I9kNino look="start" size="lg" /><I9kNino look="end" size="lg" /></div>`,
  }),
};

// start and end follow the reading direction, so the same two props glance the
// other way inside an RTL container.
export const LookingAroundRtl: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div dir="rtl" style="${row}"><I9kNino look="start" size="lg" /><I9kNino look="end" size="lg" /></div>`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div style="${row}"><I9kNino size="sm" /><I9kNino size="md" /><I9kNino size="lg" /></div>`,
  }),
};

export const Still: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div style="${row}"><I9kNino size="lg" expression="thinking" :animated="false" /><I9kNino size="lg" expression="worried" :animated="false" /></div>`,
  }),
};

// size="auto" hands sizing back to the host svg, which is how a consumer moves
// Nino around a board of its own.
export const NestedInAHostSvg: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<svg viewBox="0 0 240 80" width="240" height="80" role="img" aria-label="Nino nested in a host svg">
  <rect x="0" y="0" width="240" height="80" fill="var(--surface-sunken-color)" />
  <I9kNino size="auto" x="8" y="8" width="64" height="64" expression="idle" />
  <I9kNino size="auto" x="88" y="8" width="64" height="64" expression="surprised" />
  <I9kNino size="auto" x="168" y="8" width="64" height="64" expression="happy" />
</svg>`,
  }),
};

export const Named: Story = {
  args: { label: 'نينو', expression: 'happy' },
};

// play() is imperative on purpose: pressing the same button twice replays the
// action, and the readout shows how each call ended.
export const Actions: Story = {
  render: () => ({
    components: { I9kNino },
    setup() {
      const nino = ref<I9kNinoExposed | null>(null);
      const last = ref('');
      const play = async (action: I9kNinoAction) => {
        const result = await nino.value?.play(action);
        if (result) last.value = `${result.action}: ${result.completed ? 'completed' : 'cut off'}`;
      };
      return { nino, play, actions: I9K_NINO_ACTIONS, last };
    },
    template: `<div style="${row}"><I9kNino ref="nino" size="lg" /><button v-for="action in actions" :key="action" type="button" @click="play(action)">{{ action }}</button><output>{{ last }}</output></div>`,
  }),
};

export const Talking: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div style="${row}"><I9kNino size="lg" talking /><I9kNino size="lg" expression="worried" talking /><I9kNino size="lg" expression="happy" talking /></div>`,
  }),
};

// Every mood with its ambient motion: breathing, blinking, the antenna, the
// idle glance, the happy hop, the thinking bob and the worried shiver.
export const AmbientLife: Story = {
  render: () => ({
    components: { I9kNino },
    setup: () => ({ expressions: I9K_NINO_EXPRESSIONS }),
    template: `<div style="${row}"><I9kNino v-for="expression in expressions" :key="expression" :expression="expression" size="lg" /></div>`,
  }),
};

export const GlancingRtl: Story = {
  render: () => ({
    components: { I9kNino },
    template: `<div dir="rtl" style="${row}"><I9kNino size="lg" /></div>`,
  }),
};
