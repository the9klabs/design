import type { ShowcaseEntry } from './types';

export const I9kAnnouncementBarEntry: ShowcaseEntry = {
  name: 'I9kAnnouncementBar',
  section: 'chrome',
  summary:
    'Full-bleed brand-green bar for one short site-wide message, an optional link and a close button, laid out in the shared page column. Placed above I9kNavigation. Stateless: it emits close and the consumer hides it.',
  agentPrompt: `Use I9kAnnouncementBar from @9klabs/design to show one short site-wide announcement above the site header.

import { I9kAnnouncementBar } from '@9klabs/design';

Props:
- href?: string | null (default null) — the link's destination.
- linkLabel?: string | null (default null) — the link's text. The link renders only when both href and linkLabel are non-empty.
- linkComponent?: string | object | null (default null) — render the link with this component instead of a plain <a>, receiving the destination as \`to\` rather than \`href\`. Pass an imported component (RouterLink, NuxtLink), not its name as a string.
- closeLabel?: string (default '') — the close button's accessible name, such as "Close announcement". Required whenever the bar is dismissible.
- label?: string (default 'Announcement') — the accessible name of the bar's <aside> landmark. Translate it on a localized page.
- dismissible?: boolean (default true) — false renders no close button.

Emits: close — [], fired when the close button is clicked.

Slots: default — the message text. Keep it to one short sentence; the link follows it on the same line and wraps under it on a narrow screen.

IMPORTANT: the bar never hides itself. Listen for close, remove the bar (v-if), and remember the choice (for example in localStorage or a cookie, keyed by the announcement) so it stays closed on the next page.

Placement: render it before I9kNavigation, as its sibling — not inside it. The bar is not sticky, so it scrolls away while the sticky navigation stays. Its content sits in an I9kContainer, so the message starts where the navigation's brand does; do not wrap the bar in another container.

Usage:
<I9kAnnouncementBar
  v-if="!closed"
  href="/changelog"
  link-label="Read the changelog"
  close-label="Close announcement"
  @close="closed = true"
>
  Version 2 is out.
</I9kAnnouncementBar>
<I9kNavigation :links="links" />`,
  gotchas: [
    'Stateless: clicking close only emits `close`. The consumer removes the bar and remembers the choice; without that it stays on screen and comes back on every page.',
    'The link renders only when both `href` and `linkLabel` are non-empty — one without the other renders the message alone.',
    'Place it above I9kNavigation, as a sibling, never inside it. It is not sticky: it scrolls away and the navigation stays pinned.',
    'Give `closeLabel` whenever the bar is dismissible: the close button is an icon, and an empty label leaves it with no accessible name.',
    'Use `:dismissible="false"` for a preview of the bar (for example in an admin form), where closing it would mean nothing.',
    'The fill is the brand green in both themes, and the bar re-maps the theme tokens its close button reads so the icon, hover and focus ring stay visible on it.',
  ],
  demos: [
    {
      label: 'With a link',
      code: `<I9kAnnouncementBar href="/changelog" link-label="Read the changelog" close-label="Close announcement">
  Version 2 is out.
</I9kAnnouncementBar>`,
    },
    {
      label: 'Without a link',
      code: `<I9kAnnouncementBar close-label="Close announcement">
  Scheduled maintenance on Sunday from 02:00 to 03:00 UTC.
</I9kAnnouncementBar>`,
    },
    {
      label: 'Not dismissible (preview)',
      code: `<I9kAnnouncementBar :dismissible="false" href="/changelog" link-label="Read the changelog">
  Version 2 is out.
</I9kAnnouncementBar>`,
    },
    {
      label: 'RTL',
      code: `<div lang="ar" dir="rtl">
  <I9kAnnouncementBar label="إعلان" href="/changelog" link-label="اقرأ سجل التغييرات" close-label="إغلاق الإعلان">
    صدر الإصدار الثاني.
  </I9kAnnouncementBar>
</div>`,
    },
  ],
};
