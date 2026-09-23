# ismail9k.com Component Library Migration Ledger

## Purpose

This document is the source of truth for migrating the live Nuxt website at
`../ismail9k.com` from global design-system primitives and legacy component APIs to the scoped
component library defined in
`docs/superpowers/specs/2026-08-23-component-library-design.md`.

No legacy selector or prop may be removed from the package until its row in this ledger is
complete, repository search shows zero live website usage, and both repositories pass their
release gates.

## Current Integration

- Website package: `../ismail9k.com/package.json`
- Package dependency: `"@9klabs/design": "file:../9k-design-system"`
- Global stylesheet entry: `../ismail9k.com/assets/css/app.css`
- Package stylesheet import: `@import '@9klabs/design/style.css';`
- Website framework: Nuxt with SSR enabled and static generation through `nuxt generate`
- Locales: unprefixed English routes and `/ar/...` Arabic RTL routes
- Live component reference: `/design-system`, explicitly prerendered and excluded from the
  sitemap
- Current source footprint: 15 imported package components across 22 Vue source files

The website worktree had unrelated uncommitted changes when this ledger was written. Migration
execution must begin in an isolated website branch or worktree and must not overwrite those
changes.

## Migration Invariants

1. The package lands a replacement before the website stops using the old contract.
2. `style.css` keeps temporary compatibility selectors until the website reaches zero usage.
3. New and migrated visual components use `<style scoped>`.
4. The website does not recreate package component CSS in its own global stylesheet.
5. Site-owned page layout may remain local, but reusable branded visuals move to package
   components.
6. Every migration batch is independently revertible while compatibility CSS still exists.
7. `/design-system` migrates before public routes and acts as the integration canary.
8. English/Arabic, light/dark, desktop/mobile, SSR hydration, and static output are checked before
   a batch is marked complete.

## Legacy Primitive Mapping

