import type { ShowcaseEntry } from './types';

export const I9kTooltipEntry: ShowcaseEntry = {
  name: 'I9kTooltip',
  section: 'feedback',
  summary:
    'A short plain-text note above an element, shown on hover, keyboard focus or tap. It also describes the element to assistive technology.',
  agentPrompt: `Use I9kTooltip from @9klabs/design to explain an element in a sentence, such as who a course level is for.

import { I9kTooltip } from '@9klabs/design';

Props:
- text: string (required) — the tooltip's words; plain text only.

Emits: none.

Slots:
- default({ describedBy }) — the trigger. Bind describedBy to the trigger's aria-describedby, and make the trigger focusable (a button, a link, or tabindex="0").

Behavior: the bubble has role="tooltip" and is hidden by the hidden attribute until opened. It opens on mouse or pen hover and on keyboard focus, and closes when the pointer or focus leaves. A tap toggles it, because a finger has no hover; a tap elsewhere closes it. Escape closes it without moving the pointer or the focus, and the pointer can move onto the bubble without closing it (WCAG 1.4.13). It sits above the trigger, aligned to its start edge in either reading direction, and never wider than the screen.

IMPORTANT: never put anything a reader must act on, or must read to use the page, only in a tooltip; it is hidden until asked for.

Usage:
<I9kTooltip text="Up to 2 years in a real team." v-slot="{ describedBy }">
  <button type="button" :aria-describedby="describedBy">Junior</button>
</I9kTooltip>`,
  gotchas: [
    'The trigger must take focus, or a keyboard can never open it.',
    'Bind `describedBy`, or a screen reader never hears the text.',
    'The bubble is hidden by the `hidden` attribute, not an inline style, so a strict style-src CSP cannot show it open before hydration.',
  ],
  demos: [
    {
      label: 'On a button',
      code: `<I9kTooltip text="Up to 2 years in a real team; you ship tasks with someone reviewing them." v-slot="{ describedBy }">
  <I9kButton :aria-describedby="describedBy">Junior</I9kButton>
</I9kTooltip>`,
    },
    {
      label: 'Arabic',
      code: `<div dir="rtl" lang="ar">
  <I9kTooltip text="لحد سنتين في فريق حقيقي، وبتسلّم tasks بمراجعة." v-slot="{ describedBy }">
    <I9kButton :aria-describedby="describedBy">جونيور</I9kButton>
  </I9kTooltip>
</div>`,
    },
  ],
};
