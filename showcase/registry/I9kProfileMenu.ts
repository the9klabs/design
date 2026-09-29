import type { ShowcaseEntry } from './types';

const circle =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e85a02'/%3E%3Ccircle cx='20' cy='20' r='10' fill='%234ade80'/%3E%3C/svg%3E";

const links = [
  { id: 'profile', label: 'My account', href: '/profile' },
  { id: 'orders', label: 'My orders', href: '/profile/orders' },
];

export const I9kProfileMenuEntry: ShowcaseEntry = {
  name: 'I9kProfileMenu',
  section: 'chrome',
  summary:
    "The signed-in account's control for a navigation bar: an avatar button that opens a small panel naming the account, its links and the caller's actions, such as signing out.",
  agentPrompt: `Use I9kProfileMenu from @9klabs/design for the signed-in account's control in a navigation bar.

import { I9kProfileMenu } from '@9klabs/design';

Props:
- label: string (required) — the button's accessible name, for example "Account menu". The avatar inside the button is decorative, so this is the button's whole name.
- name?: string | null (default null) — the account's display name, shown at the top of the panel. When it is null only the detail line shows.
- detail?: string | null (default null) — a second line under the name, such as the account's email address.
- avatarSrc?: string | null (default null) — any image URL for the account's picture, including a data: URI; shown on the button and in the panel.
- links?: I9kNavigationLink[] (default []) — the { id: string; label: string; href: string } shape I9kNavigation takes, listed in order in the panel. The type is not exported from the package; inline the object shape or declare your own local type.
- linkComponent?: string | object | null (default null) — render the links with this component instead of a plain <a>, receiving the destination as \`to\` rather than \`href\`. Pass an imported component (RouterLink, NuxtLink), not its name as a string.
- open?: boolean (default false) — optional external control, bound with v-model:open. The panel drives itself, so this can be left unbound.
- size?: 'sm' | 'md' | 'lg' (default 'md') — the size of the avatar on the button, on the shared control scale.

Emits:
- update:open — [open: boolean], fired on every open and close.
- navigate — [link: I9kNavigationLink, event: MouseEvent], fired when a panel link is clicked, just before the panel closes itself.

Slots:
- actions — the block at the bottom of the panel, such as a sign-out button. Receives one slot prop, close: () => void, which closes the panel and returns focus to the button.

Behavior: a disclosure, not an ARIA menu (no role="menu"). The button carries aria-expanded and aria-controls, and the panel follows it in DOM order, so Tab walks from the button into the links and actions. Escape closes the panel and returns focus to the button; it is heard on the whole document while the panel is open, because Safari and Firefox on macOS do not focus a clicked button. A press outside the menu, keyboard focus leaving it, focus moving into an iframe (a video player), following a link, or calling the actions slot's close closes it. The name and detail lines take dir="auto", so a Latin name or an email address keeps its order on a right-to-left page. The panel is not teleported: it opens under the button, inside the bar's own stacking context (z-index 150 inside a bar at 100). A closed panel is hidden with the \`hidden\` attribute, not an inline style, so it server-renders without one and stays closed before hydration under a strict style-src Content-Security-Policy.

Usage:
<I9kProfileMenu
  v-model:open="accountOpen"
  label="Account menu"
  :name="user.name"
  :detail="user.email"
  :avatar-src="user.image"
  :links="accountLinks"
  :link-component="NuxtLink"
>
  <template #actions="{ close }">
    <I9kButton @click="close(); signOut()">Sign out</I9kButton>
  </template>
</I9kProfileMenu>`,
  gotchas: [
    'Pass `linkComponent` as an imported component (RouterLink, NuxtLink), not a string name; without it every link is a plain `<a href>` and a full page load.',
    'The panel closes itself on a link click, but not on a router navigation it did not start (the Back button, a link elsewhere on the page) — bind `v-model:open` and close it from the consumer on every route change.',
    'The avatar on the button is decorative (`aria-hidden`), so `label` is the whole accessible name of the button; make it name the control ("Account menu"), not the picture.',
    'The panel is aligned to the inline end of the button and opens inward, so place the menu at the end of a bar (the right in left-to-right pages, the left in right-to-left ones).',
    'The panel is not teleported, so a bar with `overflow: hidden` would clip it; I9kNavigation does not.',
    "The closed panel is hidden with the `hidden` attribute, never an inline `style`, so it works under a `style-src` Content-Security-Policy without `'unsafe-inline'`; do not restyle `.i9k-profile-menu__panel` with a `display` that beats `[hidden]`.",
  ],
  demos: [
    {
      label: 'Account with a name, links and a sign-out action',
      code: `<div style="display: flex; justify-content: flex-end; min-height: 18rem">
  <I9kProfileMenu
    label="Account menu"
    name="Ismail"
    detail="me@example.com"
    :avatar-src="src"
    :links="links"
  >
    <template #actions="{ close }">
      <I9kButton @click="close">Sign out</I9kButton>
    </template>
  </I9kProfileMenu>
</div>`,
      state: { src: circle, links },
    },
    {
      label: 'Without a name',
      code: `<div style="display: flex; justify-content: flex-end; min-height: 14rem">
  <I9kProfileMenu label="Account menu" detail="me@example.com" :avatar-src="src" :links="links" />
</div>`,
      state: { src: circle, links },
    },
  ],
};
