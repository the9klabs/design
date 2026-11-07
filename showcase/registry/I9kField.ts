import type { ShowcaseEntry } from './types';

export const I9kFieldEntry: ShowcaseEntry = {
  name: 'I9kField',
  section: 'forms',
  summary:
    'Field wrapper that renders a label, hint, and error, and provides id/size/validity context to one nested control. It is the provider side of the field composable; I9kInput, I9kTextarea, and I9kSelect are its consumers.',
  agentPrompt: `Use I9kField from @9klabs/design to wrap a single form control with a label, hint, and error.

import { I9kField } from '@9klabs/design';

Props:
- label?: string (default '') — ignored if the #label slot is used instead.
- hint?: string
- error?: string — a defined value renders the error message instead of the hint and marks the control invalid.
- required?: boolean (default false) — shows a trailing "*" next to the label.
- size?: 'sm' | 'md' | 'lg' (default 'md')
- controlId?: string — supply to pin the id instead of the auto-generated one.

Emits: none.

Slots:
- label — overrides the label prop's content.
- default — scoped slot exposing { controlId, describedBy, invalid, required, size }; the nested control reads these.
- action — controls that act on the field's control, such as a Search button: drawn beside it, stretched to its height, with the hint and error below both.

IMPORTANT: nest exactly one form control in the default slot. I9kInput, I9kTextarea, and I9kSelect read this context automatically via useI9kField() — inside I9kField, omit their own label/hint/error/uiSize props, since I9kField owns and renders those. I9kRadioGroup does NOT consume this context (it has its own legend/hint/error/size props) — do not wrap it in I9kField.

For a raw native control instead of a package component, bind the scoped slot props by hand: :id="controlId", :aria-describedby="describedBy", :aria-invalid="invalid", :required="required".

Usage:
<I9kField label="Email" hint="We never share it."><I9kInput v-model="email" /></I9kField>`,
  gotchas: [
    'Nest exactly one control — I9kField only tracks and warns (in dev) if more than one registers.',
    'Inside I9kField, do not pass label, hint, error, or uiSize/size to I9kInput, I9kTextarea, or I9kSelect: I9kField supplies them through the field composable.',
    "I9kRadioGroup ignores I9kField entirely — it never calls useI9kField(), so wrapping it here has no effect and produces an orphaned label/hint/error alongside the group's own legend/hint/error. Pass legend, hint, error, and size straight to I9kRadioGroup instead.",
  ],
  demos: [
    {
      label: 'Wrapping I9kInput',
      code: `<I9kField label="Email" hint="We never share it."><I9kInput v-model="email" /></I9kField>`,
      state: { email: '' },
    },
    {
      label: 'Sizes',
      code: `<I9kField label="Small" size="sm"><I9kInput v-model="a" /></I9kField>
<I9kField label="Medium" size="md"><I9kInput v-model="b" /></I9kField>
<I9kField label="Large" size="lg"><I9kInput v-model="c" /></I9kField>`,
      state: { a: '', b: '', c: '' },
    },
    {
      label: 'Required with error',
      code: `<I9kField label="Email" required error="This field is required.">
  <I9kInput v-model="email" />
</I9kField>`,
      state: { email: '' },
    },
  ],
};
