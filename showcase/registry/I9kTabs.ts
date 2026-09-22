import type { ShowcaseEntry } from './types';

export const I9kTabsEntry: ShowcaseEntry = {
  name: 'I9kTabs',
  section: 'actions',
  summary:
    'Accessible horizontal tabs (the WAI-ARIA tabs pattern with automatic activation): a named tablist of equal-width tabs over the one panel that belongs to the selected tab.',
  agentPrompt: `Use I9kTabs from @9klabs/design to switch between a few alternative views in one place, such as "I have an account" and "New account" in a sign-in dialog.

import { I9kTabs } from '@9klabs/design';
import type { I9kTabItem } from '@9klabs/design';

Props:
- modelValue: string (required) — bind with v-model; the selected tab's \`value\`.
- tabs: I9kTabItem[] (required) — { value: string; label: string; disabled?: boolean }. \`value\` names the tab's slot; \`label\` is its visible text and accessible name; a disabled tab cannot be selected and the arrow keys skip it.
- label: string (required) — the tablist's accessible name (aria-label); translate it.
- size?: 'sm' | 'md' | 'lg' (default 'md') — the tab height, text size, and the gap above the panel.
- focusablePanel?: boolean (default true) — gives the panel tabindex="0" so keyboard users can reach content that holds nothing focusable. Set it to false when the panel starts with a form field.

Emits:
- update:modelValue(value: string) — the user selected another tab, by click or keyboard.

Slots:
- one named slot per tab \`value\`, e.g. <template #login="{ value }">. It receives { value } and holds that tab's panel content.

Behavior: tabs share the row width equally. Clicking a tab selects it. On a focused tab, ArrowRight and ArrowLeft move to the next and previous enabled tab, wrapping at both ends, and Home and End go to the first and last; moving selects the tab and focuses it. In a right-to-left context (the nearest dir attribute is "rtl") the arrows are mirrored, so ArrowLeft moves to the next tab. A modelValue that matches no enabled tab shows the first enabled tab, without emitting.

IMPORTANT: only the selected tab's panel is rendered, so its content unmounts when another tab is selected and mounts again, with fresh state, when it is selected again. Keep state that must survive a switch in the parent.

IMPORTANT: \`label\` is required because a tablist must have a name; do not repeat the tab labels in it.

IMPORTANT: bind v-model. The component only emits update:modelValue; it does not keep its own selection.

Usage:
<I9kTabs
  v-model="mode"
  :tabs="[
    { value: 'login', label: 'I have an account' },
    { value: 'signup', label: 'New account' },
  ]"
  label="Sign in"
  :focusable-panel="false"
>
  <template #login><LoginForm /></template>
  <template #signup><SignupForm /></template>
</I9kTabs>`,
  gotchas: [
    'Only the selected panel is rendered, so its content remounts with fresh state on every switch; keep state that must survive a switch in the parent.',
    '`label` is required: it names the tablist for screen readers.',
    'Set `:focusable-panel="false"` (bound, not a plain attribute) when the panel starts with a focusable field, so the panel is not an extra tab stop.',
    'Arrow keys mirror in RTL: under the nearest `dir="rtl"`, ArrowLeft moves to the next tab.',
    'Bind `v-model`; the component emits `update:modelValue` and never selects a tab on its own.',
  ],
  demos: [
    {
      label: 'Sign-in modes',
      code: `<I9kTabs v-model="mode" :tabs="modes" label="Sign in" :focusable-panel="false">
  <template #login>
    <I9kInput v-model="email" label="Email" type="email" />
  </template>
  <template #signup>
    <I9kInput v-model="name" label="Full name" />
  </template>
</I9kTabs>`,
      state: {
        mode: 'login',
        modes: [
          { value: 'login', label: 'I have an account' },
          { value: 'signup', label: 'New account' },
        ],
        email: '',
        name: '',
      },
    },
    {
      label: 'Small, with a disabled tab',
      code: `<I9kTabs v-model="section" :tabs="sections" label="Course details" size="sm">
  <template #overview><p>Nine modules, from the first prompt to a shipped project.</p></template>
  <template #curriculum><p>Each module ends with a hands-on exercise.</p></template>
</I9kTabs>`,
      state: {
        section: 'overview',
        sections: [
          { value: 'overview', label: 'Overview' },
          { value: 'curriculum', label: 'Curriculum' },
          { value: 'reviews', label: 'Reviews', disabled: true },
        ],
      },
    },
  ],
};
