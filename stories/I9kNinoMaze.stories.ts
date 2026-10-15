import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kNinoMaze from '../src/components/I9kNinoMaze.vue';

const meta = {
  title: 'Components/I9kNinoMaze',
  component: I9kNinoMaze,
  args: { seed: '404', difficulty: 'normal', muted: false },
  argTypes: {
    difficulty: { control: 'select', options: ['easy', 'normal', 'hard'] },
    seed: { control: 'text' },
  },
} satisfies Meta<typeof I9kNinoMaze>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RandomEachVisit: Story = { args: { seed: null } };

export const Easy: Story = { args: { difficulty: 'easy' } };

export const Hard: Story = { args: { difficulty: 'hard', seed: '9k' } };

export const ArabicPage: Story = {
  render: (args) => ({
    components: { I9kNinoMaze },
    setup: () => ({ args }),
    template: `
      <div dir="rtl" lang="ar">
        <I9kNinoMaze
          v-bind="args"
          :labels="{
            newMaze: 'متاهة جديدة',
            playAgain: 'العب مرة أخرى',
            mute: 'كتم الصوت',
            ninoName: 'نينو',
            mazeCode: ({ code }) => 'متاهة #' + code,
            moveCount: ({ moves }) => moves + ' خطوة',
          }"
        />
      </div>
    `,
  }),
};
