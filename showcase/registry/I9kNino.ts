import type { ShowcaseEntry } from './types';

export const I9kNinoEntry: ShowcaseEntry = {
  name: 'I9kNino',
  section: 'content',
  summary:
    'Nino, the 9k pixel mascot: an inline-SVG character with six expressions, stepped ambient life, a reaction beat on mood changes, one-shot actions (wave, jump, nod, shake), a talking state, a logical gaze direction, and motion that switches itself off for reduced-motion visitors.',
  agentPrompt: `Use I9kNino from @9klabs/design to put the 9k mascot on a page. He is drawn entirely from rectangles and paths on a 32x32 pixel grid, so there is no image to load and nothing blurs at small sizes. Every motion is stepped like a sprite.

import { I9kNino, I9K_NINO_EXPRESSIONS, I9K_NINO_ACTIONS, type I9kNinoExposed } from '@9klabs/design';

Props:
- expression?: 'idle' | 'happy' | 'thinking' | 'worried' | 'surprised' | 'eyes-closed' (default 'idle'). Only the eyes, brows, cheeks and mouth change. A change plays a 240ms beat: his eyes shut, he hops, and the new face swaps in at 100ms.
- look?: 'center' | 'up' | 'down' | 'start' | 'end' (default 'center') — moves the eyes only. 'start' and 'end' follow the reading direction and swap under [dir="rtl"]. An idle Nino left at 'center' glances around on his own.
- size?: 'sm' | 'md' | 'lg' | 'auto' (default 'md') — 2rem / 3rem / 4.5rem, or 'auto' to drop the component's own CSS sizing.
- animated?: boolean (default true) — removes the class every animation rule hangs off when false.
- talking?: boolean (default false) — flaps his mouth between its own shape and an open frame.
- shadow?: boolean (default false) — a soft shadow under his feet, which shrinks while he jumps. Turn it on only where Nino stands on something; floating in a sky or sitting in a card, he has no ground to cast one on.
- label?: string | null (default null) — the localized name, e.g. 'Nino' or 'نينو'.

Emits: action-end with { action, completed } once per play() call, except a call still running when he unmounts, or one superseded by a call its own action-end handler made: those resolve with completed: false without emitting.
Exposes: play(action: 'wave' | 'jump' | 'nod' | 'shake'): Promise<{ action, completed }>. Hold a template ref and call it from your own events, e.g. a wave when the login page opens, a jump on success, a shake on a wrong password. A newer call cuts the running one off, and the cut-off call settles with completed: false. With animated false or prefers-reduced-motion, play() moves nothing and resolves at once with completed: true.

Accessibility: with a \`label\` he renders role="img" and a <title>; without one he is aria-hidden="true". Pass \`label\` only when the mascot is content the reader would miss.

Colours are component-local custom properties you can override on one instance: --i9k-nino-body, --i9k-nino-screen, --i9k-nino-eye, --i9k-nino-mouth, --i9k-nino-cheek, --i9k-nino-glint.

IMPORTANT: to nest Nino inside your own <svg> and position him with x/y/width/height, pass size="auto". A jump or a raised arm draws outside his box on purpose (overflow: visible), so leave him some room above.

Usage:
<I9kNino ref="nino" expression="thinking" :talking="typing" size="lg" label="نينو" />
await nino.value.play('wave');`,
  gotchas: [
    'Nested inside a host <svg>, pass size="auto" — otherwise the component\'s CSS inline-size and block-size override the x/y/width/height attributes you are positioning him with.',
    'Without a `label` he is aria-hidden, so a screen reader never announces him. That is the intended default for decoration; pass the localized name when he is content.',
    '`animated: false` and prefers-reduced-motion are two independent switches. Turning the prop off does not make the media query redundant, and the media query does not make the prop redundant.',
    '`look` moves only the eyes, and start/end are reading-direction, not left/right — they swap on an Arabic page.',
    'Actions are imperative: hold a template ref and call play(). There is no action prop, so replaying the same action is just calling play() again.',
    'A changed expression shows 100ms later, after his eyes blink shut. Read the prop, not the rendered class, when you test what mood you asked for.',
    'Jumps and waves leave his box. Give him headroom instead of clipping his container with overflow: hidden.',
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
    {
      label: 'Actions, played from your own events',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--component-gap-md)">
  <I9kNino ref="nino" size="lg" />
  <I9kButton size="sm" @click="$refs.nino.play('wave')">Wave</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('jump')">Jump</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('nod')">Nod</I9kButton>
  <I9kButton size="sm" @click="$refs.nino.play('shake')">Shake</I9kButton>
</div>`,
    },
    {
      label: 'Talking in any mood',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: end; gap: var(--component-gap-lg)">
  <I9kNino size="lg" talking />
  <I9kNino size="lg" expression="worried" talking />
</div>`,
    },
  ],
};
