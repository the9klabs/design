import type { ShowcaseEntry } from './types';

export const I9kNinoSkyEntry: ShowcaseEntry = {
  name: 'I9kNinoSky',
  section: 'content',
  summary:
    'A pixel night sky with Nino drifting through it: twinkling dotted stars, two dotted planets, eyes that follow the pointer, a boop (a new face, a spin and a burst of sparkles) on click, tap, Enter or Space, and a drag: pick Nino up, throw him around the window, and if he comes to rest above the sky he swoops back to it, dizzy. It has no background of its own and follows the page theme. Made for the space under a footer.',
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

Drag and throw: pressing Nino and moving more than 4px picks him up; he follows the pointer anywhere in the window and is thrown with the pointer's speed when let go. In flight he floats (no gravity), slows down, and bounces off the window's edges. Coming to rest inside the sky, he drifts home; above it, he swoops straight back and plays I9kNino's dizzy expression and action. With animated false or reduced motion he can still be dragged, but there is no throw. A drag never boops; Enter and Space always do.

Usage, as a full-width band after the footer:
<I9kFooter ... />
<I9kNinoSky boop-label="Say hi to Nino" />`,
  gotchas: [
    'It has no background of its own and follows the page theme: light stars on a dark page, dark dots on a light one, fading in from its top edge. Put it on the page’s own background, not inside a card.',
    'Put it outside I9kContainer: the sky is a full-bleed band, and the container would cut it to the page column.',
    'It adds one tab stop (the boop button) with a visible focus ring.',
    'It makes no sound and tracks nothing; listen to `boop` if your page wants to.',
    'While airborne, Nino is `position: fixed` with z-index 300, so he flies over the page. An ancestor with a transform, filter, perspective, `contain: paint` or `will-change: transform` becomes his containing block and bounds him to itself instead of the window, so keep the sky out of one.',
    'The Nino button sets `touch-action: none`: a swipe that starts on him drags him instead of scrolling the page. Swipes elsewhere in the sky still scroll.',
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