| Current website contract                                  | Replacement                                                 | Required migration behavior                                                                                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.surface`                                                | `I9kPanel`                                                  | Preserve border, radius, glass background, and dark-mode appearance.                                                                                                                                             |
| `.surface.surface--interactive`                           | `I9kCard interactive` or an existing scoped card component  | Preserve hover lift, focus treatment, and valid link/button semantics.                                                                                                                                           |
| `.surface.surface--feature`                               | `I9kPanel variant="feature"`                                | Preserve branded gradient, accent border, and responsive padding.                                                                                                                                                |
| `.surface.surface--flat`                                  | `I9kPanel variant="flat"`                                   | Preserve transparent borderless rendering.                                                                                                                                                                       |
| `.badge--solid`                                           | `I9kBadge variant="solid"`                                  | Preserve primary background and uppercase treatment.                                                                                                                                                             |
| `.badge--outline`                                         | `I9kBadge variant="outline"`                                | Preserve muted border and text.                                                                                                                                                                                  |
| `.badge--tag`                                             | `I9kBadge variant="tag"`                                    | Preserve the visual hash prefix without placing decorative text in the accessible name.                                                                                                                          |
| `.stat` and `.stat--lg`                                   | `I9kStat size="md"` and `size="lg"`                         | Move value, label, and source markup behind typed props or named slots.                                                                                                                                          |
| `.grid--2`, `.grid--3`, `.grid--auto`                     | `I9kGrid :columns="2"`, `:columns="3"`, or `columns="auto"` | Preserve the current 768px single-column response.                                                                                                                                                               |
| `.grid--tight`, `.grid--loose`                            | `I9kGrid size="sm"` or `size="lg"`                          | Express gap through the common size scale.                                                                                                                                                                       |
| `.cluster` and `.cluster--tight`                          | `I9kCluster size="md"` or `size="sm"`                       | Preserve wrapping and center alignment.                                                                                                                                                                          |
| `.lede`                                                   | `I9kText variant="lede"`                                    | Preserve maximum line length, muted color, type size, and line height.                                                                                                                                           |
| Site-owned `.container`                                   | `I9kPageContainer`                                          | Preserve the minimum height and responsive gutters. The site column is a padded 1000px box (936px of content); set `--container-width-md: 58.5rem` on `:root` when it migrates, or move the column to the token. |
| `.field*`                                                 | `I9kField` plus the matching input component                | Preserve native names, autocomplete, validation messages, and Turnstile focus behavior.                                                                                                                          |
| `.timeline__title`, `.timeline__link`, `.timeline__thumb` | Scoped `I9kTimelineCard` title/default/thumbnail slots      | Remove consumer knowledge of timeline internals while preserving tracking and link attributes.                                                                                                                   |
| `.btn` overrides through `:deep()`                        | Public `I9kButton` size and variant props                   | Eliminate styling based on private descendant classes.                                                                                                                                                           |

`I9kGrid`, `I9kCluster`, and `I9kStack` are components rather than new global utility selectors so
their visual layout contracts remain scoped and documented.

## Legacy Component API Mapping

| Existing API                               | Replacement contract                    | Website action                                                                              |
| ------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `I9kButton variant="default"`              | `I9kButton variant="secondary"`         | Update all explicit/default examples after the replacement style matches current output.    |
| `I9kButton variant="primary"`              | Same semantic variant                   | Add an explicit `size` only where the current control is not medium.                        |
| `I9kButton variant="link"`                 | Same semantic variant                   | Preserve router-link integration and inline layout.                                         |
| `I9kButton variant="filter" :active`       | `I9kButton variant="outline" :pressed`  | Preserve `aria-pressed`, active appearance, and filter behavior.                            |
| `I9kButton variant="pagination"`           | `I9kPagination` previous/next controls  | Move disabled and accessible-label behavior to the pagination component.                    |
| `I9kButton variant="page" :active`         | `I9kPagination` page items              | Replace `active` with the pagination current-page model and `aria-current="page"`.          |
| Consumer `.timeline__*` slot classes       | Semantic `I9kTimelineCard` slots        | Delete global class names from `BlogCard.vue`, `TalkCard.vue`, and the live reference page. |
| `I9kInput` standalone label/error API      | `I9kField` composition with `I9kInput`  | Migrate form fields as one batch so IDs and validation associations remain intact.          |
| Existing branded components without `size` | Same component with default `size="md"` | Verify the default is visually identical before adding optional explicit sizes.             |

For `I9kInput`, use `uiSize` for visual sizing so the native HTML `size` attribute continues to
forward to the underlying control.

The existing `to` plus `linkComponent` button integration remains supported during this website
migration. Replacing router integration is outside this migration's scope.

## Package Component Import Inventory

| Website file                    | Current package imports                                                                                                  | Migration action                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/SocialLinks.vue`    | `I9kIcon`                                                                                                                | Verify scoped icon sizing and color inheritance.                                                                                                                                 |
| `components/TalkCard.vue`       | `I9kTimelineCard`, `I9kButton`                                                                                           | Adopt semantic timeline slots and normalized button variants.                                                                                                                    |
| `components/GithubEmbed.vue`    | `I9kGithubEmbed`                                                                                                         | Verify scoped embed appearance; remove no API unless usage proves obsolete.                                                                                                      |
| `components/ds/DsSpecimen.vue`  | `I9kButton`                                                                                                              | Update the canary controls to the normalized button API.                                                                                                                         |
| `components/BlogCard.vue`       | `I9kTimelineCard`                                                                                                        | Remove `.timeline__*`, `.cluster`, and `.badge` dependencies.                                                                                                                    |
| `components/SectionRail.vue`    | `I9kButton`                                                                                                              | Replace `.cluster` and normalize compact action sizing.                                                                                                                          |
| `components/AuthorCard.vue`     | `I9kProfileCard`                                                                                                         | Verify all three sizes and preserve the current default.                                                                                                                         |
| `components/InquiryForm.vue`    | `I9kAsciiEmoji`, `I9kButton`                                                                                             | Normalize buttons; migrate form controls with `InquiryField.vue`.                                                                                                                |
| `components/NavMenu.vue`        | `I9kNavMenu`, `I9kBrandWordmark`, `I9kButton`, `I9kLanguageSwitcher`, `I9kThemeSwitcher`                                 | Preserve mobile focus order, locale routes, theme state, and scroll-driven wordmark state.                                                                                       |
| `layouts/partial/TheNavbar.vue` | `I9kNavigation`, `I9kBrandWordmark`, `I9kLanguageSwitcher`, `I9kThemeSwitcher`                                           | Verify desktop navigation and theme/locale hydration. `I9kNavigation` needs `linkComponent` here, or the header falls back to plain anchors and every click is a full page load. |
| `layouts/clean.vue`             | `I9kBlurredCircles`                                                                                                      | Verify scoped animation and reduced-motion behavior.                                                                                                                             |
| `layouts/default.vue`           | `I9kBlurredCircles`                                                                                                      | Verify scoped animation, stacking, and reduced-motion behavior.                                                                                                                  |
| `pages/index.vue`               | `I9kPageHeader`, `I9kButton`                                                                                             | Replace cluster, badge, and surface primitives after the canary passes.                                                                                                          |
| `pages/projects.vue`            | `I9kPageHeader`, `I9kButton`, `I9kSectionHeading`, `I9kLinkCard`                                                         | Replace feature surface, badges, stats, grids, and clusters.                                                                                                                     |
| `pages/work-with-me.vue`        | `I9kPageHeader`, `I9kFaqList`                                                                                            | Verify FAQ disclosure behavior; migrate the inquiry form in the form batch.                                                                                                      |
| `pages/uses.vue`                | `I9kPageHeader`, `I9kSectionHeading`, `I9kLinkCard`                                                                      | Replace the auto grid and verify link-card layout.                                                                                                                               |
| `pages/talks.vue`               | `I9kPageHeader`, `I9kButton`                                                                                             | Replace feature surface and action cluster; verify talk cards.                                                                                                                   |
| `pages/blog/index.vue`          | `I9kPageHeader`, `I9kButton`, `I9kAsciiEmoji`                                                                            | Replace filter and pagination button variants with their new contracts.                                                                                                          |
| `pages/blog/[...slug].vue`      | `I9kAsciiEmoji`, `I9kButton`, `I9kArticleHeader`, `I9kFaqList`                                                           | Verify article header and FAQ appearance in both directions.                                                                                                                     |
| `pages/design-system.vue`       | `I9kPageHeader`, `I9kButton`, `I9kAsciiEmoji`, `I9kLinkCard`, `I9kTimelineCard`, `I9kSectionHeading`, `I9kBrandWordmark` | Migrate first; replace every primitive specimen with the corresponding component specimen.                                                                                       |
| `pages/links.vue`               | `I9kBrandWordmark`, `I9kButton`                                                                                          | Verify compact viewport behavior and external link semantics.                                                                                                                    |
| `pages/media.vue`               | `I9kPageHeader`, `I9kButton`, `I9kSectionHeading`                                                                        | Replace surfaces, grids, clusters, and the private `.btn` deep override.                                                                                                         |

