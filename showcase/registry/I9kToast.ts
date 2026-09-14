import type { ShowcaseEntry } from './types';

export const I9kToastEntry: ShowcaseEntry = {
  name: 'I9kToast',
  section: 'feedback',
  summary:
    "Styled, accessible message banner for status or error text. It is only the visual/ARIA shell — placement, timing, and dismissal are the caller's responsibility.",
  agentPrompt: `Use I9kToast from @9klabs/design to display a short status or error message with a live-region role wired in automatically.

import { I9kToast } from '@9klabs/design';

Props:
- variant?: 'info' | 'success' | 'warning' | 'error' (default 'info') — also sets the ARIA role: 'error' renders \`role="alert"\`; 'info', 'success' and 'warning' render \`role="status"\`.
- size?: 'sm' | 'md' | 'lg' (default 'md')

Emits: none.

Slots: default — the message content.

IMPORTANT: I9kToast has no dismiss button, no auto-hide timer, and no fixed/floating positioning built in. It is purely the visual banner and ARIA role — you own showing it, hiding it, stacking multiple toasts, and where on the page it sits (e.g. wrap it in your own fixed-position container to make it float).

Usage:
<I9kToast variant="success">Changes saved.</I9kToast>`,
  gotchas: [
    'I9kToast renders no dismiss control and sets no timer — show, hide, and stack it yourself; it is a static banner until you remove it from the DOM.',
    '`variant="error"` renders `role="alert"` (assertive); `info`, `success` and `warning` render `role="status"` (polite). A warning is usually a standing state of the page (for example "this course has no published lessons"), which should not interrupt a screen reader each time the page renders — use `error` only for a failure the user must react to now.',
    'It has no positioning of its own — wrap it in a container with your own `position: fixed` styling if you want it to float above the page.',
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
