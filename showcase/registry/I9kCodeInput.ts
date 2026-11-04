import type { ShowcaseEntry } from './types';

export const I9kCodeInputEntry: ShowcaseEntry = {
  name: 'I9kCodeInput',
  section: 'forms',
  summary:
    'One-time code entry drawn as separate digit boxes but backed by a single real input, so paste and the browser or phone "From Mail" AutoFill both work.',
  agentPrompt: `Use I9kCodeInput from @9klabs/design to collect a numeric one-time code (for example a 6-digit email sign-in code).

import { I9kCodeInput } from '@9klabs/design';

Props:
- modelValue: string (required) — digits only; anything else typed or pasted is dropped.
- label: string (required) — the accessible name, shown above the boxes.
- length?: number (default 6) — number of boxes and the maximum number of digits.
- invalid?: boolean — sets aria-invalid and the error styling.
- disabled?: boolean

Emits: update:modelValue (digits only), complete (the code, once each time the model reaches length digits), focus and blur (the native events).

Behavior: there is exactly one <input> (autocomplete="one-time-code", inputmode="numeric", pattern="[0-9]*", maxlength=length). The boxes are aria-hidden decoration. The control stays dir="ltr" inside RTL pages.

Usage:
<I9kCodeInput v-model="code" label="Sign-in code" @complete="verify" />`,
  gotchas: [
    'There is one input, not one per box: do not look for per-box refs or focus management.',
    'The model holds digits only; letters and spaces are stripped, including from a paste.',
    '`complete` fires when the model reaches `length` digits, not on every input.',
    'The control stays left-to-right inside an RTL page, because a code reads left to right.',
  ],
  demos: [
    {
      label: 'Default',
      code: `<I9kCodeInput v-model="code" label="Sign-in code" />`,
      state: { code: '' },
    },
    {
      label: 'Invalid',
      code: `<I9kCodeInput v-model="code" label="Sign-in code" invalid />`,
      state: { code: '123456' },
    },
  ],
};