## Package Migration Status

| Package component  | Scoped replacement ready                                     | Website compatibility still required                                  |
| ------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `I9kAsciiEmoji`    | Yes: scoped size and color styles                            | `.emoticon*` remains during migration                                 |
| `I9kLinkCard`      | Yes: scoped surface, badge, and sizes                        | `.surface*` and `.badge*` remain for direct website usage             |
| `I9kProfileCard`   | Yes: scoped surface, actions, and sizes                      | `.surface*` and `.cluster*` remain for direct website usage           |
| `I9kTimelineCard`  | Yes: scoped layout, sizes, and semantic slots                | `.timeline*` remains until BlogCard, TalkCard, and the canary migrate |
| `I9kField`         | Yes: label, hint, error, and required association            | `.field*` remains until the website form batch migrates               |
| `I9kInput`         | Yes: `I9kField` composition and native attribute forwarding  | `.field*` remains for standalone and website form compatibility       |
| `I9kTextarea`      | Yes: `I9kField` composition, native attributes, and sizes    | `.field*` remains until the website form batch migrates               |
| `I9kSelect`        | Yes: single-select composition, native attributes, and sizes | `.field*` remains until the website form batch migrates               |
| `I9kRadioGroup`    | Yes: default and card variants with accessible group state   | Website intent selection remains unchanged until Batch 3              |
| `I9kPanel`         | Yes: default, feature, and flat scoped surfaces              | `.surface*` remains until Batches 0-1 migrate direct usage            |
| `I9kBadge`         | Yes: solid, outline, and tag variants                        | `.badge*` remains until Batches 0-2 migrate direct usage              |
| `I9kGrid`          | Yes: responsive fixed and auto columns                       | `.grid*` remains until Batches 0-2 migrate direct usage               |
| `I9kCluster`       | Yes: wrapping layout with shared sizes                       | `.cluster*` remains until Batches 0-4 migrate direct usage            |
| `I9kStat`          | Yes: typed props and rich named slots                        | `.stat*` remains until Batches 0-1 migrate direct usage               |
| `I9kText`          | Yes: body and lede scoped typography                         | `.lede` remains until Batches 0-1 migrate direct usage                |
| `I9kPageContainer` | Yes: centered page width and responsive gutters              | Site `.container` remains until shared layouts migrate in Batch 4     |

