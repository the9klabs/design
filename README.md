# @9klabs/design

Reusable Vue 3 primitives from [ismail9k.com](https://ismail9k.com/design-system/).

## Install

```bash
npm install @9klabs/design
```

Import the shared CSS once in your application entry point:

```ts
import '@9klabs/design/style.css';
```

Then use components directly:

```vue
<script setup lang="ts">
import { I9kButton, I9kLinkCard, I9kPageHeader } from '@9klabs/design';
</script>
```

The package is framework-agnostic within Vue 3. `I9kButton` uses a normal anchor for `to` by default. Pass `link-component="RouterLink"` in Vue Router apps when you want router navigation.

## Exports

- `I9kButton`
- `I9kButtonGroup`
- `I9kBadge`
- `I9kCluster`
- `I9kField`
- `I9kGrid`
- `I9kIconButton`
- `I9kInput`
- `I9kLinkCard`
- `I9kPageContainer`
- `I9kPageHeader`
- `I9kPanel`
- `I9kRadioGroup`
- `I9kSectionHeading`
- `I9kSelect`
- `I9kStat`
- `I9kTextarea`
- `I9kText`
- `I9kTimelineCard`
- `I9kArticleHeader`
- `I9kAsciiEmoji`
- `I9kBlurredCircles`
- `I9kBrandWordmark`
- `I9kFaqList`
- `I9kFooter`
- `I9kIcon`, a curated local set of brand, social, contact, and navigation SVG icons
- `I9kLanguageSwitcher`
- `I9kNavigation`
- `I9kSocialLinks`
- `I9kThemeSwitcher`
- `I9kToast`
- design tokens and primitive CSS via `@9klabs/design/style.css`

## Component sizes and styles

Visual components use the shared `sm`, `md`, and `lg` size scale and default to `md`:

```vue
<I9kButton size="sm">Compact action</I9kButton>
<I9kInput v-model="email" label="Email" ui-size="md" />
<I9kToast size="lg" variant="success">Saved successfully</I9kToast>
<I9kAsciiEmoji name="^_^" size="sm" />
<I9kLinkCard size="md" name="Project" url="https://example.com" description="Description" />
<I9kProfileCard size="lg" name="Abdelrahman Ismail" />
<I9kTimelineCard size="md" date="2026-01-25">
  <template #title><a href="/article">Article title</a></template>
  Article summary
</I9kTimelineCard>
```

Component appearance is scoped to each Vue SFC. The global stylesheet supplies fonts, brand
tokens, themes, element defaults, accessibility utilities, and temporary compatibility styles
for the current `ismail9k.com` migration.

Use `.i9k-fading-grid` for a decorative grid that fades toward the bottom. Override
`--i9k-fading-grid-color`, `--i9k-fading-grid-size`, or `--i9k-fading-grid-fade-end` on the
container when the defaults need to match a specific surface.

Existing migrated components may still emit legacy classes during the website compatibility
window. New surface and layout components emit only `i9k-` classes; all consumers should treat
component props, slots, and `i9k-` classes as the supported contract.

`I9kInput` uses `uiSize` for its visual scale so the native HTML `size` attribute remains available
for character-based input widths.

## Surfaces, layout, and content

Surface and layout components accept an `as` prop when the rendered element needs stronger
semantics. Layout components style only their own layout and do not change their children.

```vue
<script setup lang="ts">
import {
  I9kBadge,
  I9kCluster,
  I9kGrid,
  I9kPageContainer,
  I9kPanel,
  I9kStat,
  I9kText,
} from '@9klabs/design';
</script>

<template>
  <I9kPageContainer>
    <I9kText variant="lede">A clear introduction with a deliberate reading measure.</I9kText>

    <I9kGrid :columns="3">
      <I9kPanel v-for="index in 3" :key="index" as="article">
        <I9kCluster size="sm">
          <I9kBadge variant="tag">Vue</I9kBadge>
        </I9kCluster>
        <I9kStat value="480k+" label="monthly downloads" />
      </I9kPanel>
    </I9kGrid>
  </I9kPageContainer>
</template>
```

`I9kPageContainer` renders a `div` by default to avoid creating nested page landmarks. Its medium
size preserves the branded 1000px page width and responsive desktop/mobile gutters; choose a
semantic root with `as` when the surrounding layout does not already provide one.

## Color and surface roles

Green identifies primary actions and selection. Orange is a brand accent for details such as
link underlines and featured panel borders. Errors use their own red palette, with foreground
and background values tuned for each theme.

| Role             | Tokens                                                                       | Usage                                                                                      |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Canvas           | `--theme-bg-color`                                                           | Page background                                                                            |
| Surface          | `--surface-color`                                                            | Panels, cards, and fields                                                                  |
| Raised surface   | `--surface-raised-color`                                                     | Featured panels and message banners; pair with `--shadow-sm`                               |
| Interaction      | `--surface-hover-color`, `--surface-sunken-color`                            | Neutral hover and pressed states                                                           |
| Selection        | `--selected-bg-color`, `--primary-text-color`                                | Selected filters, page numbers, and radio cards                                            |
| Feedback         | `--error-color`, `--error-bg-color`, `--success-color`, `--success-bg-color` | Validation and status messages                                                             |
| Control boundary | `--control-border-color`, `--focus-color`                                    | Input/button borders and keyboard focus; `--border-color` remains a subtle surface divider |

Glass tokens remain available for overlays such as navigation. Ordinary content surfaces are
opaque so their contrast stays predictable over images and decorative backgrounds.

Primary and secondary actions share an 8px radius and the same size scale; filter buttons remain
pills. Use `I9kCluster` or `I9kButtonGroup` to space adjacent actions. For a busy native action, pass
`disabled` and `aria-busy="true"` and update its label, for example:

```vue
<I9kButton variant="primary" :disabled="saving" :aria-busy="saving">
  {{ saving ? 'Saving…' : 'Save changes' }}
</I9kButton>
```

`aria-busy` and `aria-disabled` provide styling and accessibility state, not event suppression.
Consumers must manage interaction themselves for anchors and custom link components.

## Native actions and form fields

Use the action and form components through the package entry point. Keep native attributes such as
`name`, `autocomplete`, and `required` on the control component; `I9kField` owns the visible label,
hint, error, and their accessibility associations.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  I9kButton,
  I9kButtonGroup,
  I9kField,
  I9kIconButton,
  I9kInput,
  I9kRadioGroup,
  I9kSelect,
  I9kTextarea,
} from '@9klabs/design';

