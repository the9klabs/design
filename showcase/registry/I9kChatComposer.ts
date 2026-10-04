import type { ShowcaseEntry } from './types';

export const I9kChatComposerEntry: ShowcaseEntry = {
  name: 'I9kChatComposer',
  section: 'forms',
  summary:
    'The free-text answer of an I9kChat footer: a rounded field with a send button. Enter sends; a multiline composer grows with the text and takes Shift+Enter for a new line.',
  agentPrompt: `Use I9kChatComposer from @9klabs/design in the footer slot of I9kChat when the answer is typed.

import { I9kChatComposer } from '@9klabs/design';

Props:
- modelValue: string — bind with v-model.
- label: string (required) — accessible name of the field; use the question text.
- placeholder?: string.
- sendLabel?: string (default 'Send') — accessible name of the send button; translate it.
- multiline?: boolean — a textarea that grows up to 10rem; Shift+Enter inserts a line break.
- maxlength?: number.
- invalid?: boolean — accent border and aria-invalid; render your error message next to it.
- disabled?: boolean.

Emits:
- update:modelValue(value: string).
- submit(value: string) — Enter or the send button, only for non-blank input. Validate and clear the model yourself.

Exposes: focus().

Usage:
<p v-if="error" role="alert">{{ error }}</p>
<I9kChatComposer v-model="draft" label="What's your name?" placeholder="Your name" :invalid="!!error" @submit="answer" />`,
  gotchas: [
    'The composer does not clear itself after submit; reset the bound value when the answer is accepted.',
    'Blank and whitespace-only input never emits `submit`.',
    'Error text is yours to render; `invalid` only styles the field and sets aria-invalid.',
  ],
  demos: [
    {
      label: 'Single line',
      code: `<I9kChatComposer v-model="name" label="What's your name?" placeholder="Your name" />`,
      state: { name: '' },
    },
    {
      label: 'Multiline, invalid',
      code: `<I9kChatComposer v-model="summary" label="What do you need?" multiline invalid />`,
      state: { summary: 'Too short' },
    },
  ],
};