These form foundations are package-ready only. Batch 3 remains unexecuted: website source and the
`.field*` compatibility CSS are unchanged.

## Direct Primitive Usage Batches

### Batch 0: Baseline and canary

Package files:

- `src/styles/index.css`
- `src/styles/primitives.css`
- New scoped component SFCs required by `pages/design-system.vue`

Website files:

- `pages/design-system.vue`
- `components/ds/DsSpecimen.vue`
- `assets/css/app.css`

Actions:

1. Record the current English/Arabic and light/dark appearance of `/design-system`.
2. Add component specimens for all three sizes and relevant states.
3. Replace primitive-class specimens with real `I9kPanel`, `I9kBadge`, `I9kGrid`, `I9kCluster`,
   `I9kStat`, and `I9kText` examples.
4. Add a bounded `I9kPageContainer` specimen without replacing the live layout wrapper.
5. Keep temporary compatibility CSS enabled for public routes.
6. Generate the site and verify that `/design-system` and `/ar/design-system` are present in static
   output.

### Batch 1: Cards, surfaces, and layout

Website files:

- `components/SocialCard.vue`
- `components/MediaAppearanceCard.vue`
- `components/MediaAudienceStats.vue`
- `components/SectionRail.vue`
- `pages/index.vue`
- `pages/projects.vue`
- `pages/uses.vue`
- `pages/talks.vue`
- `pages/media.vue`

Actions:

1. Replace direct surfaces with `I9kPanel` or the appropriate scoped card.
2. Replace badges, stats, grids, clusters, and lede text with their components.
3. Express previous page-level visual overrides through public props or local layout wrappers.
4. Confirm that interactive cards still contain one valid primary interactive element.

Routes: `/`, `/projects`, `/uses`, `/talks`, `/media` and `/ar` equivalents.

### Batch 2: Timeline content

Website files:

- `components/BlogCard.vue`
- `components/TalkCard.vue`
- `pages/blog/index.vue`
- `pages/talks.vue`
- `pages/design-system.vue`

Actions:

1. Move timeline title, link, thumbnail, rail, and responsive behavior into scoped
   `I9kTimelineCard` markup.
2. Preserve analytics click handlers and external-link attributes.
3. Replace filter/page button variants with pressed buttons and `I9kPagination`.
4. Confirm empty filtering, first/last page, and narrow-screen thumbnail behavior.

Routes: `/blog`, `/talks`, `/design-system` and `/ar` equivalents.

### Batch 3: Forms and validation

Website files:

- `components/InquiryField.vue`
- `components/InquiryForm.vue`
- `components/InquiryIntentSelector.vue`
- `pages/work-with-me.vue`

Actions:

1. Replace `.field*` markup with `I9kField` and the matching input component.
2. Preserve native `name`, `autocomplete`, required, value, and submission behavior.
3. Preserve English and Arabic validation messages and `aria-describedby` connections.
4. Preserve Turnstile error focus and conditional-field validation.
5. Verify keyboard-only intent selection and form submission states.

Routes: `/work-with-me` and `/ar/work-with-me`.

### Batch 4: Navigation and shared layout

Website files:

- `components/NavMenu.vue`
- `layouts/partial/TheNavbar.vue`
- `layouts/default.vue`
- `layouts/clean.vue`
- `components/SocialLinks.vue`
- `pages/links.vue`

Actions:

1. Normalize compact button/icon sizes without deep selectors.
2. Preserve Nuxt locale-aware navigation and active-link behavior.
3. Verify theme and language controls before and after hydration.
4. Verify mobile-menu focus order, Escape dismissal, and RTL placement.
5. Confirm blurred-circle animation and reduced-motion behavior remain scoped.

