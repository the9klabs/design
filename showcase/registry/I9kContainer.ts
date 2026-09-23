import type { ShowcaseEntry } from './types';

export const I9kContainerEntry: ShowcaseEntry = {
  name: 'I9kContainer',
  section: 'layout',
  summary:
    'The page column: a centred, width-capped wrapper that sets only width and centring, so a section, a main or a bar of chrome all share one measure. I9kNavigation, I9kFooter and I9kPageContainer already sit in it.',
  agentPrompt: `Use I9kContainer from @9klabs/design to put a page section, a <main> or any full-width band's content in the shared page column, so it lines up with the site header and footer.

import { I9kContainer } from '@9klabs/design';

Props:
- as?: string | Component (default 'div') — the rendered root tag or component, e.g. 'section' or 'main'.
- size?: 'sm' | 'md' | 'lg' (default 'md') — which column: 'md' is the site column (--container-width-md, 75rem), 'sm' a reading column for long text (42rem), 'lg' a wide, desktop-first work area (90rem).

Emits: none.

Slots: default — the content.

Behavior: the root is exactly the column wide once the viewport allows it, and centred. On a narrower viewport it keeps a gutter on each side (--container-gutter, 2rem; 1rem at 768px and below). The gutter is a margin, not padding, so the column's edge is where content starts and a child with width: 100% fills exactly the column. It sets nothing else: no padding, background, flex or min-height.

Alignment: I9kNavigation's bar and I9kFooter's content render inside an I9kContainer of their own, and I9kPageContainer derives its width from the same token, so anything you put in an I9kContainer lines up with the brand in the header and the columns in the footer. To give a whole area the wide column, chrome included (an admin area, say), redefine --container-width-md: var(--container-width-lg) on that area's root element instead of passing size="lg" to each container.

IMPORTANT: a background or a full-bleed band goes on the element around the container, not on it: a <section> with the fill wraps the I9kContainer that holds the content.

IMPORTANT: do not nest one I9kContainer inside another. The inner one measures its 100% from the outer column and takes the gutter off again, so on a phone the content loses the gutter twice. A narrower block inside a column is a plain element with max-width and margin-inline: auto.

Usage:
<section class="pricing">
  <I9kContainer>
    <I9kSectionHeading title="Pricing" />
    <I9kGrid :columns="3">…</I9kGrid>
  </I9kContainer>
</section>

<I9kContainer as="main" size="sm">
  <I9kText v-for="paragraph in terms" :key="paragraph">{{ paragraph }}</I9kText>
</I9kContainer>`,
  gotchas: [
    "It sets only width and centring. Padding, backgrounds, flex and min-height are the caller's; a full-bleed band is an element around the container.",
    'Do not nest containers: the inner one takes the gutter off a second time on narrow viewports. A narrower block inside a column is `max-width` + `margin-inline: auto`.',
    "`size` picks the column (`--container-width-sm|md|lg`), not the gutter. To widen a whole area including its header and footer, redefine `--container-width-md` on the area's root.",
    'I9kNavigation and I9kFooter already render their content in one; do not wrap them in another container.',
  ],
  demos: [
    {
      label: 'Default',
      code: `<I9kContainer style="outline: 1px dashed var(--border-color)">
  <I9kText variant="lede">The site column. The header's brand and the footer's columns start on this same line.</I9kText>
</I9kContainer>`,
    },
    {
      label: 'Columns',
      code: `<div style="display: grid; gap: var(--spacing-8)">
  <I9kContainer size="sm" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Reading column (sm)</I9kPanel></I9kContainer>
  <I9kContainer size="md" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Site column (md)</I9kPanel></I9kContainer>
  <I9kContainer size="lg" style="outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Wide work area (lg)</I9kPanel></I9kContainer>
</div>`,
    },
    {
      label: 'Content in a full-bleed band',
      code: `<section style="padding-block: var(--spacing-13); background: var(--surface-sunken-color)">
  <I9kContainer as="div" style="outline: 1px dashed var(--border-color)">
    <I9kText>The band fills the page; only its content keeps to the column.</I9kText>
  </I9kContainer>
</section>`,
    },
  ],
};
