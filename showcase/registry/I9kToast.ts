import type { ShowcaseEntry } from './types';

export const I9kToastEntry: ShowcaseEntry = {
  name: 'I9kToast',
  section: 'feedback',
  summary:
    'Styled, accessible message banner for standing status or error text in the page flow. For notifications (saved, failed, sent), use I9kToaster, which renders I9kToast for each one.',
  agentPrompt: `Use I9kToast from @9klabs/design to display a short status or error message with a live-region role wired in automatically.

import { I9kToast } from '@9klabs/design';

Props:
- variant?: 'info' | 'success' | 'warning' | 'error' (default 'info') — also sets the ARIA role: 'error' renders \`role="alert"\`; 'info', 'success' and 'warning' render \`role="status"\`.
- size?: 'sm' | 'md' | 'lg' (default 'md')
- live?: boolean (default true) — false renders no role at all, for a toast whose text is announced elsewhere (I9kToaster sets it, because its own live regions announce each notification).

Emits: none.

Slots: default — the message content.

IMPORTANT: for notifications, use I9kToaster (app.use(createI9kToaster()), one <I9kToaster /> at the app root, useI9kToaster().show(...)) — it floats, stacks, times out and announces them. I9kToast alone has no dismiss button, no auto-hide timer and no positioning: it stays for standing status in the page flow, such as "this course has no published lessons".

Usage:
<I9kToast variant="success">Changes saved.</I9kToast>`,
  gotchas: [
    'For notifications, use I9kToaster; I9kToast alone stays for standing status in the page flow. It renders no dismiss control and sets no timer — it is a static banner until you remove it from the DOM.',
    '`variant="error"` renders `role="alert"` (assertive); `info`, `success` and `warning` render `role="status"` (polite). A warning is usually a standing state of the page (for example "this course has no published lessons"), which should not interrupt a screen reader each time the page renders — use `error` only for a failure the user must react to now.',
    'It has no positioning of its own. Do not wrap it in your own `position: fixed` container to make it float — that is I9kToaster, which also keeps it readable while an I9kModal is open.',
    '`:live="false"` (a binding, not the string "false") drops the role entirely. Use it only when the text is announced elsewhere, as I9kToaster does; a lone toast without a role is never announced.',
  ],
  demos: [
    {
      label: 'Variants',
      code: `<I9kToast variant="info">Your changes are syncing.</I9kToast>
<I9kToast variant="success">Changes saved.</I9kToast>
<I9kToast variant="warning">You have unsaved changes.</I9kToast>
<I9kToast variant="error">Could not save changes.</I9kToast>`,
    },
    {
      label: 'Warning',
      code: `<I9kToast variant="warning">You have unsaved changes.</I9kToast>`,
    },
    {
      label: 'Sizes',
      code: `<I9kToast size="sm">Small notification</I9kToast>
<I9kToast size="md">Medium notification</I9kToast>
<I9kToast size="lg">Large notification</I9kToast>`,
    },
  ],
};
