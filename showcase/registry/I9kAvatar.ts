import type { ShowcaseEntry } from './types';

const circle =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e85a02'/%3E%3Ccircle cx='20' cy='20' r='10' fill='%234ade80'/%3E%3C/svg%3E";

export const I9kAvatarEntry: ShowcaseEntry = {
  name: 'I9kAvatar',
  section: 'content',
  summary:
    'A round picture of a person or account from any image URL, with a fallback slot (such as initials) for when there is no picture.',
  agentPrompt: `Use I9kAvatar from @9klabs/design for a round picture of a person or account.

import { I9kAvatar } from '@9klabs/design';

Props:
- src?: string | null (default null) — any image URL, including a data: URI. When it is null or empty, the default slot renders instead of the picture.
- alt?: string (default '') — the picture's alternative text.
- size?: 'sm' | 'md' | 'lg' (default 'md') — the diameter follows the shared control scale, --control-height-sm|md|lg, so an avatar sits level with buttons of the same size.

Emits: none.

Slots:
- default — fallback content (for example initials) rendered when there is no \`src\`.

Accessibility: the picture is decorative by default (alt=''), because an avatar usually sits beside the person's name or inside a button that already has a label. Pass \`alt\` when the avatar stands alone and nothing else names the person.

The root is a <span class="i9k-avatar i9k-avatar--<size>">; attributes such as aria-hidden fall through to it.

Usage:
<I9kAvatar :src="user.image" size="sm" />
<I9kAvatar alt="Ismail">IK</I9kAvatar>`,
  gotchas: [
    "A `data:` URI `src` (such as a generated avatar) only loads when the consuming site's Content-Security-Policy allows `img-src data:`.",
    'The fallback slot is ordinary text, so screen readers read it out unless the caller sets `aria-hidden="true"` on the avatar — do that when the name is already given beside it.',
  ],
  demos: [
    {
      label: 'Picture at each size',
      code: `<I9kCluster>
  <I9kAvatar size="sm" :src="src" />
  <I9kAvatar size="md" :src="src" />
  <I9kAvatar size="lg" :src="src" />
</I9kCluster>`,
      state: { src: circle },
    },
    {
      label: 'Fallback initials',
      code: `<I9kAvatar>IK</I9kAvatar>`,
    },
  ],
};
