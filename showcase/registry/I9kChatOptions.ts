import type { ShowcaseEntry } from './types';

export const I9kChatOptionsEntry: ShowcaseEntry = {
  name: 'I9kChatOptions',
  section: 'actions',
  summary:
    'The answer row of an I9kChat footer: a named group of reply buttons aligned to the user side, with a focus() handle so the conversation can move focus to the next question.',
  agentPrompt: `Use I9kChatOptions from @9klabs/design in the footer slot of I9kChat when the answer is a choice.

import { I9kChatOptions } from '@9klabs/design';

Props:
- label: string (required) — accessible name of the group; use the question text.

Slots: default — the reply buttons (usually I9kButton; use variant="filter" with :active for multi-select).

Exposes: focus() — focuses the first enabled control. Call it after the bot asks the next question so keyboard users land on the answers.

Behavior: buttons wrap and align to the end side (the user's side), mirroring in Arabic.

Usage:
<I9kChatOptions ref="options" label="What are you looking to build?">
  <I9kButton @click="answer('website')">A website</I9kButton>
  <I9kButton @click="answer('app')">An app</I9kButton>
</I9kChatOptions>`,
  gotchas: [
    'The group needs a `label`; use the question being answered.',
    'Key the component by question so a multi-select starts empty for each one.',
  ],
  demos: [
    {
      label: 'Single choice',
      code: `<I9kChatOptions label="How many of your systems does it connect to?">
  <I9kButton>0–1</I9kButton>
  <I9kButton>2–3</I9kButton>
  <I9kButton>4 or more</I9kButton>
</I9kChatOptions>`,
    },
  ],
};
