import type { ShowcaseEntry } from './types';

export const I9kModalEntry: ShowcaseEntry = {
  name: 'I9kModal',
  section: 'feedback',
  summary:
    'Accessible modal dialog built on the native <dialog> element, labelled by its title, with a close button, a scrolling body, and an optional footer. The parent owns whether it is open.',
  agentPrompt: `Use I9kModal from @9klabs/design for a focused task that must interrupt the page, such as an edit form.

import { I9kModal } from '@9klabs/design';

Props:
- open?: boolean (default false) — bind with v-model:open. The modal opens with showModal() when it becomes true and closes when it becomes false.
- title: string (required) — rendered as the <h2> that labels the dialog (aria-labelledby).
- description?: string — rendered under the title and wired to aria-describedby.
- size?: 'sm' | 'md' | 'lg' (default 'md') — the maximum width of the dialog.
- closeLabel?: string (default 'Close') — the accessible name of the icon-only close button; translate it.
- dismissible?: boolean (default true) — when false, Escape is ignored and the close button is disabled.

Emits:
- update:open(false) — the user asked to close (close button or Escape).
- close() — emitted together with update:open(false).

Slots:
- default — the dialog body; it scrolls when taller than the viewport.
- footer — actions such as Cancel and Save, aligned to the end.

Behavior: the parent owns \`open\`. The close button and Escape only request a close by emitting update:open(false); the modal closes when the parent sets \`open\` to false, and focus returns to the element that was focused when it opened.

IMPORTANT: clicking the backdrop never closes the modal, so an unsaved form is not lost to a stray click.

IMPORTANT: set \`dismissible\` to false while a save is in flight so the user cannot close the modal halfway through.

IMPORTANT: the body and footer render only while the modal is open, so a form inside remounts on every opening and starts from fresh state. Put \`autofocus\` on the first field so focus lands there.

Usage:
<I9kButton @click="open = true">Edit module</I9kButton>
<I9kModal v-model:open="open" title="Edit module" description="Both languages are required." close-label="Close">
  <I9kInput v-model="title" label="Title" autofocus />
  <template #footer>
    <I9kButton @click="open = false">Cancel</I9kButton>
    <I9kButton variant="primary" type="submit">Save</I9kButton>
  </template>
</I9kModal>`,
  gotchas: [
    'The parent owns `open`: the close button and Escape only emit `update:open(false)`, so bind `v-model:open` or the modal never closes.',
    'Backdrop clicks never close the modal.',
    'Set `dismissible` to false while saving; Escape is then ignored and the close button is disabled.',
    'The body and footer render only while open, so a form inside remounts on every opening; put `autofocus` on its first field.',
  ],
  demos: [
    {
      label: 'Edit form',
      code: `<I9kButton @click="open = true">Edit module</I9kButton>
<I9kModal v-model:open="open" title="Edit module" description="Both languages are required.">
  <p>Module fields go here.</p>
  <template #footer>
    <I9kButton @click="open = false">Cancel</I9kButton>
    <I9kButton variant="primary" @click="open = false">Save</I9kButton>
  </template>
</I9kModal>`,
      state: { open: false },
    },
  ],
};
