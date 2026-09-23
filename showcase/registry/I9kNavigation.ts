import type { ShowcaseEntry } from './types';

export const I9kNavigationEntry: ShowcaseEntry = {
  name: 'I9kNavigation',
  section: 'chrome',
  summary:
    'Sticky site header with a brand slot, a link list, and an actions slot, laid out in the shared page column. Tracks scroll position to add a background on scroll and switch the brand into a compact state. Renders plain anchors, or a caller-supplied router link component.',
  agentPrompt: `Use I9kNavigation from @9klabs/design for a page's top-level site header.

import { I9kNavigation } from '@9klabs/design';

Props:
- links: I9kNavigationLink[] (required) — the nav menu. Each item is { id: string; label: string; href: string }. This type is not exported from the package; inline the object shape or declare your own local type.
- brandHref?: string (default '/') — the href on the brand link wrapping the \`brand\` slot.
- brandLabel?: string (default 'Home') — used as the accessible label for both the brand link and the surrounding <nav>.
- compactAt?: number (default 72) — scroll offset in pixels past which the header switches into its compact state.
- expandAt?: number (default 24) — scroll offset in pixels below which the header switches back to its expanded state.
- linkComponent?: string | object | null (default null) — render the brand and every menu link with this component instead of a plain <a>, receiving the destination as \`to\` rather than \`href\`. Pass an imported component (RouterLink, NuxtLink), not its name as a string: a string is resolved through resolveDynamicComponent, which does not see locally or compile-time registered components.

Emits: navigate — [link: I9kNavigationLink, event: MouseEvent], fired when a menu link is clicked (in addition to the link's normal navigation).

Slots:
- brand — the logo/wordmark content, wrapped in the brand link. Receives one slot prop: compact: boolean, true once the scroll position has passed compactAt.
- actions — content rendered after the menu (e.g. a sign-in button), not wrapped in a link. Also receives compact: boolean, so a mobile menu next to the brand can match whatever the brand is showing.

Active links: with a router link component the header styles the active route itself, from the \`router-link-active\` class and \`aria-current="page"\` that vue-router sets. Plain anchors get no active state.

Compact/expand behavior: compactAt and expandAt are both scroll-Y pixel thresholds, not a single toggle point. Scrolling past compactAt turns compact on; scrolling back below expandAt turns it off. Because expandAt is lower than compactAt by default, there is a dead zone between them where the current state is kept — this hysteresis stops the header from flickering when the scroll position hovers near one threshold. Set expandAt below compactAt when customizing either.

IMPORTANT: links is an array of plain objects, not slot content — build the menu by passing links, and use the brand and actions slots only for content outside that list.

Column: the bar's content renders inside an I9kContainer, so the brand starts where an I9kContainer section's content does and where I9kFooter's columns do. Do not wrap the header in another container. An area that uses the wide column throughout redefines --container-width-md on its root and the header follows.

Usage:
<I9kNavigation :links="[{ id: 'docs', label: 'Docs', href: '/docs' }, { id: 'pricing', label: 'Pricing', href: '/pricing' }]" @navigate="onNavigate">
  <template #brand="{ compact }"><span :class="{ compact }">Acme</span></template>
  <template #actions><I9kButton variant="primary" href="/signup">Sign up</I9kButton></template>
</I9kNavigation>`,
  gotchas: [
    'Without `linkComponent` the brand and menu render plain `<a href>`, so in a router app every click is a full page load — pass the router link component (RouterLink, NuxtLink) as an imported component, not a string name.',
    'The `links` prop is a plain array of `{ id, label, href }` objects — the menu is not built from slot content.',
    'The `brand` and `actions` slots both receive a `compact: boolean` slot prop; read it to swap the logo/wordmark for a condensed version.',
    '`compactAt` and `expandAt` are independent pixel thresholds with hysteresis between them, not one toggle point — a scroll position between the two keeps the current compact state.',
  ],
  demos: [
    {
      label: 'Default',
      code: `<I9kNavigation
  :links="[
    { id: 'docs', label: 'Docs', href: '/docs' },
    { id: 'pricing', label: 'Pricing', href: '/pricing' },
  ]"
>
  <template #brand>Acme</template>
  <template #actions><I9kButton variant="primary" href="/signup">Sign up</I9kButton></template>
</I9kNavigation>`,
    },
    {
      label: 'Compact-aware brand',
      code: `<I9kNavigation :links="links" :compact-at="72" :expand-at="24">
  <template #brand="{ compact }">
    <strong v-if="!compact">Acme Studio</strong>
    <strong v-else>A</strong>
  </template>
</I9kNavigation>`,
      state: {
        links: [
          { id: 'docs', label: 'Docs', href: '/docs' },
          { id: 'pricing', label: 'Pricing', href: '/pricing' },
        ],
      },
    },
  ],
};
