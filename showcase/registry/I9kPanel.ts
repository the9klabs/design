import type { ShowcaseEntry } from './types';

export const I9kPanelEntry: ShowcaseEntry = {
  name: 'I9kPanel',
  section: 'layout',
  summary:
    'Opaque, bordered surface for grouping content. Use it as the standard card/surface wrapper wherever content needs visual separation from the page background.',
  agentPrompt: `Use I9kPanel from @9klabs/design to wrap content in a bordered surface.

import { I9kPanel } from '@9klabs/design';

Props:
- as?: string | Component (default 'div') — the rendered root tag or component.
- size?: 'sm' | 'md' | 'lg' (default 'md') — sets padding, and border radius on the 'default' and 'flat' variants.
- variant?: 'default' | 'feature' | 'flat' (default 'default') — sets the border and background treatment.

Emits: none.

Slots: default — the panel content.

Behavior: 'default' renders a 1px border and an opaque surface. 'feature' uses a raised surface, subtle shadow, and orange-accented border for content that should stand out (e.g. a highlighted pricing tier), and always renders with the large border radius, regardless of \`size\`. 'flat' removes the border, background, and backdrop-filter entirely, leaving only the size-driven padding — useful when you want the padding/radius rhythm without a visible surface, e.g. nested inside another panel.

IMPORTANT: \`variant="flat"\` strips the border and background — do not combine it with content that depends on the panel having a visible surface.

IMPORTANT: \`variant="feature"\` hardcodes the large border radius and ignores \`size\` for radius — \`size\` on a feature panel changes padding only.

Usage:
<I9kPanel variant="feature" size="lg"><I9kText variant="lede">Highlighted content</I9kText></I9kPanel>`,
  gotchas: [
    '`variant="flat"` removes the border, background, and backdrop-filter, keeping only padding and radius.',
    '`size` controls padding and, on the `default`/`flat` variants, border radius — it does not control width, since the panel is only as wide as its container allows.',
    '`variant="feature"` always renders the large border radius, overriding whatever `size` would otherwise set — pick `size` on a feature panel for padding only, not radius.',
  ],
  demos: [
    {
      label: 'Surface and feedback in context',
      code: `<I9kPanel>
  <I9kSectionHeading title="Join the next workshop" description="Get the schedule and joining instructions by email." />
  <I9kInput v-model="email" label="Email address" type="email" error="Enter a valid email address." />
  <I9kCluster>
    <I9kButton variant="primary">Join the workshop</I9kButton>
    <I9kButton>Cancel</I9kButton>
  </I9kCluster>
</I9kPanel>`,
      state: { email: 'ismail@' },
    },
    {
      label: 'Variants',
      code: `<I9kGrid :columns="3">
  <I9kPanel variant="default">Default panel</I9kPanel>
  <I9kPanel variant="feature">Feature panel</I9kPanel>
  <I9kPanel variant="flat">Flat panel</I9kPanel>
</I9kGrid>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: grid; gap: var(--spacing-8)">
  <I9kPanel size="sm">Small panel</I9kPanel>
  <I9kPanel size="md">Medium panel</I9kPanel>
  <I9kPanel size="lg">Large panel</I9kPanel>
</div>`,
    },
  ],
};
