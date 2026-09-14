import type { ShowcaseEntry } from './types';

export const I9kCollapsibleEntry: ShowcaseEntry = {
  name: 'I9kCollapsible',
  section: 'content',
  summary:
    'Native, independently expanding disclosure surface with slots for rich summary and body content.',
  agentPrompt: `Use I9kCollapsible from @9klabs/design for a single branded disclosure that may contain rich Vue markup.

import { I9kCollapsible } from '@9klabs/design';

Props:
- defaultOpen?: boolean (default false) — sets only the initial native open state when \`open\` is not bound.
- open?: boolean (default undefined) — bind with v-model:open to control the open state from the parent, e.g. an expand-all / collapse-all button. Leave it unbound for the browser-managed, uncontrolled behavior.

Emits:
- toggle(open: boolean) — reports the current native details.open value after a user toggle.
- update:open(open: boolean) — emitted only when \`open\` is bound and a user toggle makes the native state differ from it.

Slots:
- summary — content rendered inside the native <summary>.
- default — content rendered in the disclosure body.

Behavior: the component renders native <details>/<summary>. Unless \`open\` is bound, each instance owns its browser-managed state, so siblings expand independently and any number may stay open. When \`open\` is bound, changing it opens or closes the disclosure, and a user toggle is reported through update:open.

IMPORTANT: \`defaultOpen\` is only an initial-state option; bind \`open\` (v-model:open) when the parent must set the state, such as expand-all. A bound \`open\` without a listener for update:open does not follow user toggles back into the parent — use v-model:open, not a one-way :open.

Usage:
<I9kCollapsible :default-open="true" @toggle="(open) => console.log(open)">
  <template #summary><strong>Module 01</strong> · 7 topics</template>
  <ol><li>What is coding?</li><li>Engineering judgment</li></ol>
</I9kCollapsible>`,
  gotchas: [
    '`defaultOpen` controls only the initial state; bind `v-model:open` for a controlled disclosure such as expand-all.',
    'A one-way `:open` binding does not learn about user toggles; use `v-model:open` so the parent value stays in step.',
    'Uncontrolled sibling instances expand independently; control them with `v-model:open` if only one section may be open.',
    'Provide visible summary content because the summary slot is the disclosure control label.',
  ],
  demos: [
    {
      label: 'Closed',
      code: `<I9kCollapsible>
  <template #summary>Course module</template>
  <p>Module lessons and resources.</p>
</I9kCollapsible>`,
    },
    {
      label: 'Initially open',
      code: `<I9kCollapsible :default-open="true">
  <template #summary>Course module</template>
  <p>This body is visible when the example first renders.</p>
</I9kCollapsible>`,
    },
    {
      label: 'Rich summary',
      code: `<I9kCollapsible>
  <template #summary><span><strong>Module 03</strong> · 9 topics</span></template>
  <ol><li>Plan</li><li>Design</li><li>Build</li></ol>
</I9kCollapsible>`,
    },
    {
      label: 'Independent instances',
      code: `<div style="display: grid; gap: var(--spacing-6)">
  <I9kCollapsible :default-open="true"><template #summary>First</template><p>Open together.</p></I9kCollapsible>
  <I9kCollapsible :default-open="true"><template #summary>Second</template><p>Also open.</p></I9kCollapsible>
</div>`,
    },
    {
      label: 'Controlled',
      code: `<button type="button" @click="open = !open">{{ open ? 'Collapse' : 'Expand' }}</button>
<I9kCollapsible v-model:open="open">
  <template #summary>Course module</template>
  <p>The parent owns whether this body is visible.</p>
</I9kCollapsible>`,
      state: { open: true },
    },
    {
      label: 'Arabic RTL',
      code: `<div dir="rtl" lang="ar">
  <I9kCollapsible :default-open="true">
    <template #summary>الوحدة الأولى</template>
    <p>محتوى الوحدة وتفاصيلها.</p>
  </I9kCollapsible>
</div>`,
    },
  ],
};
