---
title: Theming and dark mode
description: Switch between light and dark with one class on the html element, remember the reader's choice, and make your own components follow.
navTitle: Theming
---

# Theming and dark mode

<p class="docs-lede">The theme is a class on <code>&lt;html&gt;</code>: <code>light</code> or <code>dark</code>. The theme tokens change with it, and every component reads them, so one class switches the whole page. Try it with the switch in the top bar of this site.</p>

<DocsPageActions />

## Set the class

```html
<html lang="en" class="dark"></html>
```

With no class, the page is light. The stylesheet also sets `color-scheme`, so native scrollbars and
form controls match.

## Let the reader choose

[`I9kThemeSwitcher`](/components/theme-switcher) is the control. It holds no state and never
touches the document itself: it shows the value you give it and emits the flipped one. Apply the
class and remember the choice yourself:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { I9kThemeSwitcher } from '@9klabs/design';

const isDark = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
});

const setTheme = (dark: boolean) => {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.classList.toggle('light', !dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {
    // Storage can be blocked; the choice then lasts for this visit.
  }
};
</script>

<template>
  <I9kThemeSwitcher :model-value="isDark" @update:model-value="setTheme" />
</template>
```

```vue demo
<I9kCluster>
  <I9kThemeSwitcher :model-value="false" />
  <I9kThemeSwitcher :model-value="true" />
</I9kCluster>
```

## Avoid a flash of the wrong theme

The server cannot know the reader's choice. Read it in a small inline script in `<head>`, so the
class is set before the first paint:

```html
<script>
  try {
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(dark ? 'dark' : 'light');
  } catch {}
</script>
```

Then start the switch at `false` on the server and read the real state once mounted, as above, so
hydration matches.

## Make your own components follow

Use the theme tokens rather than fixed colors, and your component turns dark with everything else:

```css
.my-panel {
  background: var(--surface-color);
  color: var(--theme-text-color);
  border: 1px solid var(--border-color);
}
```

When a value has no token, reach the dark theme from scoped CSS with `:global`:

```css
.my-panel__glow {
  opacity: 0.4;
}

:global(.dark) .my-panel__glow {
  opacity: 0.2;
}
```

The [tokens page](/foundations/tokens#every-token) lists each theme token with its light and dark
value.

## Inside the green section

[`I9kSection`](/components/section) with `variant="primary"` fills itself with the brand green and
re-maps the theme tokens for its contents: `--primary-color` becomes white, `--on-primary-color`
green, and so on. Components inside it stay legible without props of their own.

```vue demo
<I9kSection variant="primary" title="Join the next cohort">
  <I9kText>Applications close on Friday.</I9kText>
  <I9kButton variant="primary">Apply now</I9kButton>
</I9kSection>
```

::: warning What to keep out of the green
Status colors (error, warning, success) are not re-mapped and disappear on the green. An
`I9kModal` placed inside the section inherits the re-map and turns translucent. Render both outside
it.
:::
