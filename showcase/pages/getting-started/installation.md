---
title: Installation
description: Install @9klabs/design, import its one stylesheet, load the brand fonts, and render your first component.
---

# Installation

<p class="docs-lede">Install the package, import its one stylesheet, and every component is ready to use. No plugin to register and no provider to wrap your app in.</p>

<DocsPageActions />

## Install the package

`@9klabs/design` is a Vue 3 library. It needs Vue 3.5 or later as a peer dependency.

```bash
npm install @9klabs/design
```

## Import the stylesheet once

Import the shared stylesheet at your application entry, before anything else renders:

```ts
// main.ts
import '@9klabs/design/base.css';
```

It carries the design tokens, the light and dark themes, branded element defaults and
accessibility utilities. Every component module imports its own scoped styles, whether you import
it from the package root or on its own from `@9klabs/design/components/<Name>`, so a page
downloads only the styles of the components it renders.

`@9klabs/design/style.css` is the whole sheet, the shared stylesheet followed by every component's,
for a page that uses the package without a bundler. Don't load it beside imported components: it
repeats their rules, and a child's own rule can then beat its parent's `:deep()` rule on a
specificity tie.

Every stylesheet declares the package's cascade layers up front, in this order:

```css
@layer normalize, fonts, tokens, theme, base, primitives, utilities, components;
```

Component rules sit in `components`, the last layer. Your own CSS, which is not in a layer, always
wins over all of them. Override a token or restyle an element without fighting specificity, and
note that an unlayered element rule (a reset such as `button { … }`) wins over a component's own
rule too.

## Load the brand fonts

The design uses IBM Plex Sans and IBM Plex Serif for English, and Thmanyah Sans and Thmanyah Serif
Display for Arabic. The main stylesheet names those families but does not bundle the font files,
because bundling them would add more than a megabyte to every app.

Choose one of the following:

- **Bundled copies.** Import them next to the stylesheet:

  ```ts
  import '@9klabs/design/base.css';
  import '@9klabs/design/font-faces.css';
  ```

- **Your own loader.** Provide the families yourself, for example with `@nuxt/fonts`, which resolves
  them from the `--font-sans`, `--font-serif`, `--font-arabic-sans` and `--font-arabic-display`
  tokens.

## Use a component

Import components by name from the package root:

```vue
<script setup lang="ts">
import { I9kButton, I9kCluster } from '@9klabs/design';
</script>

<template>
  <I9kCluster>
    <I9kButton variant="primary">Save changes</I9kButton>
    <I9kButton>Cancel</I9kButton>
  </I9kCluster>
</template>
```

That renders:

```vue demo
<I9kCluster>
  <I9kButton variant="primary">Save changes</I9kButton>
  <I9kButton>Cancel</I9kButton>
</I9kCluster>
```

Types are exported from the same entry point, for example `I9kComponentSize`, `I9kTabItem` and
`I9kBreadcrumbItem`:

```ts
import type { I9kTabItem } from '@9klabs/design';
```

## Next steps

- [Vue Router and Nuxt](/getting-started/frameworks): render links through your router and keep
  server rendering safe.
- [Theming and dark mode](/foundations/theming): switch between light and dark.
- [Components](/components): browse all of them.
