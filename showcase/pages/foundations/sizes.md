---
title: Sizes
description: One sm, md and lg scale for every control, so buttons, inputs and badges of the same size line up.
---

# Sizes

<p class="docs-lede">Visual components share one size scale: <code>sm</code>, <code>md</code> and <code>lg</code>, with <code>md</code> as the default. A button, an input and a select of the same size have the same height, so a row of them lines up without extra CSS.</p>

<DocsPageActions />

## The scale

```vue demo
<I9kCluster>
  <I9kButton size="sm">Small</I9kButton>
  <I9kButton size="md">Medium</I9kButton>
  <I9kButton size="lg">Large</I9kButton>
</I9kCluster>
```

Each size sets three things, from these tokens:

| Size | Height                         | Font size                           | Gap                  |
| ---- | ------------------------------ | ----------------------------------- | -------------------- |
| `sm` | `--control-height-sm` (2rem)   | `--control-font-size-sm` (0.875rem) | `--component-gap-sm` |
| `md` | `--control-height-md` (2.5rem) | `--control-font-size-md` (1rem)     | `--component-gap-md` |
| `lg` | `--control-height-lg` (3rem)   | `--control-font-size-lg` (1.125rem) | `--component-gap-lg` |

## Mixing controls

Because heights come from the same tokens, controls of one size sit on one line:

```vue demo
<I9kCluster>
  <I9kInput model-value="" ui-size="sm" placeholder="Search" aria-label="Search" />
  <I9kButton size="sm" variant="primary">Search</I9kButton>
  <I9kBadge size="sm" variant="tag">Beta</I9kBadge>
</I9kCluster>
```

::: warning I9kInput uses `uiSize`
`I9kInput` names its scale `uiSize` (`ui-size` in templates), not `size`. The native HTML `size`
attribute, a width in characters, stays available on the input.
:::

## Inside a field

`I9kField` passes its size down to the control it wraps, so the label, hint and control match:

```vue demo
<I9kField label="Email" hint="We never share it." size="lg">
  <I9kInput model-value="" type="email" />
</I9kField>
```

## Typing a size

The scale is one type, `I9kComponentSize`, exported from the package. Use it for your own props
rather than writing the union again:

```ts
import type { I9kComponentSize } from '@9klabs/design';

defineProps<{ size?: I9kComponentSize }>();
```

The package also exports `I9kTone` (`neutral`, `primary`, `success`, `warning`, `danger`) for
components that will take a status color. No component reads it yet.
