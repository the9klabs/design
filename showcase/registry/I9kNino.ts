import type { ShowcaseEntry } from './types';

export const I9kNinoEntry: ShowcaseEntry = {
  name: 'I9kNino',
  section: 'content',
  summary:
    'Nino, the 9k pixel mascot: an inline-SVG character with six expressions, a logical gaze direction, theme-aware token colours, and motion that switches itself off for reduced-motion visitors.',
  agentPrompt: `Use I9kNino from @9klabs/design to put the 9k mascot on a page. He is drawn entirely from rectangles and one mouth path on a 16x16 pixel grid, so there is no image to load and nothing blurs at small sizes.

import { I9kNino, I9K_NINO_EXPRESSIONS } from '@9klabs/design';

Props:
- expression?: 'idle' | 'happy' | 'thinking' | 'worried' | 'surprised' | 'eyes-closed' (default 'idle'). Only the eyes, brows and mouth change; the head, screen, arms and feet are the same in all six.
- look?: 'center' | 'up' | 'down' | 'start' | 'end' (default 'center') — moves the eyes only, so it reads as a glance rather than a turn. 'start' and 'end' follow the reading direction and swap under [dir="rtl"].
- size?: 'sm' | 'md' | 'lg' | 'auto' (default 'md') — 2rem / 3rem / 4.5rem, or 'auto' to drop the component's own CSS sizing.
- animated?: boolean (default true) — removes the class every animation rule hangs off when false.
- label?: string | null (default null) — the localized name, e.g. 'Nino' or 'نينو'.

Emits: none. Slots: none.

Accessibility: with a \`label\` he renders role="img" and a <title>; without one he is aria-hidden="true" and stays out of the accessibility tree. He is decoration by default on purpose — pass \`label\` only when the mascot is content the reader would miss.

Reduced motion: a prefers-reduced-motion media query sets animation: none on every animated rule, independently of the \`animated\` prop. The expression is in the markup, not in a keyframe, so a still Nino renders the same face.

Colours are component-local custom properties you can override on one instance: --i9k-nino-body, --i9k-nino-screen, --i9k-nino-eye, --i9k-nino-mouth.

IMPORTANT: to nest Nino inside your own <svg> and position him with x/y/width/height, pass size="auto". At any other size the component sets its own inline-size and block-size in CSS, and a CSS length beats the SVG width and height attributes.

Usage:
<I9kNino expression="thinking" look="end" size="lg" label="نينو" />`,
  gotchas: [
    'Nested inside a host <svg>, pass size="auto" — otherwise the component\'s CSS inline-size and block-size override the x/y/width/height attributes you are positioning him with.',
    'Without a `label` he is aria-hidden, so a screen reader never announces him. That is the intended default for decoration; pass the localized name when he is content.',
    '`animated: false` and prefers-reduced-motion are two independent switches. Turning the prop off does not make the media query redundant, and the media query does not make the prop redundant.',
    '`look` moves only the eyes, and start/end are reading-direction, not left/right — they swap on an Arabic page.',
  ],
  demos: [
    {
      label: 'Expression set',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)">
  <I9kNino expression="idle" />
  <I9kNino expression="happy" />
  <I9kNino expression="thinking" />
  <I9kNino expression="worried" />
  <I9kNino expression="surprised" />
  <I9kNino expression="eyes-closed" />
</div>`,
    },
    {
      label: 'Looking around',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)">
  <I9kNino look="center" />
  <I9kNino look="up" />
  <I9kNino look="down" />
  <I9kNino look="start" />
  <I9kNino look="end" />
</div>`,
    },
    {
      label: 'Sizes and a still Nino',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)">
  <I9kNino size="sm" />
  <I9kNino size="md" />
  <I9kNino size="lg" />
  <I9kNino size="lg" expression="worried" :animated="false" />
</div>`,
    },
    {
      label: 'Named, for when the mascot is content',
      code: `<I9kNino size="lg" expression="happy" label="Nino" />`,
    },
  ],
};
