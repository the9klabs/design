import type { ShowcaseEntry } from './types';

export const I9kLevelMeterEntry: ShowcaseEntry = {
  name: 'I9kLevelMeter',
  section: 'content',
  summary:
    'A short row of rising steps with some filled, for a level out of a few, such as a course difficulty. It is a named meter, and the level can be shown in words beside it.',
  agentPrompt: `Use I9kLevelMeter from @9klabs/design to show a level out of a small maximum, such as a course's difficulty (3 of 5).

import { I9kLevelMeter } from '@9klabs/design';

Props:
- value: number (required) — how many steps are filled; rounded and clamped to 0..max.
- label: string (required) — the meter's accessible name, e.g. "Difficulty". Not shown on screen.
- max?: number (default 5) — how many steps are drawn; a value under 1 draws one.
- valueText?: string (default undefined) — the level in words, e.g. "Intermediate". Shown beside the steps and announced as the meter's value.
- size?: 'sm' | 'md' | 'lg' (default 'md')

Emits: none.

Slots: none.

Behavior: the root is role="meter" with aria-valuemin 0, aria-valuemax max and aria-valuenow value; valueText becomes aria-valuetext. The steps themselves are aria-hidden. A filled step is solid and an empty one is outlined, and the steps rise in height, so the level does not rest on colour.

IMPORTANT: pass valueText whenever the level has a name. Without it, nothing on screen says the level in words, and a screen reader announces only the number.

Usage:
<I9kLevelMeter :value="3" label="Difficulty" value-text="Intermediate" />`,
  gotchas: [
    '`label` is the accessible name and is never shown; the visible words come from `valueText`.',
    'An empty `label` logs a development warning, because a meter needs a name.',
    'The steps follow the reading direction, so they rise from right to left on an Arabic page.',
  ],
  demos: [
    {
      label: 'Five levels',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kLevelMeter :value="1" label="Difficulty" value-text="Beginner" />
  <I9kLevelMeter :value="2" label="Difficulty" value-text="Elementary" />
  <I9kLevelMeter :value="3" label="Difficulty" value-text="Intermediate" />
  <I9kLevelMeter :value="4" label="Difficulty" value-text="Advanced" />
  <I9kLevelMeter :value="5" label="Difficulty" value-text="Expert" />
</div>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kLevelMeter :value="2" label="Difficulty" value-text="Elementary" size="sm" />
  <I9kLevelMeter :value="3" label="Difficulty" value-text="Intermediate" size="md" />
  <I9kLevelMeter :value="4" label="Difficulty" value-text="Advanced" size="lg" />
</div>`,
    },
    {
      label: 'Custom maximum, no text',
      code: `<I9kLevelMeter :value="2" :max="3" label="Signal strength" />`,
    },
  ],
};
