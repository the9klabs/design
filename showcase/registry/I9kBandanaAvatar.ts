import type { ShowcaseEntry } from './types';

// Stand-ins drawn inline, so the demos need no asset: a face whose eyes sit
// where the default bandana position expects them, and an orange band.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23cfe6d8'/%3E%3Ccircle cx='114' cy='98' r='58' fill='%23e8b98a'/%3E%3Ccircle cx='94' cy='92' r='7' fill='%23222'/%3E%3Ccircle cx='136' cy='92' r='7' fill='%23222'/%3E%3Cpath d='M92 128q22 16 44 0' fill='none' stroke='%23222' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

const BANDANA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 330 100'%3E%3Cpath d='M0 22q165-30 330 0v56q-165 30-330 0z' fill='%23e85a02'/%3E%3Cellipse cx='96' cy='50' rx='26' ry='15' fill='%23fff'/%3E%3Cellipse cx='234' cy='50' rx='26' ry='15' fill='%23fff'/%3E%3C/svg%3E";

export const I9kBandanaAvatarEntry: ShowcaseEntry = {
  name: 'I9kBandanaAvatar',
  section: 'content',
  summary:
    'A large round photo of a person with a bandana that draws itself across the eyes, once when the images load and again when a pointer enters. The bandana never shows for people who prefer reduced motion.',
  agentPrompt: `Use I9kBandanaAvatar from @9klabs/design for the large round photo of the site's author, with the bandana that draws itself over the eyes.

import { I9kBandanaAvatar } from '@9klabs/design';

Props:
- src: string (required) — the photo. Each site hosts its own file; use a square image about twice the displayed size.
- alt: string (required) — the photo's alternative text. Pass '' when the person is already named beside the avatar.
- bandanaSrc: string (required) — the bandana: a wide image with a transparent background.
- size?: 'sm' | 'md' | 'lg' (default 'md') — 8rem, 11rem or 14rem across.
- loading?: 'eager' | 'lazy' (default 'eager') — pass 'lazy' when the avatar is below the fold. It applies to both images.

Emits: none.

Slots: none.

Behavior: the photo is cropped to a circle with a primary-colour border and a soft ring. The bandana is decorative (alt="", aria-hidden). It draws itself from left to right, holds, and fades: once, when both images have loaded (also when they had loaded before the component hydrated), and again each time a pointer enters the avatar. Under prefers-reduced-motion it stays hidden and nothing moves.

Sizing and placement are CSS custom properties on the root, which a caller may set from its own stylesheet:
- --i9k-bandana-avatar-size — the diameter (the size prop sets it).
- --i9k-bandana-avatar-bandana-top, -left, -width (percentages of the photo) and -tilt (an angle) — where the bandana sits. The defaults (38%, 35%, 44%, -2deg) fit the photo the component was drawn for.

It renders no style attribute and injects no styles, so it works under a Content-Security-Policy of style-src 'self'.

Usage:
<I9kBandanaAvatar src="/img/avatar.webp" bandana-src="/img/avatar-bandana.webp" alt="Abdelrahman Ismail" />`,
  gotchas: [
    'The bandana position is tuned to one photo. Another photo needs its own --i9k-bandana-avatar-bandana-* values, set where the eyes are.',
    'The bandana is placed with `left`, on purpose: the photo does not mirror in a right-to-left page, so the bandana must not either.',
    'The component does not resize or convert images. Give it files already sized for the display; a multi-megabyte photo ships as it is.',
    'There is no bandana for people who prefer reduced motion, and none before the images load, so never rely on it to carry meaning.',
  ],
  demos: [
    {
      label: 'Sizes (move a pointer over one to draw the bandana again)',
      code: `<div style="display: flex; gap: var(--spacing-11); align-items: center; padding: var(--spacing-8)">
  <I9kBandanaAvatar src="${PHOTO}" bandana-src="${BANDANA}" alt="A person" size="sm" />
  <I9kBandanaAvatar src="${PHOTO}" bandana-src="${BANDANA}" alt="A person" size="md" />
  <I9kBandanaAvatar src="${PHOTO}" bandana-src="${BANDANA}" alt="A person" size="lg" />
</div>`,
    },
  ],
};
