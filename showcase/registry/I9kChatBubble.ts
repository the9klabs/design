import type { ShowcaseEntry } from './types';

export const I9kChatBubbleEntry: ShowcaseEntry = {
  name: 'I9kChatBubble',
  section: 'content',
  summary:
    'One message in an I9kChat log: a bot bubble on the start side or a user bubble on the end side, with a typing indicator, a wide variant for rich results and an editable variant for revisiting an answer.',
  agentPrompt: `Use I9kChatBubble from @9klabs/design inside I9kChat for each message.

import { I9kChatBubble } from '@9klabs/design';

Props:
- from?: 'bot' | 'user' (default 'bot') — side, colour and tail corner. Corners and alignment are logical, so they mirror in Arabic.
- typing?: boolean — shows a three-dot indicator (role="status") instead of the content.
- typingLabel?: string (default 'Typing') — accessible name of that indicator; translate it.
- speakerLabel?: string — visually hidden prefix such as "You" so screen readers know who said it.
- wide?: boolean — spans the full log width, for a result card.
- editable?: boolean — renders the bubble as a <button> that emits \`edit\`, so the user can change that answer.
- editLabel?: string — accessible name of the editable bubble, e.g. "Change your answer to: What's your name?".

Emits: edit() — the editable bubble was activated.

Slots: default — the message; after — content under the bubble on its side, e.g. a "↩ Change" link.

Behavior: user bubbles keep line breaks (white-space: pre-wrap). Bot bubbles fade in unless the visitor prefers reduced motion.

Usage:
<I9kChatBubble>What should the AI do?</I9kChatBubble>
<I9kChatBubble from="user" speaker-label="You">Answer questions from our documents
  <template #after><button type="button" @click="back">↩ Change</button></template>
</I9kChatBubble>`,
  gotchas: [
    'Pass `speakerLabel` on user bubbles; without it a screen reader hears two voices with no names.',
    'An editable bubble is a button: give it an `editLabel` that names the question being changed.',
    'Only user bubbles preserve line breaks.',
  ],
  demos: [
    {
      label: 'Bot, user, typing and wide',
      code: `<div style="display: grid; gap: var(--spacing-5)">
  <I9kChatBubble>What are you looking to build?</I9kChatBubble>
  <I9kChatBubble from="user" speaker-label="You">A website</I9kChatBubble>
  <I9kChatBubble typing />
  <I9kChatBubble wide>A wide bubble holds a result card.</I9kChatBubble>
</div>`,
    },
    {
      label: 'Editable answer',
      code: `<I9kChatBubble from="user" speaker-label="You" editable edit-label="Change your answer to: What's your name?">Ismail</I9kChatBubble>`,
    },
  ],
};
