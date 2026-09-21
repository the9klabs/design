import type { ShowcaseEntry } from './types';

export const I9kBreadcrumbEntry: ShowcaseEntry = {
  name: 'I9kBreadcrumb',
  section: 'chrome',
  summary:
    'A breadcrumb trail in a named navigation landmark: every step but the last links back, and the last is the current page.',
  agentPrompt: `Use I9kBreadcrumb from @9klabs/design to show where the current page sits, for example course / lesson in a slim top bar.

import { I9kBreadcrumb, type I9kBreadcrumbItem } from '@9klabs/design';

Props:
- items: I9kBreadcrumbItem[] (required) — { id: string; label: string; href?: string }, outermost first. Every item but the last renders as a link when it has an href. The last item is always the current page: a <span aria-current="page">, never a link.
- label?: string (default 'Breadcrumb') — the navigation landmark's accessible name. Pass it in the page's language.
- linkComponent?: string | object | null (default null) — render the links with this component (RouterLink, NuxtLink), which receives the destination as \`to\`. Pass the imported component, not its name.

Behavior: separators are aria-hidden. Long labels truncate with an ellipsis and keep the full text in a title.

Usage:
<I9kBreadcrumb
  label="Breadcrumb"
  :link-component="NuxtLink"
  :items="[{ id: 'course', label: 'Leveraging AI', href: '/courses/ai' }, { id: 'lesson', label: 'Hello, Agent' }]"
/>`,
  gotchas: [
    'The last item is always the current page, even when it has an href; put the page you are on last.',
    'Without `linkComponent` the steps are plain `<a href>`, so in a router app every click is a full page load.',
    'Pass `label` in the page language; the default is English.',
  ],
  demos: [
    {
      label: 'Course / lesson',
      code: `<I9kBreadcrumb
  :items="[
    { id: 'course', label: 'Leveraging AI for Development', href: '/courses/ai' },
    { id: 'lesson', label: 'Hello, Agent' },
  ]"
/>`,
    },
    {
      label: 'Arabic RTL',
      code: `<div dir="rtl" lang="ar">
  <I9kBreadcrumb
    label="مسار التنقّل"
    :items="[
      { id: 'course', label: 'هندسة البرمجيات مع الذكاء الاصطناعي', href: '/courses/ai' },
      { id: 'lesson', label: 'الدرس الأول' },
    ]"
  />
</div>`,
    },
  ],
};
