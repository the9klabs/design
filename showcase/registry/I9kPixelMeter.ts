import type { ShowcaseEntry } from './types';

export const I9kPixelMeterEntry: ShowcaseEntry = {
  name: 'I9kPixelMeter',
  section: 'content',
  summary:
    "A meter drawn in pixel blocks with notched corners, the design language's pixel accent for progress and levels. One block per unit for a small count such as a level, or a continuous segmented fill for a percentage.",
  agentPrompt: `Use I9kPixelMeter from @9klabs/design to show progress or a level as a pixel accent (see Foundations, Pixel accents).

import { I9kPixelMeter } from '@9klabs/design';

Props:
- value: number (required) — the amount filled; clamped to 0..max (rounded when segments is on).
- label: string (required) — the meter's accessible name. Not shown on screen.
- max?: number (default 4) — the number of blocks, or the scale of a continuous fill (e.g. 100).
- valueText?: string — the value in words, announced as aria-valuetext.
- segments?: boolean (default true) — one block per unit; false draws one continuous fill cut into segments.
- tone?: 'accent' | 'primary' (default 'accent') — accent for a level or an achievement, primary for progress.
- blink?: boolean (default false) — the last filled block blinks slowly, like a cursor; still under prefers-reduced-motion.
- size?: 'sm' | 'md' | 'lg' (default 'md')

Slots:
- default — before the blocks, e.g. a link naming the level.
- end — after the blocks, e.g. "2 / 4".

Behavior: the blocks are a role="meter" element named by label, with aria-valuemin 0, aria-valuemax max and aria-valuenow value; the drawing is aria-hidden. The slots sit outside the meter. It fills from the inline start, so from the right on an Arabic page. No style attribute is rendered, so it works under a strict Content-Security-Policy.

IMPORTANT: use it only for progress and levels; it is a pixel accent, not a general progress bar for panels or forms.

Usage:
<I9kPixelMeter :value="2" label="Tech level" value-text="Vibe Coder" blink>
  <a href="/tools/level-quiz">Vibe Coder</a>
  <template #end>2 / 4</template>
</I9kPixelMeter>`,
  gotchas: [
    '`label` is the accessible name and is never shown; put visible words in the slots.',
    'Use `segments` for a small count (a level of four). For a percentage pass `:segments="false"` and `:max="100"`.',
    'It fills from the inline start, so it fills from the right on an Arabic page.',
    'The slots are set in `--font-mono`, which has no Arabic letters: put a number or a Latin name there, not an Arabic sentence.',
  ],
  demos: [
    {
      label: 'A level of four',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kPixelMeter :value="1" label="Tech level" value-text="Hello, World" blink><span>Hello, World</span><template #end>1 / 4</template></I9kPixelMeter>
  <I9kPixelMeter :value="2" label="Tech level" value-text="Vibe Coder" blink><span>Vibe Coder</span><template #end>2 / 4</template></I9kPixelMeter>
  <I9kPixelMeter :value="4" label="Tech level" value-text="9k Verified" blink><span>9k Verified</span><template #end>4 / 4</template></I9kPixelMeter>
</div>`,
    },
    {
      label: 'Course progress',
      code: `<I9kPixelMeter :value="21" :max="100" :segments="false" tone="primary" label="Course progress" value-text="21%"><template #end>21%</template></I9kPixelMeter>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kPixelMeter :value="3" label="Level" size="sm" />
  <I9kPixelMeter :value="3" label="Level" size="md" />
  <I9kPixelMeter :value="3" label="Level" size="lg" />
</div>`,
    },
  ],
};
