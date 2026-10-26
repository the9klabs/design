import type { ShowcaseEntry } from './types';

export const I9kAskAiEntry: ShowcaseEntry = {
  name: 'I9kAskAi',
  section: 'chrome',
  summary:
    'A heading and a row of pill links that open ChatGPT, Perplexity and Claude in a new tab with a question about the site already typed in.',
  agentPrompt: `Use I9kAskAi from @9klabs/design for an "Ask AI about this site" row, usually in I9kFooter's \`extra\` slot.

import { I9kAskAi } from '@9klabs/design';

Props:
- prompt: string (required) — the question each assistant opens with. Write it in the page's language, so the answer comes back in it.
- heading?: string | null (default null) — the visible heading above the links.
- headingTag?: string (default 'h2') — matches I9kFooter's column headings.
- providers?: I9kAskAiProvider[] (default ['chatgpt', 'perplexity', 'claude']) — which assistants, in order.
- align?: 'start' | 'center' (default 'start') — 'center' in I9kFooter's centred layout (no columns and no brand).

Emits: click — [provider: I9kAskAiProvider, event: MouseEvent].

Each link is a plain <a target="_blank" rel="noopener noreferrer">: ChatGPT gets https://chatgpt.com/?q=…, Perplexity https://www.perplexity.ai/search?q=…, Claude https://claude.ai/new?q=…, the prompt URL-encoded. askAiUrl(provider, prompt) builds the same address.

Usage:
<I9kFooter :columns="columns">
  <template #extra>
    <I9kAskAi heading="Ask AI about 9k School" :prompt="t('footer.askAi.prompt')" />
  </template>
</I9kFooter>`,
  gotchas: [
    'The prompt is sent as typed: nothing is translated, so pass one per language.',
    'Links always open in a new tab and send no referrer; there is no prop to change that.',
    'The logos sit on white discs in their brand colours on both themes; only the pill follows the theme.',
  ],
  demos: [
    {
      label: 'Ask AI about a site',
      code: `<I9kAskAi heading="Ask AI about 9k School" prompt="What is 9k School (https://9k.school)?" />`,
    },
    {
      label: 'Arabic, right to left',
      code: `<div lang="ar" dir="rtl">
  <I9kAskAi heading="اسأل الذكاء الاصطناعي عن 9k School" prompt="إيه هي 9k School؟" />
</div>`,
    },
  ],
};
