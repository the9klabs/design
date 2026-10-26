---
title: Vue Router and Nuxt
description: Route links through Vue Router or Nuxt, install the toaster per app, and keep server rendering safe.
---

# Vue Router and Nuxt

<p class="docs-lede">The components render plain anchors unless you hand them your router's link component. They hold no global state, so they render on the server as they do in the browser.</p>

<DocsPageActions />

## Links through your router

Components that render navigation take a `linkComponent` prop. Without it, a link is a plain `<a>`
and following it reloads the page. With it, the component renders yours instead and passes the
destination as `to`.

These components take `linkComponent`:

| Component                                                                                                                                                  | Renders links for                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`I9kButton`](/components/button), [`I9kIconButton`](/components/icon-button)                                                                              | `to`                               |
| [`I9kNavigation`](/components/navigation), [`I9kNavMenu`](/components/nav-menu)                                                                            | the site links                     |
| [`I9kSideNav`](/components/side-nav)                                                                                                                       | the section links                  |
| [`I9kBreadcrumb`](/components/breadcrumb)                                                                                                                  | every item but the last            |
| [`I9kFooter`](/components/footer)                                                                                                                          | site-relative links in its columns |
| [`I9kAnnouncementBar`](/components/announcement-bar), [`I9kProfileMenu`](/components/profile-menu), [`I9kLanguageSwitcher`](/components/language-switcher) | their links                        |

Pass the imported component, not its name, so it resolves wherever the component renders:

```vue
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { I9kSideNav } from '@9klabs/design';
</script>

<template>
  <I9kSideNav label="Admin sections" :links="links" :link-component="RouterLink" />
</template>
```

`I9kButton` and `I9kIconButton` also accept the globally registered name, which is the shortest way
to write a one-off link:

```vue
<I9kButton to="/pricing" link-component="RouterLink">See pricing</I9kButton>
```

In Nuxt, pass `NuxtLink` the same way. It is auto-imported in templates, so
`:link-component="NuxtLink"` needs no import in a page or component.

::: tip Decide the current page in the caller
`I9kSideNav` and `I9kBreadcrumb` never read the router. Set `current` on a side-nav link, or put
the current page last in the breadcrumb, from your route. That way a nested page, such as an editor
under Courses, can still mark its section.
:::

## Notifications, once per app

Notifications go through one store per app. Install it where you create the app, and render one
`<I9kToaster />` at the root, before the page content:

```ts
// main.ts
import { createI9kToaster } from '@9klabs/design';

app.use(createI9kToaster({ labels: { region: 'Notifications', dismiss: 'Dismiss' } }));
```

```ts
// plugins/toaster.ts in Nuxt
import { createI9kToaster } from '@9klabs/design';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createI9kToaster());
});
```

The store is created per app, never as a module singleton, so two server-rendered requests never
share notifications. [Notifications and dialogs](/guides/notifications-and-dialogs) covers the rest.

## Server rendering

Every component renders on the server. Anything that needs the browser waits until the component
is mounted: `matchMedia`, timers, the dialog API, and Nino's maze seed when none is given. In
practice:

- **No hydration surprises from viewport checks.** `I9kSidebarLayout` renders its wide layout on
  the server and switches to the drawer once mounted on a narrow screen. `I9kNavigation` lays out
  with CSS alone.
- **Teleports go to `<body>`.** `I9kNavMenu` teleports its panel there, which Nuxt and VitePress
  place correctly. A hand-rolled server renderer must put body teleports at the very start of
  `<body>`.
- **The theme class is yours.** The components follow the `dark` or `light` class on `<html>`.
  Set it before the first paint so a dark page never flashes light. See
  [Theming and dark mode](/foundations/theming).
