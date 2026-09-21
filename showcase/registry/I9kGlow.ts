import type { ShowcaseEntry } from './types';

export const I9kGlowEntry: ShowcaseEntry = {
  name: 'I9kGlow',
  section: 'chrome',
  summary:
    'Decorative, non-interactive page background: one large, soft, film-grained glow in the brand green, amber, and orange, half off-screen at an edge or corner, drifting slowly.',
  agentPrompt: `Use I9kGlow from @9klabs/design as a decorative ambient background layer, mounted once near the root of a page, behind your real content. It is the single-glow alternative to I9kBlurredCircles; use one or the other, not both.

import { I9kGlow } from '@9klabs/design';

Props:
- position?: 'top' | 'top-start' | 'top-end' | 'start' | 'end' | 'center' (default 'end') — where the glow sits. Every value except 'center' centres it on that edge or corner, so half of it is off-screen. 'start' and 'end' are logical: they follow the reading direction, so 'end' is the right edge in English and the left edge in Arabic. An unknown value falls back to 'end'.
Emits: none. Slots: none.

Behavior: it renders \`position: fixed; inset: 0; pointer-events: none;\` with \`aria-hidden="true"\` — it covers the ENTIRE VIEWPORT, not just its parent element, sits behind content only because of normal DOM/stacking order (it has no \`z-index\`), and never intercepts clicks. The glow drifts slowly via CSS animation, which is disabled under \`prefers-reduced-motion\`. Under an ancestor with the \`dark\` class it switches to a dimmer, green-led palette on its own.

IMPORTANT: because it is \`position: fixed\`, mounting it anywhere covers the whole browser viewport — it does NOT stay confined to a parent container. To scope it to one section, wrap it in an ancestor with \`transform: translateZ(0)\` (or any non-none \`transform\`/\`filter\`/\`contain: paint\`) plus \`overflow: hidden\`.

IMPORTANT: its colours use CSS relative colour syntax (\`oklch(from …)\`). A browser without it (roughly Chrome before 119, Safari before 18, Firefox before 128) shows no glow at all rather than a broken one.

Usage:
<body>
  <I9kGlow position="top-end" />
  <!-- rest of the page, stacked above it by DOM order -->
</body>`,
  gotchas: [
    'It is `position: fixed` and covers the entire browser viewport, regardless of where in the DOM it is mounted or how its parent is sized.',
    'To confine it to one container (as in these demos), give an ancestor `transform`/`filter`/`contain: paint` plus `overflow: hidden`.',
    '`start` and `end` are logical, so `position="end"` sits on the left edge of a right-to-left page.',
    'Mount it once per page, and not alongside I9kBlurredCircles — both are full-viewport layers.',
  ],
  demos: [
    {
      label: 'Default: centred on the inline end edge',
      code: `<div
  style="position: relative; height: 240px; overflow: hidden; border: 1px solid var(--border-color); border-radius: var(--radius-md); transform: translateZ(0);"
>
  <I9kGlow />
  <p style="position: relative; margin: 0; padding: var(--spacing-8); color: var(--theme-text-color);">
    Real page content stacks above this ambient background layer.
  </p>
</div>`,
    },
    {
      label: 'position="top": a wide dome behind a header',
      code: `<div
  style="position: relative; height: 240px; overflow: hidden; border: 1px solid var(--border-color); border-radius: var(--radius-md); transform: translateZ(0);"
>
  <I9kGlow position="top" />
  <p style="position: relative; margin: 0; padding: var(--spacing-8); color: var(--theme-text-color);">
    Real page content stacks above this ambient background layer.
  </p>
</div>`,
    },
  ],
};
