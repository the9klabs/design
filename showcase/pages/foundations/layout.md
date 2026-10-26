---
title: Page layout
description: One page column shared by the navigation, every section and the footer, plus the grid, cluster and panel that arrange content inside it.
---

# Page layout

<p class="docs-lede">Every page sits in one column: the navigation bar, each section and the footer share the same measure, so their edges line up. Inside that column, a few layout components arrange content without restyling it.</p>

<DocsPageActions />

## The page column

[`I9kContainer`](/components/container) is the column. It sets only a width and centres it, so
padding, backgrounds and minimum heights stay yours.

| Size | Token                  | Width | Use for                         |
| ---- | ---------------------- | ----- | ------------------------------- |
| `sm` | `--container-width-sm` | 42rem | A reading column for long text  |
| `md` | `--container-width-md` | 75rem | The site column, the default    |
| `lg` | `--container-width-lg` | 90rem | A wide, desktop-first work area |

On a viewport narrower than the column, it keeps a gutter on each side: `--container-gutter`
(2rem), or `--container-gutter-sm` (1rem) at 768px and below. `I9kNavigation` and `I9kFooter` render
their content in a container of their own, so anything you put in one lines up with the brand in the
bar and the columns in the footer.

```vue
<section class="pricing-band">
  <I9kContainer>
    <I9kSectionHeading title="Pricing" />
    <I9kGrid :columns="3">…</I9kGrid>
  </I9kContainer>
</section>
```

### Three rules

1. **A full-bleed background goes around the container, not on it.** The `<section>` carries the
   fill, and the container inside holds the content.
2. **Never nest one container in another.** The inner one would take the gutter off a second time,
   so a phone loses twice the margin. A narrower block inside a column is a plain element with
   `max-width` and `margin-inline: auto`.
3. **Widen an area, not every container.** For an admin area that needs the wide column throughout,
   chrome included, redefine `--container-width-md: var(--container-width-lg)` on the area's root
   instead of passing `size="lg"` to each container.

## The page wrapper

[`I9kPageContainer`](/components/page-container) is the page-level wrapper: a flex column with a
minimum height, deriving its width from the same token. Its `size` is the gutter, so its content
lines up with the chrome for `md`, and for `sm` and `lg` once the viewport is wide enough. Anything
that must share the bar's edge on every viewport belongs in an `I9kContainer`.

## Arranging content

Layout components style only their own layout. They never change their children.

[`I9kGrid`](/components/grid) lays out equal columns, collapsing on narrow screens:

```vue demo
<I9kGrid :columns="3">
  <I9kPanel>One</I9kPanel>
  <I9kPanel>Two</I9kPanel>
  <I9kPanel>Three</I9kPanel>
</I9kGrid>
```

[`I9kCluster`](/components/cluster) spaces a row of items that wraps, such as actions or tags:

```vue demo
<I9kCluster>
  <I9kBadge variant="tag">Vue</I9kBadge>
  <I9kBadge variant="tag">TypeScript</I9kBadge>
  <I9kBadge variant="tag">Accessibility</I9kBadge>
</I9kCluster>
```

[`I9kPanel`](/components/panel) is the bordered surface for grouped content, and
[`I9kSection`](/components/section) gives a block of the page its heading, actions and, when
asked, a collapsible body.

## Semantic roots

Surface and layout components accept `as` when the element needs stronger meaning, for example an
`I9kPanel` that is an `<article>`, or an `I9kContainer` that is the page's `<main>`:

```vue
<I9kContainer as="main" size="sm">…</I9kContainer>
<I9kPanel as="article">…</I9kPanel>
```

## A frame of its own

For a page that is its own frame, such as a course player or this documentation, use
[`I9kSidebarLayout`](/components/sidebar-layout). It renders the bar, a sticky sidebar that becomes
a drawer on narrow screens, and the `<main>` landmark itself, so do not wrap it in another
`<main>`.
