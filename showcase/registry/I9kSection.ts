import type { ShowcaseEntry } from './types';

export const I9kSectionEntry: ShowcaseEntry = {
  name: 'I9kSection',
  section: 'content',
  summary:
    'Titled page section, named by its heading, whose header carries its own actions and an optional toolbar. It can collapse behind a disclosure button inside the heading, controlled with v-model:open or left to manage itself. The primary variant fills it with the brand green, and fullWidth lets that fill reach the viewport edges as a band.',
  agentPrompt: `Use I9kSection from @9klabs/design for a titled section of a page whose actions belong in its header, such as "Invite member" beside "Team", optionally collapsible.

import { I9kSection } from '@9klabs/design';

Props:
- title: string (required) — the heading text; it is also the disclosure button's label when collapsible.
- id?: string — set on the <section>; the heading gets "<id>-heading" and the body "<id>-body". Omit it and unique ids are generated.
- level?: 2 | 3 | 4 | 5 | 6 (default 2) — the rendered heading level (<h{level}>).
- collapsible?: boolean (default false) — puts a disclosure button in the heading and lets the section manage its own open state.
- open?: boolean (default undefined) — bind with v-model:open to control the open state from the parent, e.g. for expand-all. Binding a boolean makes the section collapsible; also set \`collapsible\` when the bound value can be undefined, or the section has no disclosure button while it is.
- defaultOpen?: boolean (default true) — the initial state of a collapsible section whose \`open\` is not bound.
- variant?: 'default' | 'primary' (default 'default') — 'primary' fills the section with the brand green, pads it, rounds its corners, and re-themes its content for the green (see Behavior).
- fullWidth?: boolean (default false) — on the primary variant, the green reaches the viewport edges while the content stays in its column, as a full-width band. It has no visible effect on the default variant, which has no fill.

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

On variant 'primary', the section re-maps the theme tokens its header and body read: text, links and focus rings turn white; a primary I9kButton inverts to white with green text; borders, I9kPanel surfaces and secondary buttons turn translucent white. Nested design-system components need no extra props on the green. The green is the same in light and dark themes.

With fullWidth, place the section where the page column is (inside the page container, or anywhere with the column's width). The section box stays that wide and only its green fill paints out to the viewport edges, so the page never scrolls sideways.

IMPORTANT: bind \`v-model:open\`, not a one-way \`:open\`, or clicking the button never opens or closes the section.

IMPORTANT: on variant 'primary', keep content to text, buttons, links, badges and panels. Error, warning and success colors are not re-mapped, so an error message or invalid border is invisible on the green: keep any field that can show an error, and toasts, off it. Render I9kModal outside the section too, or its dialog inherits the white-on-green tokens and turns translucent.

IMPORTANT: use it for the major sections of a page. Every instance is a named landmark, so do not use it for small groups inside a form or a card.

Usage:
<I9kSection id="team" v-model:open="teamOpen" title="Team">
  <template #actions>
    <I9kButton size="sm" @click="invite"><I9kIcon name="add" /> Invite member</I9kButton>
  </template>
  <I9kPanel size="sm">Member list</I9kPanel>
</I9kSection>

<I9kSection variant="primary" full-width title="Join the next cohort">
  <template #actions>
    <I9kButton variant="primary">Enroll now</I9kButton>
  </template>
  <I9kText>Six weeks, live sessions, and a project you ship.</I9kText>
</I9kSection>`,
  gotchas: [
    'Binding `open` makes the section collapsible; use `collapsible` alone for a section that manages its own state.',
    'A controlled section only emits `update:open`; bind `v-model:open` or the disclosure button does nothing.',
    '`defaultOpen` is true, unlike I9kCollapsible, because a section shows its content unless asked not to.',
    'Actions and toolbar stay visible while the section is closed, so a result an action reports inside the body is hidden until the section opens; open it from the action.',
    'Every instance is a named `<section>`, which is a region landmark; do not use it for small groups.',
    'The body is hidden with the `hidden` attribute, not an inline style, so it stays closed under a `style-src` Content Security Policy.',
    '`fullWidth` only extends the fill, so it has no visible effect on `variant="default"`.',
    'Render I9kModal outside a `variant="primary"` section, not next to its trigger in `#actions` or the body: its native `<dialog>` inherits the white-on-green tokens while it paints off the green, so its surface turns translucent and the page shows through.',
    'The full-width band paints past the section with a border-image outset. An ancestor with `overflow: hidden`, `clip` or `auto` cuts it off at that ancestor edge, and it paints over the background of a non-positioned side column beside the page column.',
    'On `variant="primary"`, a primary I9kButton inverts to white with green text, and focus rings turn white; do not override those colors back to green.',
    'Error, warning and success colors are not re-mapped on `variant="primary"`: in the light theme the error color is 1.06:1 on the green and the success color is the green itself, so an error message or invalid border is invisible. Keep any field that can show an error, and any feedback, off the green.',
    'On the default and full-width variants the disclosure button sits 0.5rem past the section inline-start edge so its title lines up with the body, and its focus ring reaches about 0.8rem out; inside a scroll container or `overflow: hidden`, leave that much room or both are clipped. The contained primary variant keeps both inside its padding.',
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
      label: 'Primary',
      code: `<I9kSection variant="primary" title="Join the next workshop">
  <template #actions>
    <I9kButton size="sm" variant="primary">Reserve a seat</I9kButton>
  </template>
  <div style="display: grid; gap: var(--spacing-8)">
    <I9kText>Two evenings of live pairing on real Vue codebases, with notes to keep.</I9kText>
    <I9kCluster>
      <I9kButton>See the schedule</I9kButton>
      <I9kButton variant="link" href="#">Read past notes</I9kButton>
    </I9kCluster>
  </div>
</I9kSection>`,
    },
    {
      label: 'Full-width primary band',
      code: `<div style="padding-inline: var(--spacing-13)">
  <I9kSection variant="primary" full-width title="Ready to ship your first course?">
    <div style="display: grid; gap: var(--spacing-8)">
      <I9kText variant="lede">The band reaches the edges; the text keeps its column.</I9kText>
      <I9kGrid :columns="2">
        <I9kPanel size="sm">Panels turn translucent on the green.</I9kPanel>
        <I9kPanel size="sm">Borders and text follow.</I9kPanel>
      </I9kGrid>
      <I9kCluster>
        <I9kButton variant="primary">Start building</I9kButton>
        <I9kButton>Talk to us</I9kButton>
      </I9kCluster>
    </div>
  </I9kSection>
</div>`,
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
