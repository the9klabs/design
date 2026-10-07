import type { ShowcaseEntry } from './types';

export const I9kNinoSkyEntry: ShowcaseEntry = {
  name: 'I9kNinoSky',
  section: 'content',
  summary:
    'A pixel night sky with Nino drifting through it: twinkling dotted stars, two dotted planets, eyes that follow the pointer, and a boop (a new face, a spin and a burst of sparkles) on click, tap, Enter or Space. It has no background of its own and follows the page theme. Made for the space under a footer.',
  agentPrompt: `Use I9kNinoSky from @9klabs/design to end a page with a small moment of delight: a full-width pixel night sky with Nino floating in it.

import { I9kNinoSky } from '@9klabs/design';

Props:
- boopLabel: string (required) — the boop button's accessible name, localized by you, e.g. "Say hi to Nino" / "سلّم على نينو". The sky and Nino are decoration, so this is the scene's one name.
- height?: 'sm' | 'md' | 'lg' (default 'md') — 12rem / 18rem / 24rem.
- animated?: boolean (default true) — false stops the drift, twinkle, spin and sparkles, as prefers-reduced-motion does. Nino still looks at the pointer and changes his face.

Emits:
- boop: [expression] — fired on every click, tap, Enter or Space, with the face Nino just took.

Slots: none.

Behavior: the sky is a transparent <canvas> (aria-hidden) drawn on a 4px grid in the page theme's colours, fading in from its top edge; Nino is the real I9kNino inside a <button>. One animation loop, capped at 30 frames a second, runs only while the sky is on screen and the tab is visible, and never under reduced motion. Nothing the server renders carries a style attribute, so it works under a strict style-src CSP.

Usage, as a full-width band after the footer:
<I9kFooter ... />
<I9kNinoSky boop-label="Say hi to Nino" />`,
  gotchas: [
    'It has no background of its own and follows the page theme: light stars on a dark page, dark dots on a light one, fading in from its top edge. Put it on the page’s own background, not inside a card.',
    'Put it outside I9kContainer: the sky is a full-bleed band, and the container would cut it to the page column.',
    'It adds one tab stop (the boop button) with a visible focus ring.',
    'It makes no sound and tracks nothing; listen to `boop` if your page wants to.',
  ],
  demos: [
    {
      label: 'Small sky',
      code: `<I9kNinoSky boop-label="Say hi to Nino" height="sm" />`,
    },
    {
      label: 'Still (animated off)',
      code: `<I9kNinoSky boop-label="Say hi to Nino" height="sm" :animated="false" />`,
    },
  ],
};