Routes: `/`, `/links`, `/ar`, and `/ar/links`, plus navigation across every public route.

### Batch 5: Branded content components

Website files:

- `components/AuthorCard.vue`
- `components/GithubEmbed.vue`
- `pages/blog/[...slug].vue`
- Every page importing `I9kPageHeader`, `I9kSectionHeading`, `I9kLinkCard`, or `I9kFaqList`

Actions:

1. Verify the medium default preserves current visuals.
2. Remove remaining reliance on package primitive selectors from branded SFC internals.
3. Exercise long English and Arabic titles, FAQ keyboard interaction, external links, and
   missing-content states.

Routes: one generated English and Arabic blog article plus all routes from earlier batches.

### Batch 6: Compatibility removal

Package actions:

1. Confirm the live-source zero-usage searches below return no matches.
2. Remove the temporary legacy stylesheet from `style.css`.
3. Delete retired primitive rules and deprecated button variants.
4. Update README exports, migration notes, and the package release notes.
5. Run the package and website release gates against the same package commit.

Website actions:

1. Remove the `primitives` cascade layer from `assets/css/app.css` if it no longer contains any
   imported rules.
2. Update `/design-system` copy so it documents components instead of retired classes.
3. Commit the completed ledger with every batch marked complete.

## Zero-Usage Gates

Run from `../ismail9k.com` and restrict the scan to live Vue source:

```bash
find components layouts pages -type f -name '*.vue' -print0 \
  | xargs -0 grep -nE 'class="[^"]*(surface|badge|stat|grid|cluster|lede|field|timeline|toast)(--|__|[ "{])'
```

Expected final result: no matches for package-owned legacy primitives. A site-local class such as
`field-grid`, `topic-grid`, or `reel-grid` is allowed only when its rule is owned by the same SFC
and does not reproduce a package primitive.

```bash
find components layouts pages -type f -name '*.vue' -print0 \
  | xargs -0 grep -nE 'variant="(default|filter|pagination|page)"|:deep\(\.btn\)|timeline__(title|link|thumb)'
```

Expected final result: no matches.

## Verification Matrix

For every affected route, verify:

| Dimension        | Required cases                                                       |
| ---------------- | -------------------------------------------------------------------- |
| Locale/direction | English LTR and Arabic RTL                                           |
| Theme            | Light and dark                                                       |
| Viewport         | 375px mobile and at least 1280px desktop                             |
| Rendering        | Direct static page load and client-side navigation                   |
| Input            | Pointer and keyboard-only                                            |
| Motion           | Default and `prefers-reduced-motion: reduce`                         |
| Content          | Normal, long, empty, loading, disabled, and invalid where applicable |

Required route set:

- `/` and `/ar`
- `/projects` and `/ar/projects`
- `/uses` and `/ar/uses`
- `/talks` and `/ar/talks`
- `/blog` and `/ar/blog`
- One generated English and Arabic blog article
- `/work-with-me` and `/ar/work-with-me`
- `/media` and `/ar/media`
- `/links` and `/ar/links`
- `/design-system` and `/ar/design-system`

## Repository Release Gates

Run in `9k-design-system`:

```bash
npm run check
npm pack --dry-run
```

Run in `ismail9k.com` with the intended local package commit installed:

```bash
npm run lint
npm run generate
```

The final compatibility removal is allowed only when all four commands pass, the zero-usage
searches are empty, and the verification matrix has no unresolved regressions.

## Rollback Strategy

- Keep compatibility CSS through Batches 0-5 so any website batch can be reverted independently.
- Commit each batch separately and avoid combining package API removal with website adoption.
- If a website batch fails, revert only that batch; do not reintroduce component styles into site
  global CSS.
- If final compatibility removal fails, restore the legacy stylesheet import and deprecated API
  shims, then fix the consumer before attempting removal again.
- Do not publish a stable release while the website requires an unpublished package commit or a
  local-only CSS override.

## Completion Record

This migration is complete only when:

- Batches 0-6 have landed in order.
- All 22 importing source files have been reviewed.
- All global primitive and deprecated API searches return no live matches.
- The full route verification matrix passes.
- Both repository release gates pass against the same package version.
- `style.css` contains foundations and scoped component output but no legacy component selectors.
