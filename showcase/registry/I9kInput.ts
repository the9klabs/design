import type { ShowcaseEntry } from './types';

export const I9kInputEntry: ShowcaseEntry = {
  name: 'I9kInput',
  section: 'forms',
  summary:
    'Single-line text input with an optional label, hint, and error state. Wires its own accessible ids, and inherits size and error state from a wrapping I9kField when there is one.',
  agentPrompt: `Use I9kInput from @9klabs/design for a labelled single-line text field.

import { I9kInput } from '@9klabs/design';

Props:
- modelValue: string (required) — the v-model target.
- label?: string
- type?: 'text' | 'email' | 'password' (default 'text')
- error?: string | null (default null) — a non-null value renders the error state and wires aria-describedby.
- hint?: string
- required?: boolean (default false)
- uiSize?: 'sm' | 'md' | 'lg' — falls back to a wrapping I9kField's size, then to 'md'.

Emits: update:modelValue with the new string.

Slots:
- action — controls that act on the input, such as an Apply or Search button. They sit beside the input, stretched to its height, and the hint and error go below both. Inside an I9kField, put the action slot on the field instead.

IMPORTANT: the visual scale prop is \`uiSize\`, NOT \`size\`. \`size\` is left free for the native HTML attribute and is forwarded to the underlying <input>.

Usage:
<I9kInput v-model="email" label="Email" type="email" ui-size="md" hint="We never share it." />

An input with its button (never a flex row with align-items: end, which lines the button up with the field's bottom margin):
<form @submit.prevent="apply">
  <I9kInput v-model="code" label="Coupon code">
    <template #action><I9kButton type="submit">Apply</I9kButton></template>
  </I9kInput>
</form>`,
  gotchas: [
    'The visual scale prop is `uiSize`, not `size` — `size` passes through to the native input attribute.',
    'Inside an I9kField, omit `label`, `hint`, `error`, and `uiSize`: the field supplies them and owns the ids.',
    'Put a button that acts on the input in the `action` slot rather than beside the component: the field keeps a bottom margin, so a hand-built row aligned to the end puts the button below the input.',
  ],
  demos: [
    {
      label: 'Sizes',
      code: `<I9kInput v-model="a" ui-size="sm" label="Small" />
<I9kInput v-model="b" ui-size="md" label="Medium" />
<I9kInput v-model="c" ui-size="lg" label="Large" />`,
      state: { a: '', b: '', c: '' },
    },
    {
      label: 'Hint and error',
      code: `<I9kInput v-model="email" label="Email" hint="We never share it." />
<I9kInput v-model="email" label="Email" error="That address is not valid." />`,
      state: { email: '' },
    },
    {
      label: 'With an action',
      code: `<I9kInput v-model="code" label="Coupon code">
  <template #action><I9kButton type="submit">Apply</I9kButton></template>
</I9kInput>
<I9kInput v-model="code" label="Coupon code" error="That code is not valid.">
  <template #action><I9kButton type="submit">Apply</I9kButton></template>
</I9kInput>`,
      state: { code: '' },
    },
  ],
};
