import type { ShowcaseEntry } from './types';

export const I9kPixelAvatarEntry: ShowcaseEntry = {
  name: 'I9kPixelAvatar',
  section: 'content',
  summary:
    'A pixel identity mark for a person with no photo: a five by five grid mirrored left to right, drawn from a seed such as an account id. The same seed always draws the same face.',
  agentPrompt: `Use I9kPixelAvatar from @9klabs/design as a person's identity mark when there is no photo (a pixel accent, see Foundations, Pixel accents).

import { I9kPixelAvatar } from '@9klabs/design';

Props:
- seed: string (required) — any stable string for the person, such as their account id. It is only hashed in the page, never sent anywhere.
- alt?: string (default '') — empty makes it decorative (aria-hidden); a value makes it role="img" named by it.
- size?: 'sm' | 'md' | 'lg' (default 'md'): sm matches a md control's height, md is 4rem, lg 6rem.

Emits: none. Slots: none.

Behavior: one inline SVG, no request, no style attribute. The colour is the primary or the accent colour, picked by the seed; the background is --pixel-track-color.

IMPORTANT: when a photo exists, use I9kAvatar with it instead. Leave alt empty when the person's name is written beside the mark.

Usage:
<I9kPixelAvatar :seed="user.id" />`,
  gotchas: [
    'Leave `alt` empty when the name is beside it, or a screen reader says the name twice.',
    'A seed that changes (an email that can be corrected) changes the face; prefer an id.',
  ],
  demos: [
    {
      label: 'Different seeds',
      code: `<I9kCluster>
  <I9kPixelAvatar seed="user_1" />
  <I9kPixelAvatar seed="user_2" />
  <I9kPixelAvatar seed="user_3" />
  <I9kPixelAvatar seed="user_4" />
</I9kCluster>`,
    },
    {
      label: 'Sizes',
      code: `<I9kCluster>
  <I9kPixelAvatar seed="user_1" size="sm" />
  <I9kPixelAvatar seed="user_1" size="md" />
  <I9kPixelAvatar seed="user_1" size="lg" />
</I9kCluster>`,
    },
  ],
};
