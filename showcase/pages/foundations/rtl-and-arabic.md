---
title: Arabic and right-to-left
description: Mark Arabic content with lang and dir. The components mirror on their own and take the Arabic typefaces from the language.
navTitle: Arabic and RTL
---

# Arabic and right-to-left

<p class="docs-lede">The 9k products are bilingual. Mark Arabic content with <code>lang="ar"</code> and <code>dir="rtl"</code>, and the components do the rest: the typography switches to the Arabic families, and every layout mirrors.</p>

<DocsPageActions />

## Mark the language and the direction

Set both on the element that holds the content, usually `<html>`:

```html
<html lang="ar" dir="rtl"></html>
```

They do different jobs, so set both:

- **`lang="ar"`** selects the typography. `:lang(ar)` switches body text to Thmanyah Sans and
  headings to Thmanyah Serif Display.
- **`dir="rtl"`** mirrors the layout. Components are built with logical properties
  (`margin-inline-start`, `inset-inline-end`), so start and end follow the reading direction
  without a prop.

```vue demo
<div lang="ar" dir="rtl">
  <I9kSectionHeading title="الدورات" />
  <I9kCluster>
    <I9kButton variant="primary">ابدأ الآن</I9kButton>
    <I9kButton>اعرف المزيد</I9kButton>
    <I9kBadge variant="tag">جديد</I9kBadge>
  </I9kCluster>
</div>
```

Every demo on this site can be flipped to right-to-left with the **文A** button in the top bar, so
you can check any component in both directions.

## Mixed content

A page in one language often quotes the other. Mark the quoted part on its own element:

```html
<p>The course is called <span lang="ar" dir="rtl">الذكاء الاصطناعي</span>.</p>
```

Some components take the language of a part of their content as a prop, because they render that
part themselves. A toast's `detail`, for example, accepts `detailLang` and `detailDir` for a server
message in Arabic on an English page.

## When the language is unknown

If the markup cannot carry `lang`, for example text from a CMS without language metadata, apply
the typography by class instead:

| Class                 | Applies                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `.i9k-arabic`         | Thmanyah Sans, the Arabic body family                               |
| `.i9k-arabic-display` | Thmanyah Serif Display, the Arabic heading family                   |
| `.i9k-root`           | IBM Plex Sans, to set the English family on an app shell explicitly |

## Directions that do not mirror

Some things keep their direction in both languages: code stays left to right, inside an Arabic page
as on this site. Where a component offers a direction-aware option, it is named logically rather
than left and right. `I9kNino`'s `look` takes `start` and `end`, so he glances toward the same side
of a form in both languages, and `I9kGlow`'s `position` takes `top-start` and `top-end`.

## Checking your work

Any visual change needs checking in both directions, as well as in light and dark. A layout that
uses `left`, `right`, `margin-left` or `text-align: left` will not mirror. Use the logical
equivalents (`inset-inline-start`, `margin-inline-start`, `text-align: start`).
