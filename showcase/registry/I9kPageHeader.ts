import type { ShowcaseEntry } from './types';

export const I9kPageHeaderEntry: ShowcaseEntry = {
  name: 'I9kPageHeader',
  section: 'content',
  summary:
    'Large hero-style heading for the top of a page, with optional subtitle, description, actions, and avatar. Use it once per page, at the top.',
  agentPrompt: `Use I9kPageHeader from @9klabs/design for the hero heading at the top of a page.

import { I9kPageHeader } from '@9klabs/design';

Props:
- title: string (required)
- description?: string | null (default null)
- id?: string | null (default null) — set on the rendered heading element.
- level?: 1 | 2 | 3 | 4 | 5 | 6 (default 1) — the rendered heading level (renders <h{level}>).
- compactOnMobile?: boolean (default false) — up to 768px wide, sets the title at a section heading's size and, with an avatar, puts a smaller avatar (5.5rem) beside the title, with the subtitle, description and actions full width below, read from the start edge. Wider viewports are unchanged.

Emits: none.

Slots:
- subtitle — rendered directly under the title, above the description.
- actions — rendered after the description, e.g. for buttons.
- avatar — when present, switches the header to a side-by-side layout with the avatar next to the title/description/actions block, stacking to centered-column on narrow viewports.

Behavior: the layout only changes shape when the avatar slot is used — with no avatar slot, everything renders as a single stacked column.

Compact on phones: pass compactOnMobile for a header that is not the page's main heading (for example a person's introduction lower on a page) and should not take a phone's whole first screen. The design system's I9kAvatar and I9kBandanaAvatar in the avatar slot shrink by themselves (override --i9k-page-header-compact-avatar-size on the header to change it); other avatar content keeps its own size. --i9k-page-header-compact-title-size sets the compact title size.

IMPORTANT: use I9kPageHeader once per page, at the top — it renders a display-scale title (clamp up to 4rem) meant for the page's main heading, not for section headings (use I9kSectionHeading for those).

Usage:
<I9kPageHeader title="Practical AI from someone who ships." description="Practical talks for builders and technology teams, grounded in real product work."><template #actions><I9kButton variant="primary">Book a session</I9kButton></template></I9kPageHeader>`,
  gotchas: [
    'Reserve I9kPageHeader for the single main heading at the top of a page — use I9kSectionHeading for headings inside the page body.',
    'The side-by-side avatar layout only activates when the `avatar` slot is filled; otherwise the header always stacks in one column.',
    '`compactOnMobile` changes nothing above 768px. Below it, only I9kAvatar and I9kBandanaAvatar in the `avatar` slot are resized; size any other avatar content yourself.',
  ],
  demos: [
    {
      label: 'Default',
      code: `<I9kPageHeader title="Practical AI from someone who ships." description="Practical talks for builders and technology teams, grounded in real product work." />`,
    },
    {
      label: 'With avatar and actions',
      code: `<I9kPageHeader title="Abdelrahman Ismail" description="Software engineer sharing how AI is changing the way software gets built.">
  <template #avatar>
    <img alt="" src="https://avatars.githubusercontent.com/u/20756985?s=160&v=4" width="112" height="112" style="border-radius: 50%" />
  </template>
  <template #actions>
    <div class="cluster"><I9kButton variant="primary">Invite Ismail</I9kButton></div>
  </template>
</I9kPageHeader>`,
    },
    {
      label: 'Compact on phones',
      code: `<I9kPageHeader title="Hi, I'm Abdelrahman Ismail" :level="2" compact-on-mobile>
  <template #subtitle>
    <I9kText as="p" variant="lede">Software engineer sharing how AI is changing the way software gets built.</I9kText>
  </template>
  <template #avatar>
    <I9kAvatar src="https://avatars.githubusercontent.com/u/20756985?s=160&v=4" alt="" size="lg" />
  </template>
  <template #actions>
    <I9kButton variant="link" href="https://ismail9k.com">More about me</I9kButton>
  </template>
</I9kPageHeader>`,
    },
  ],
};
