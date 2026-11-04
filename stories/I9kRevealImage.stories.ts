import type { Meta, StoryObj } from '@storybook/vue3-vite';

import I9kRevealImage from '../src/components/I9kRevealImage.vue';

// A 2:1 cover drawn inline, so the stories need no asset. An inline image is ready at once, so
// it appears without a reveal: to see the mark and the reveal, point `src` at a real file and
// throttle the network (DevTools, "Slow 4G").
const src =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23125f35'/%3E%3Ccircle cx='300' cy='70' r='90' fill='%23e85a02'/%3E%3Crect x='40' y='120' width='200' height='40' rx='8' fill='%23fff'/%3E%3C/svg%3E";

const meta = {
  title: 'Components/I9kRevealImage',
  component: I9kRevealImage,
  args: { src, alt: 'A course cover', width: 400, height: 200, eager: false },
  render: (args) => ({
    components: { I9kRevealImage },
    setup: () => ({ args }),
    // Keyed on the source, so a new `src` from the controls starts the image over.
    template: `
      <div style="max-width: 24rem">
        <I9kRevealImage :key="args.src" v-bind="args" />
      </div>
    `,
  }),
} satisfies Meta<typeof I9kRevealImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Scroll down: each image is requested only as it comes within a third of a screen. */
export const BelowTheFold: Story = {
  render: (args) => ({
    components: { I9kRevealImage },
    setup: () => ({ args }),
    template: `
      <div>
        <p style="height: 150vh; margin: 0">Scroll down.</p>
        <div style="display: grid; gap: var(--spacing-11); max-width: 24rem">
          <I9kRevealImage v-for="n in 6" :key="args.src + n" v-bind="args" />
        </div>
      </div>
    `,
  }),
};

/** A missing image keeps the mark, standing still. */
export const Broken: Story = {
  args: { src: '/this-image-does-not-exist.webp', alt: 'A missing image' },
};

/** For an image in the first screen: a plain high-priority <img>, with no placeholder. */
export const Eager: Story = {
  args: { eager: true },
};
