---
title: Design tokens
description: The colors, spacing, radii, control sizes and page measures every component is built from, read straight from tokens.css.
navTitle: Tokens
---

# Design tokens

<p class="docs-lede">Every value the components use comes from a CSS custom property. Brand values live on <code>:root</code>. Theme values change with the class on <code>&lt;html&gt;</code>. The swatches below are read from <code>src/styles/tokens.css</code> when the docs are built, so they never drift from it.</p>

<DocsPageActions />

## How to use them

Read tokens with `var()` in your own styles, and prefer the role over the raw value. A surface
should use `--surface-color`, not `--white-color`, so it turns dark with the theme:

```css
.my-card {
  padding: var(--spacing-8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
  color: var(--theme-text-color);
}
```

To change a value for the whole app, redefine it after the stylesheet. Your CSS sits outside the
library's cascade layers, so it wins:

```css
:root {
  --radius-md: 0.5rem;
}
```

## Color roles

Green marks primary actions and selection. Orange is a brand accent for details such as link
underlines and featured borders. Errors, warnings and successes each have their own foreground and
background, tuned per theme.

| Role           | Tokens                                                                                                                | Use for                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Canvas         | `--theme-bg-color`                                                                                                    | The page background                                  |
| Surface        | `--surface-color`                                                                                                     | Panels, cards and fields                             |
| Raised surface | `--surface-raised-color`                                                                                              | Featured panels and banners, with `--shadow-sm`      |
| Interaction    | `--surface-hover-color`, `--surface-sunken-color`                                                                     | Neutral hover and pressed states                     |
| Selection      | `--selected-bg-color`, `--primary-text-color`                                                                         | Selected filters, page numbers, radio cards          |
| Feedback       | `--error-color`, `--error-bg-color`, `--success-color`, `--success-bg-color`, `--warning-color`, `--warning-bg-color` | Validation and status messages                       |
| Boundaries     | `--control-border-color`, `--focus-color`, `--border-color`                                                           | Control borders, keyboard focus, and subtle dividers |

Glass tokens (`--glass-bg`, `--glass-blur`) are for overlays such as the navigation bar. Content
surfaces stay opaque, so their contrast holds over images and decorative backgrounds.

## Every token

<DocsColorTokens />
