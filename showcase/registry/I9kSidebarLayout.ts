import type { ShowcaseEntry } from './types';

export const I9kSidebarLayoutEntry: ShowcaseEntry = {
  name: 'I9kSidebarLayout',
  section: 'chrome',
  summary:
    'A full-height frame: a slim sticky bar, a sidebar and a main area. Wide screens show the sidebar as a column the reader can hide; narrow screens open it as a modal drawer from the bar.',
  agentPrompt: `Use I9kSidebarLayout from @9klabs/design for a page that is its own frame — a course player, a documentation reader — with navigation in a sidebar beside the content.

import { I9kSidebarLayout } from '@9klabs/design';

Props:
- sidebarLabel: string (required) — accessible name of the sidebar landmark, and of the drawer dialog on a narrow screen.
- toggleLabel?: string (default 'Toggle sidebar') — the bar toggle's accessible name. It stays the same in both states; aria-expanded carries the state.
- closeLabel?: string (default 'Close sidebar') — the drawer's close button.
- sidebarHidden?: boolean (default false) — wide screens only. Bind v-model:sidebar-hidden to keep the choice across remounts (e.g. in app state).
- drawerOpen?: boolean (default false) — narrow screens only. Bind v-model:drawer-open to close the drawer from outside.

Emits:
- update:sidebarHidden — [hidden: boolean]
- update:drawerOpen — [open: boolean], including Escape, the backdrop, a followed link and widening past the breakpoint.

Slots:
- bar — after the toggle: brand, breadcrumb (see I9kBreadcrumb).
- bar-end — pushed to the inline end: theme switcher, account actions.
- sidebar — the scrolling navigation. Without it there is no sidebar and no toggle.
- sidebar-footer — pinned at the sidebar's foot: a title, a progress bar.
- default — the page content, inside <main>.
- footer — optional <footer> after main, e.g. legal links.

Behavior: the breakpoint is fixed at 769px (the same as I9kNavigation). Wide: the toggle hides or shows the sidebar column, which is sticky and exactly as tall as the viewport below the bar. The page content comes before the sidebar in reading order, so keyboard and screen-reader users reach it first; on a wide screen the grid shows the sidebar at the inline start. Narrow: the toggle opens a modal drawer (role=dialog, aria-modal) with a close button that takes focus; the bar and main area become inert and the page stops scrolling; Escape, the close button, the backdrop and following a link inside close it, and focus returns to the toggle, except after a link to another page (a link marked aria-current="page" goes nowhere, so it returns focus too). On mount and whenever the drawer opens, an element with aria-current="page" inside the sidebar is scrolled into the middle of the sidebar (the sidebar scrolls, never the window). The layout renders <header>, <aside>, <main> and <footer> itself, so do not wrap it in another <main>.

Usage:
<I9kSidebarLayout sidebar-label="Course contents" toggle-label="Course contents" close-label="Close course contents">
  <template #bar><I9kBreadcrumb :items="crumbs" /></template>
  <template #bar-end><I9kThemeSwitcher v-model="isDark" /></template>
  <template #sidebar><nav>…lessons, one with aria-current="page"…</nav></template>
  <template #sidebar-footer>Course progress</template>
  <p>Lesson</p>
</I9kSidebarLayout>`,
  gotchas: [
    'The breakpoint is fixed at 769px and is not a prop: the stylesheet has to hide the drawer before hydration, and a media query cannot read a prop.',
    'It renders its own `<header>`, `<aside>`, `<main>` and `<footer>`; use it as the whole page, not inside another shell.',
    'The sidebar follows the main content in the DOM, so keyboard and screen-reader users reach the page first; do not reorder it with CSS order in a wrapper.',
    'Before mount it assumes a wide screen for layout, and the toggle carries no aria-expanded until the client has read the real width; the stylesheet keeps the drawer hidden on a narrow screen meanwhile.',
    'Set `--i9k-sidebar-layout-height` on a parent to bound the frame (for a demo); it defaults to `100dvh`.',
  ],
  demos: [
    {
      label: 'Course player',
      code: `<div style="--i9k-sidebar-layout-height: 28rem">
  <I9kSidebarLayout sidebar-label="Course contents" toggle-label="Course contents" close-label="Close course contents">
    <template #bar><strong>Leveraging AI</strong></template>
    <template #sidebar>
      <ol>
        <li><a href="#welcome">Welcome</a></li>
        <li><a href="#setup" aria-current="page">Setup</a></li>
        <li><a href="#prompting">Prompting</a></li>
      </ol>
    </template>
    <template #sidebar-footer>Progress · 1 of 3</template>
    <p style="padding: var(--spacing-10)">Lesson content.</p>
  </I9kSidebarLayout>
</div>`,
    },
    {
      label: 'Arabic RTL',
      code: `<div dir="rtl" lang="ar" style="--i9k-sidebar-layout-height: 24rem">
  <I9kSidebarLayout sidebar-label="محتوى الدورة" toggle-label="محتوى الدورة" close-label="إغلاق محتوى الدورة">
    <template #bar><strong>الدورة</strong></template>
    <template #sidebar><ol><li><a href="#one" aria-current="page">الدرس الأول</a></li></ol></template>
    <p style="padding: var(--spacing-10)">محتوى الدرس.</p>
  </I9kSidebarLayout>
</div>`,
    },
  ],
};
