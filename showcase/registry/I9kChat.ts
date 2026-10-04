import type { ShowcaseEntry } from './types';

export const I9kChatEntry: ShowcaseEntry = {
  name: 'I9kChat',
  section: 'content',
  summary:
    'The shell of a scripted chat: a feature panel with a header (Nino, the bot name and actions), a scrolling live log of bubbles, and a sunken footer tray for the answer controls.',
  agentPrompt: `Use I9kChat from @9klabs/design to render a guided, scripted conversation (an estimator, an intake form told as a chat). It is presentation only: your page owns the questions, answers, validation and analytics, and passes every string translated.

import { I9kChat, I9kChatBubble, I9kChatOptions, I9kChatComposer } from '@9klabs/design';

Props:
- logLabel: string (required) — accessible name of the role="log" region.
- title?: string — the bot name in the header.
- expression?: I9kNinoExpression (default 'idle') — Nino's face, e.g. 'thinking' while the bot types, 'happy' when done.
- expanded?: boolean (default false) — lifts the log's height cap (min(60vh, 34rem)) so a final result is never clipped.

Slots:
- default — the I9kChatBubble list.
- avatar — replaces Nino in the header.
- actions — header end, e.g. a "Start over" link button.
- footer — the answer tray (I9kChatOptions or I9kChatComposer). Leave it empty when nothing is being asked and the tray is not rendered.

Exposes: scrollToEnd() — call it after you append a message; the log scrolls, not the page.

IMPORTANT: the log is aria-live="polite", so screen readers announce new bubbles. Do not add another live region around it.

IMPORTANT: no strings are built in. Pass logLabel and title translated, and translate the labels of the bubble, options and composer too.

Usage:
<I9kChat ref="chat" title="9k Labs" log-label="Conversation" :expression="typing ? 'thinking' : 'idle'">
  <template #actions><I9kButton size="sm" variant="link" @click="restart">↺ Start over</I9kButton></template>
  <I9kChatBubble>What are you looking to build?</I9kChatBubble>
  <I9kChatBubble from="user" speaker-label="You">A website</I9kChatBubble>
  <template #footer>
    <I9kChatOptions label="What are you looking to build?">
      <I9kButton @click="answer('website')">A website</I9kButton>
    </I9kChatOptions>
  </template>
</I9kChat>`,
  gotchas: [
    'Presentation only: the conversation state, branching and validation stay in your page.',
    'Call the exposed scrollToEnd() after adding a bubble; the log scrolls inside the panel.',
    'Set `expanded` once a tall result is shown so it is not clipped by the log height cap.',
    'The footer tray only renders when the footer slot has content.',
  ],
  demos: [
    {
      label: 'A scripted conversation',
      code: `<I9kChat title="9k Labs" log-label="Conversation">
  <template #actions><I9kButton size="sm" variant="link">↺ Start over</I9kButton></template>
  <I9kChatBubble>👋 Hi! A few quick questions, then a ballpark price.</I9kChatBubble>
  <I9kChatBubble>What are you looking to build?</I9kChatBubble>
  <I9kChatBubble from="user" speaker-label="You">AI automation</I9kChatBubble>
  <I9kChatBubble>How many of your systems does it connect to?</I9kChatBubble>
  <template #footer>
    <I9kChatOptions label="How many of your systems does it connect to?">
      <I9kButton>0–1</I9kButton>
      <I9kButton>2–3</I9kButton>
      <I9kButton>4 or more</I9kButton>
    </I9kChatOptions>
  </template>
</I9kChat>`,
    },
    {
      label: 'Typing, with a free-text answer',
      code: `<I9kChat title="Ismail" log-label="Conversation" expression="thinking">
  <I9kChatBubble>Got it. And what's your name?</I9kChatBubble>
  <I9kChatBubble typing typing-label="Typing" />
  <template #footer>
    <I9kChatComposer v-model="name" label="Your name" placeholder="Your name" />
  </template>
</I9kChat>`,
      state: { name: '' },
    },
  ],
};
