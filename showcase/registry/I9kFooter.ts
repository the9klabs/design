import type { ShowcaseEntry } from './types';

export const I9kFooterEntry: ShowcaseEntry = {
  name: 'I9kFooter',
  section: 'chrome',
  summary:
    "A page's bottom chrome. On its own it is a centred row of social links and a tagline; given link columns or a brand it becomes a multi-column site footer with a bottom bar.",
  agentPrompt: `Use I9kFooter from @9klabs/design as a page's <footer>.

import { I9kFooter, type I9kFooterColumn } from '@9klabs/design';

It has two layouts, chosen by what you pass:
- Centred (default): social links, then the tagline, then the utilities slot, stacked and centred. Suits a narrow page such as a link-in-bio.
- Multi-column: used as soon as \`columns\` is non-empty or the \`brand\` slot is filled. A brand block (brand, tagline, copyright) sits beside the link columns; social links and the utilities slot share a bottom bar under a divider. The grid has one track per column, up to four across; more wrap onto another row. Columns stack under the brand, two across, at 768px and below.

Props:
- tagline?: string | null (default null) — plain text; replaced by the default slot when that is used.
- socialLinks?: I9kSocialLink[] (default []) — rendered via I9kSocialLinks; { name: string; url: string; label?: string; icon?: I9kIconName }. That type is not exported — inline the shape.
- socialLabels?: boolean (default false) — show text labels next to each social icon.
- followLabel?: (platform: string) => string — accessible name for each social link, forwarded to I9kSocialLinks (its default is "Follow on {platform}"). Pass a translated function for non-English pages.
- columns?: I9kFooterColumn[] (default []) — { id: string; title: string; links: I9kFooterLink[] }. A link is { id: string; label: string; href: string; external?: boolean; featured?: boolean; emoji?: string }.
- copyright?: string | null (default null) — small line under the tagline in the brand block.
- brandHref?: string (default '/') and brandLabel?: string (default 'Home') — target and accessible name of the link wrapping the brand slot.
- navLabel?: string (default 'Footer') — aria-label of the columns' <nav>.
- linkComponent?: string | object | null (default null) — e.g. RouterLink or NuxtLink. Receives \`to\` for the brand and for site-relative links only.

Emits:
- socialClick — [item: I9kSocialLink, event: MouseEvent]
- navigate — [link: I9kFooterLink, event: MouseEvent], for any column link.

Slots:
- brand — the wordmark or logo; wrapped in a link to brandHref. Filling it alone switches to the multi-column layout.
- default — replaces the tagline paragraph.
- utilities — end of the bottom bar (or after the tagline when centred): a language switcher, a theme switcher, a markdown link.
- social-icon — forwarded to I9kSocialLinks' icon slot; receives item.

IMPORTANT: only site-relative hrefs (a single leading "/") go through linkComponent. https:, mailto:, tel: and protocol-relative "//host" links always render a plain <a>, so a router never tries to resolve them.

IMPORTANT: external: true opens the link in a new tab with rel="noopener" and adds a decorative arrow that mirrors in RTL. Leave it off for mailto: links.

IMPORTANT: column headings are <h2>. Column titles and link labels are rendered as given — translate them before passing.

Usage:
<I9kFooter
  :columns="[
    { id: 'explore', title: 'Explore', links: [{ id: 'blog', label: 'Blog', href: '/blog' }] },
    { id: 'more', title: 'More from me', links: [{ id: 'school', label: '9k School', href: 'https://9k.school', external: true, featured: true, emoji: '🎓' }] },
  ]"
  tagline="Built with the 9k design system."
  copyright="© 2026 Ismail9k"
  :social-links="[{ name: 'GitHub', url: 'https://github.com/ismail9k', icon: 'github' }]"
  :link-component="RouterLink"
  @navigate="onNavigate"
>
  <template #brand><I9kBrandWordmark /></template>
  <template #utilities><I9kLanguageSwitcher label="العربية" code="ar" href="/ar" /></template>
</I9kFooter>`,
  gotchas: [
    'The layout switches on `columns.length` or a filled `brand` slot — pass neither and you get the centred stack, even if you set `copyright` (which only renders in the multi-column brand block).',
    'Only site-relative hrefs (a single leading "/") are handed to `linkComponent`; `https:`, `mailto:`, `tel:` and protocol-relative `//host` links always render plain anchors.',
    '`external: true` adds `target="_blank"`, `rel="noopener"` and an aria-hidden arrow. Do not set it on `mailto:` links.',
    'The default slot fully replaces the tagline paragraph rather than appending to it.',
    'The social row only renders when `socialLinks` is non-empty. I9kSocialLink is not exported — inline its shape.',
    'The multi-column footer sets its own 1000px measure and gutter to match I9kPageContainer; do not wrap it in another container.',
  ],
  demos: [
    {
      label: 'Multi-column site footer',
      code: `<div style="position: relative; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
  <I9kFooter
    tagline="Built with the 9k design system."
    copyright="© 2026 Ismail9k"
    brand-href="#"
    brand-label="Ismail9k, Home"
    :columns="[
      { id: 'explore', title: 'Explore', links: [
        { id: 'blog', label: 'Blog', href: '#blog' },
        { id: 'talks', label: 'Talks', href: '#talks' },
        { id: 'uses', label: 'Uses', href: '#uses' },
      ] },
      { id: 'connect', title: 'Connect', links: [
        { id: 'work', label: 'Let\\'s work together', href: '#work' },
        { id: 'email', label: 'Email me', href: 'mailto:hello@ismail9k.com' },
      ] },
      { id: 'more', title: 'More from me', links: [
        { id: 'school', label: '9k School', href: 'https://9k.school', external: true, featured: true, emoji: '🎓' },
        { id: 'labs', label: '9kLabs', href: 'https://the9klabs.com/', external: true },
      ] },
    ]"
    :social-links="[
      { name: 'GitHub', url: 'https://github.com/ismail9k', icon: 'github' },
      { name: 'Instagram', url: 'https://instagram.com/ismail9k', icon: 'instagram' },
    ]"
  >
    <template #brand><I9kBrandWordmark /></template>
    <template #utilities><I9kLanguageSwitcher label="العربية" code="ar" href="#ar" /></template>
  </I9kFooter>
</div>`,
    },
    {
      label: 'Tagline and social links',
      code: `<div style="position: relative; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
  <I9kFooter
    tagline="Built with the 9k design system."
    :social-links="[
      { name: 'GitHub', url: 'https://github.com/ismail9k', icon: 'github' },
      { name: 'Mail', url: 'mailto:hello@ismail9k.com', icon: 'mail' },
    ]"
  />
</div>`,
    },
    {
      label: 'Custom footer content (default slot)',
      code: `<div style="position: relative; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
  <I9kFooter :social-links="[{ name: 'GitHub', url: 'https://github.com/ismail9k', icon: 'github' }]">
    <p style="margin: 0; font-size: 0.85rem;">© 2026 Ismail9k. All rights reserved.</p>
  </I9kFooter>
</div>`,
    },
  ],
};
