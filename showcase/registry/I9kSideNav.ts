import type { ShowcaseEntry } from './types';

export const I9kSideNavEntry: ShowcaseEntry = {
  name: 'I9kSideNav',
  section: 'chrome',
  summary:
    "An app sidebar's section links: a labelled navigation landmark holding a vertical list, with the current section marked, and a footer slot below the list.",
  agentPrompt: `Use I9kSideNav from @9klabs/design for the section links in an app's sidebar, inside I9kSidebarLayout's \`sidebar\` slot.

import { I9kSideNav, type I9kSideNavLink } from '@9klabs/design';

Props:
- label: string (required) — the navigation landmark's accessible name, such as "Admin sections".
- links: I9kSideNavLink[] (required) — { id: string; label: string; href: string; current?: boolean }. Set current on the section the reader is in; that link renders aria-current="page".
- linkComponent?: string | object | null (default null) — render the links with this component instead of a plain <a>, receiving the destination as \`to\`. Pass an imported component (RouterLink, NuxtLink), not its name as a string.

Slots:
- footer — below the list, inside the landmark: a secondary link such as "Browse the courses".

The component does not read the router. Decide \`current\` from the route in the caller, so a nested page (a course's editor under Courses) can mark its section.

Usage:
<I9kSidebarLayout sidebar-label="Admin sections">
  <template #sidebar>
    <I9kSideNav label="Admin sections" :links="links" :link-component="NuxtLink" />
  </template>
  ...
</I9kSidebarLayout>`,
  gotchas: [
    'Nothing is current unless a link says so: the component never compares hrefs with the location.',
    'The caller sets `current`, so mark the section, not only the exact page. A router link component may additionally set aria-current on its own exact match.',
    'Text only: there is no icon slot.',
  ],
  demos: [
    {
      label: 'Admin sections',
      code: `<I9kSideNav
  label="Admin sections"
  :links="[
    { id: 'dashboard', label: 'Dashboard', href: '#dashboard' },
    { id: 'courses', label: 'Courses', href: '#courses', current: true },
    { id: 'orders', label: 'Orders', href: '#orders' },
  ]"
/>`,
    },
    {
      label: 'With a footer link',
      code: `<I9kSideNav
  label="Account sections"
  :links="[
    { id: 'profile', label: 'My account', href: '#profile', current: true },
    { id: 'orders', label: 'My orders', href: '#orders' },
  ]"
>
  <template #footer><a href="#courses">Browse the courses</a></template>
</I9kSideNav>`,
    },
  ],
};
