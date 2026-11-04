import type { ShowcaseEntry } from './types';

// A 2:1 cover drawn inline, so the demos need no asset. An inline image is ready at once, so
// it appears without a reveal; the reveal shows only for an image the visitor waited for.
const COVER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23125f35'/%3E%3Ccircle cx='300' cy='70' r='90' fill='%23e85a02'/%3E%3Crect x='40' y='120' width='200' height='40' rx='8' fill='%23fff'/%3E%3C/svg%3E";

export const I9kRevealImageEntry: ShowcaseEntry = {
  name: 'I9kRevealImage',
  section: 'content',
  summary:
    'An image below the first screen that loads only as it comes near the view. While it loads, a placeholder of its exact size shows the pixel 9k mark; when the visitor waited for it, the placeholder breaks into squares that clear in a random order. An image that is ready at once just appears.',
  agentPrompt: `Use I9kRevealImage from @9klabs/design for an image below the first screen, such as a course card's cover, so it loads only as it comes near the view.

import { I9kRevealImage } from '@9klabs/design';

Props:
- src: string (required) — the image.
- alt: string (required) — its alternative text; pass '' for a decorative image.
- width, height: number | string (both required) — the image's intrinsic size. They set the box's shape, so the placeholder takes exactly the image's space.
- srcset?: string, sizes?: string — passed to the <img> as they are.
- eager?: boolean (default false) — for an image in the first screen: renders only <img loading="eager" fetchpriority="high" decoding="async">, with no placeholder, observer or reveal.

Emits: load and error, each with the image's native event.

Slots: none.

Behavior: the server renders a wrapper, a placeholder (aria-hidden) and <img loading="lazy" decoding="async"> with every attribute, so without JavaScript the browser's own lazy loading still loads it. Once mounted, the component watches the wrapper with an IntersectionObserver whose margin is about a third of a screen (REVEAL_ROOT_MARGIN). If the first report finds the image far away, its src, srcset and sizes are taken off until it comes near. An image that takes at least REVEAL_IF_WAITED_MS from its request to its load reveals through a canvas of 16 by 8 squares over REVEAL_DURATION_MS; a faster one just appears. Under prefers-reduced-motion the mark stands still and the image appears without the reveal. An image that fails keeps the mark, standing still. The root's data-state names the state: native, waiting, loading, revealing, shown or failed.

The placeholder's fill is the theme's sunken surface (--surface-sunken-color), overridable with --i9k-reveal-image-fill on the root; the mark keeps its own orange and green. --i9k-reveal-image-mark-size sets the mark's width.

It renders no style attribute on the server and injects no styles: the box's aspect-ratio is set from the script after mount, so it works under a Content-Security-Policy of style-src 'self'.

Usage:
<I9kRevealImage :src="cover" :srcset="coverSrcset" sizes="(max-width: 768px) 100vw, 24rem" alt="" width="1774" height="887" />`,
  gotchas: [
    'Never use the lazy form for an image in the first screen: pass `eager`, or the image waits for the script and the observer.',
    'A class or other attribute lands on the wrapper when lazy and on the <img> when `eager`, because each is the root. Style the image through the wrapper (the <img> fills it with object-fit: cover).',
    'The wrapper is a block that takes its width from its container and its height from width and height. Give it an explicit height only when the container sets the shape, as I9kBandanaAvatar does.',
    'An image already in the browser cache appears at once, with no placeholder and no reveal, on purpose.',
    'Changing src after mount does not restart the placeholder: key the component on the image when one instance shows different images.',
  ],
  demos: [
    {
      label: 'A cover (an inline image is ready at once, so it appears without a reveal)',
      code: `<div style="max-width: 24rem">
  <I9kRevealImage src="${COVER}" alt="A course cover" width="400" height="200" />
</div>`,
    },
    {
      label: 'An image that fails keeps the mark, standing still',
      code: `<div style="max-width: 24rem">
  <I9kRevealImage src="/this-image-does-not-exist.webp" alt="A missing image" width="400" height="200" />
</div>`,
    },
  ],
};
