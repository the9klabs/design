import type { ShowcaseEntry } from './types';

// A tiny sticker drawn inline, so the demos need no asset: a white die-cut
// border, a light body and dark line art on a transparent background.
const DEMO_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='6' y='6' width='88' height='88' rx='22' fill='%23fff'/%3E%3Crect x='14' y='14' width='72' height='72' rx='16' fill='%23eef0f6' stroke='%23111' stroke-width='5'/%3E%3Cpath d='M50 26l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z' fill='none' stroke='%23111' stroke-width='5' stroke-linejoin='round'/%3E%3C/svg%3E";

export const I9kStickerEntry: ShowcaseEntry = {
  name: 'I9kSticker',
  section: 'content',
  summary:
    'A die-cut sticker with a holographic foil that follows the pointer, for a badge a person has earned. The foil is drawn over the sticker image and clipped to its shape; it stands still for people who prefer reduced motion.',
  agentPrompt: `Use I9kSticker from @9klabs/design to show an earned badge as a holographic sticker.

import { I9kSticker } from '@9klabs/design';

Props:
- src: string (required) — the sticker art: dark line art on a light fill, a white die-cut border, and a transparent background (PNG, WebP or SVG). The foil takes the light areas and leaves the dark lines dark.
- alt: string (required) — the sticker's accessible name.
- size?: 'sm' | 'md' | 'lg' (default 'md') — 4rem, 6rem or 8rem square.

Emits: none.

Slots: none.

Behavior: renders an inline SVG with role="img" named by alt. A rainbow gradient is masked by the image's own alpha and multiplied over it. Moving a pointer over the sticker slides the foil (a custom property set from script, never a style attribute, so it is safe under style-src 'self'); leaving eases it back. A focused link around the sticker plays one sweep. Under prefers-reduced-motion the foil stands still at a fixed angle.

IMPORTANT: to make a sticker a link, wrap it in your own <a> or router link. The sticker's alt then names the link, so write alt as the link's text ("View the certificate for Git").

Usage:
<I9kSticker src="/stickers/early-adopter.webp" alt="Early adopter" size="lg" />`,
  gotchas: [
    'The image needs a transparent background: the foil is clipped to its alpha, so an opaque square image gets a square foil.',
    'Dark areas stay dark under the foil and light areas take its colours, so draw the art as dark lines on a light fill.',
    'There is no href prop. Wrap the sticker in a link and let its alt name that link.',
    'No device-tilt effect: it would need a motion-permission prompt on iOS.',
  ],
  demos: [
    {
      label: 'Sizes',
      code: `<div style="display: flex; gap: var(--spacing-8); align-items: center">
  <I9kSticker src="${DEMO_SRC}" alt="Star" size="sm" />
  <I9kSticker src="${DEMO_SRC}" alt="Star" size="md" />
  <I9kSticker src="${DEMO_SRC}" alt="Star" size="lg" />
</div>`,
    },
    {
      label: 'As a link',
      code: `<a href="#certificate"><I9kSticker src="${DEMO_SRC}" alt="View the certificate" size="lg" /></a>`,
    },
  ],
};
