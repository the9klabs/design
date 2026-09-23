import type { ShowcaseEntry } from './types';

export const I9kPageContainerEntry: ShowcaseEntry = {
  name: 'I9kPageContainer',
  section: 'layout',
  summary:
    'Centered, width-capped page wrapper with a size-driven horizontal gutter and a minimum height, in the shared page column. Use it once per page as the outermost content wrapper; for a section of a page use I9kContainer.',
  agentPrompt: `Use I9kPageContainer from @9klabs/design as the outermost wrapper for a page's content.

import { I9kPageContainer } from '@9klabs/design';

Props:
- as?: string | Component (default 'div') — the rendered root tag or component.
- size?: 'sm' | 'md' | 'lg' (default 'md') — sets the inline gutter (padding-inline) only.

Emits: none.

Slots: default — the page content.

Behavior: renders a flex column whose content is the shared page column wide (--container-width-md, 75rem, the same measure I9kContainer, I9kNavigation and I9kFooter use), with the gutter outside that column, centered with \`margin-inline: auto\`, and a \`min-height: calc(100vh - 250px)\` so short pages still fill the viewport. Below a 768px viewport the width becomes 100% and the gutter is forced to the 'sm' spacing regardless of the \`size\` prop.

IMPORTANT: \`size\` only changes the horizontal gutter — it does not change the column width or add vertical spacing between children. Wrap groups of children yourself (e.g. in I9kCluster or a styled div) if they need gaps. Only 'md' keeps the content aligned with the header and footer on a viewport narrower than the column; 'sm' and 'lg' change the gutter and so the alignment there.

IMPORTANT: for one section of a page, or a wrapper that must not impose a minimum height or a flex column, use I9kContainer instead.

Usage:
<I9kPageContainer size="md"><I9kText variant="lede">Welcome</I9kText><I9kPanel size="sm">Page content</I9kPanel></I9kPageContainer>`,
  gotchas: [
    '`size` only sets the horizontal gutter (padding-inline) — the column width is the shared `--container-width-md` regardless of size.',
    'Below 768px viewports the gutter always drops to the `sm` spacing, overriding whatever `size` was passed.',
    'The container does not space its children vertically; group related content yourself.',
    'It is a page wrapper: a flex column with a minimum height. For a section, or anything that must not set those, use I9kContainer, which shares the column.',
  ],
  demos: [
    {
      label: 'Default',
      code: `<I9kPageContainer style="min-height: 12rem; outline: 1px dashed var(--border-color)">
  <I9kText variant="lede">A centered page container in the shared page column, with responsive gutters.</I9kText>
  <I9kPanel size="sm">Page content</I9kPanel>
</I9kPageContainer>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: grid; gap: var(--spacing-8)">
  <I9kPageContainer size="sm" style="min-height: 6rem; outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Small gutter</I9kPanel></I9kPageContainer>
  <I9kPageContainer size="lg" style="min-height: 6rem; outline: 1px dashed var(--border-color)"><I9kPanel size="sm">Large gutter</I9kPanel></I9kPageContainer>
</div>`,
    },
  ],
};
