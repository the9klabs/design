import type { ShowcaseEntry } from './types';

export const I9kLevelMeterEntry: ShowcaseEntry = {
  name: 'I9kLevelMeter',
  section: 'content',
  summary:
    'A short row of rising steps with some filled, for a level out of a few, such as a course level. It is a named meter, the level can be shown in words beside it, and a description can explain it in a tooltip.',
  agentPrompt: `Use I9kLevelMeter from @9klabs/design to show a level out of a small maximum, such as a course's level (3 of 5).

import { I9kLevelMeter } from '@9klabs/design';

Props:
- value: number (required) — how many steps are filled; rounded and clamped to 0..max.
- label: string (required) — the meter's accessible name, e.g. "Level". Not shown on screen.
- max?: number (default 5) — how many steps are drawn; a value under 1 draws one.
- valueText?: string (default undefined) — the level in words, e.g. "Junior". Shown beside the steps and announced as the meter's value.
- description?: string (default undefined) — who or what the level is for, e.g. "Up to 2 years in a real team". Shown in an I9kTooltip on hover, keyboard focus or tap, and set as the meter's accessible description; the meter becomes focusable so a keyboard can open it.
- size?: 'sm' | 'md' | 'lg' (default 'md')

Emits: none.

Slots: none.

Behavior: the root is role="meter" with aria-valuemin 0, aria-valuemax max and aria-valuenow value; valueText becomes aria-valuetext. The steps themselves are aria-hidden. A filled step is solid and an empty one is outlined, and the steps rise in height, so the level does not rest on colour.

IMPORTANT: pass valueText whenever the level has a name. Without it, nothing on screen says the level in words, and a screen reader announces only the number.

Usage:
<I9kLevelMeter :value="3" label="Level" value-text="Junior" description="Up to 2 years in a real team." />`,
  gotchas: [
    '`label` is the accessible name and is never shown; the visible words come from `valueText`.',
    'An empty `label` logs a development warning, because a meter needs a name.',
    'The steps follow the reading direction, so they rise from right to left on an Arabic page.',
    "With a `description`, the outermost element is the tooltip wrapper: a caller's class lands there, and the meter inside it takes the focus. Inside a card whose link is stretched over it, lift the meter above the overlay (`position: relative; z-index: 1`) so hover and tap reach it.",
  ],
  demos: [
    {
      label: 'Five levels',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kLevelMeter :value="1" label="Level" value-text="Newcomer" />
  <I9kLevelMeter :value="2" label="Level" value-text="Fresh" />
  <I9kLevelMeter :value="3" label="Level" value-text="Junior" />
  <I9kLevelMeter :value="4" label="Level" value-text="Mid-level" />
  <I9kLevelMeter :value="5" label="Level" value-text="Senior" />
</div>`,
    },
    {
      label: 'With a description',
      code: `<I9kLevelMeter
  :value="3"
  label="Level"
  value-text="Junior"
  description="Up to 2 years in a real team; you ship tasks with someone reviewing them."
/>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kLevelMeter :value="2" label="Level" value-text="Fresh" size="sm" />
  <I9kLevelMeter :value="3" label="Level" value-text="Junior" size="md" />
  <I9kLevelMeter :value="4" label="Level" value-text="Mid-level" size="lg" />
</div>`,
    },
    {
      label: 'Custom maximum, no text',
      code: `<I9kLevelMeter :value="2" :max="3" label="Signal strength" />`,
    },
  ],
};
