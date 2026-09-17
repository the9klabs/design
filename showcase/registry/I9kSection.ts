import type { ShowcaseEntry } from './types';

export const I9kSectionEntry: ShowcaseEntry = {
  name: 'I9kSection',
  section: 'content',
  summary:
    'Titled page section, named by its heading, whose header carries its own actions and an optional toolbar. It can collapse behind a disclosure button inside the heading, controlled with v-model:open or left to manage itself.',
  agentPrompt: `Use I9kSection from @9klabs/design for a titled section of a page whose actions belong in its header, such as "Invite member" beside "Team", optionally collapsible.

import { I9kSection } from '@9klabs/design';

Props:
- title: string (required) — the heading text; it is also the disclosure button's label when collapsible.
- id?: string — set on the <section>; the heading gets "<id>-heading" and the body "<id>-body". Omit it and unique ids are generated.
- level?: 2 | 3 | 4 | 5 | 6 (default 2) — the rendered heading level (<h{level}>).
- collapsible?: boolean (default false) — puts a disclosure button in the heading and lets the section manage its own open state.
- open?: boolean (default undefined) — bind with v-model:open to control the open state from the parent, e.g. for expand-all. Binding a boolean makes the section collapsible; also set \`collapsible\` when the bound value can be undefined, or the section has no disclosure button while it is.
- defaultOpen?: boolean (default true) — the initial state of a collapsible section whose \`open\` is not bound.

Emits:
- update:open(open: boolean) — every click on the disclosure button, with the requested state.

Slots:
- default — the section body; it gets the \`hidden\` attribute while closed.
- actions — controls for the section, rendered in the header after the heading, outside the disclosure button, and still visible while closed.
- toolbar — a full-width header row under the heading and actions, such as filters or expand-all; still visible while closed.

Data attributes (stable hooks for tests and page scripts):
- data-i9k-section-toggle — on the disclosure button (only while collapsible).
- data-i9k-section-body — on the body wrapper.

Behavior: the root is a <section> labelled by its heading (aria-labelledby), so it is a named region landmark. While collapsible, the heading wraps a <button> with aria-expanded and aria-controls pointing at the body. A controlled section only emits update:open on click and changes when the parent changes \`open\`. Without \`open\` and \`collapsible\` the heading is plain text and the body always shows.

IMPORTANT: bind \`v-model:open\`, not a one-way \`:open\`, or clicking the button never opens or closes the section.

IMPORTANT: use it for the major sections of a page. Every instance is a named landmark, so do not use it for small groups inside a form or a card.

Usage:
<I9kSection id="team" v-model:open="teamOpen" title="Team">
  <template #actions>
    <I9kButton size="sm" @click="invite"><I9kIcon name="add" /> Invite member</I9kButton>
  </template>
  <I9kPanel size="sm">Member list</I9kPanel>
</I9kSection>`,
  gotchas: [
    'Binding `open` makes the section collapsible; use `collapsible` alone for a section that manages its own state.',
    'A controlled section only emits `update:open`; bind `v-model:open` or the disclosure button does nothing.',
    '`defaultOpen` is true, unlike I9kCollapsible, because a section shows its content unless asked not to.',
    'Actions and toolbar stay visible while the section is closed, so a result an action reports inside the body is hidden until the section opens; open it from the action.',
    'Every instance is a named `<section>`, which is a region landmark; do not use it for small groups.',
    'The body is hidden with the `hidden` attribute, not an inline style, so it stays closed under a `style-src` Content Security Policy.',
  ],
  demos: [
    {
      label: 'With actions',
      code: `<I9kSection title="Team">
  <template #actions>
    <I9kButton size="sm"><I9kIcon name="add" /> Invite member</I9kButton>
  </template>
  <I9kPanel size="sm">Member list</I9kPanel>
</I9kSection>`,
    },
    {
      label: 'Controlled, with a toolbar',
      code: `<I9kSection v-model:open="open" title="Projects">
  <template #actions>
    <I9kButton size="sm" variant="primary"><I9kIcon name="add" /> New project</I9kButton>
  </template>
  <template #toolbar>
    <I9kCluster size="sm">
      <I9kButton size="sm" @click="open = true">Expand</I9kButton>
      <I9kButton size="sm" @click="open = false">Collapse</I9kButton>
    </I9kCluster>
  </template>
  <I9kPanel size="sm">Project list</I9kPanel>
</I9kSection>`,
      state: { open: true },
    },
    {
      label: 'Uncontrolled, initially closed',
      code: `<I9kSection title="Billing details" :level="3" collapsible :default-open="false">
  <template #actions>
    <I9kIconButton icon="edit" size="sm" label="Edit billing details" />
  </template>
  <I9kPanel size="sm">Billing address and tax number.</I9kPanel>
</I9kSection>`,
    },
    {
      label: 'Arabic RTL',
      code: `<div dir="rtl" lang="ar">
  <I9kSection title="الملاحظات" collapsible>
    <template #actions>
      <I9kButton size="sm"><I9kIcon name="add" /> أضف ملاحظة</I9kButton>
    </template>
    <I9kPanel size="sm">قائمة الملاحظات.</I9kPanel>
  </I9kSection>
</div>`,
    },
  ],
};