const email = ref('');
const details = ref('');
const service = ref('audit');
const intent = ref('audit');
const intentOptions = [
  { label: 'Product audit', value: 'audit', description: 'Review an existing product' },
  { label: 'Product build', value: 'build', description: 'Create a new experience' },
];
</script>

<template>
  <I9kIconButton icon="home" label="Home" />

  <I9kButtonGroup label="Draft actions">
    <I9kButton>Save</I9kButton>
    <I9kIconButton icon="mail" label="Email draft" />
  </I9kButtonGroup>

  <I9kField label="Email" hint="Use your work address." required>
    <I9kInput v-model="email" name="email" type="email" autocomplete="email" required />
  </I9kField>

  <I9kField label="Project details">
    <I9kTextarea v-model="details" name="details" rows="5" />
  </I9kField>

  <I9kField label="Service">
    <I9kSelect v-model="service" name="service">
      <option value="audit">Product audit</option>
      <option value="build">Product build</option>
    </I9kSelect>
  </I9kField>

  <I9kRadioGroup
    v-model="intent"
    :options="intentOptions"
    legend="Project intent"
    name="intent"
    variant="card"
  />
</template>
```

Visual controls default to `md` and support `sm`, `md`, and `lg`. `I9kInput` uses `uiSize` for
visual sizing so the native HTML `size` attribute remains available. `I9kSelect` intentionally
supports the native single-select contract; native `multiple` and `size` modes are outside that
contract.

## Typography

The package ships the ismail9k brand fonts through its CSS entry point, so consumers only need:

```ts
import '@9klabs/design/style.css';
```

- **English UI and display:** IBM Plex Sans, exposed as `--font-sans`.
- **English editorial text:** IBM Plex Serif, exposed as `--font-serif`.
- **Arabic UI and body:** Thmanyah Sans, exposed as `--font-arabic-sans`.
- **Arabic display treatments:** Thmanyah Serif Display, exposed as `--font-arabic-display`.

Arabic text automatically uses Thmanyah Sans through `:lang(ar)`. Arabic headings use Thmanyah Serif Display. Use `.i9k-root` on an app shell to explicitly apply IBM Plex Sans, and `.i9k-arabic` / `.i9k-arabic-display` when language metadata is unavailable.

## Development

```bash
npm install
npm run storybook
npm test
npm run test:watch
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run build-storybook
npm pack --dry-run
```

`npm test` runs Vitest once; `npm run test:watch` reruns affected unit tests while developing. `npm run check` runs tests, formatting, linting, TypeScript checks, the library build, and the static Storybook build in one command.

Storybook provides isolated component documentation, light and dark theme previews, and accessibility checks. It is development tooling only and is excluded from the published npm tarball.
