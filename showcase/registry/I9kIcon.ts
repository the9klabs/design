import type { ShowcaseEntry } from './types';

export const I9kIconEntry: ShowcaseEntry = {
  name: 'I9kIcon',
  section: 'content',
  summary:
    "SVG icon rendered from the library's built-in icon set by name. Use it anywhere a small inline glyph is needed — social links, nav items, buttons.",
  agentPrompt: `Use I9kIcon from @9klabs/design to render a built-in SVG icon by name.

import { I9kIcon } from '@9klabs/design';

Props:
- name: I9kIconName (required) — one of the names in src/icons/paths.json: 'facebook', 'twitter', 'medium', 'linkedin', 'behance', 'github', 'menu', 'mail', 'dev', 'phone', 'landMark', 'home', 'instagram', 'youtube', 'tiktok', 'x', '9klabs', 'linktree', 'sun', 'moon', 'translate', 'add', 'edit', 'delete', 'close', 'arrowUp', 'arrowDown', 'archive', 'unarchive', 'eye', 'eyeOff', 'warning'.
- title?: string (default '') — an accessible name for the icon; setting this (or \`desc\`) makes the icon exposed to assistive tech as role="img" instead of hidden.
- desc?: string (default '') — a longer accessible description; same effect as \`title\` on hiddenness.
- size?: string | number (default '1.2em') — sets both width and height, e.g. '24px', '2em', 32.

Emits: none.

Slots: none.

Behavior: icon names come from src/icons/paths.json, a fixed lookup table of path data — I9kIcon cannot render an arbitrary SVG path or a name outside that set. The component is aria-hidden="true" by default (a decorative icon); it only gets role="img" and becomes visible to assistive tech when you pass a \`title\` or \`desc\`.

IMPORTANT: to add a new icon, add its entry to src/icons/paths.json (as a path string, or { viewBox, path } for a non-24x24 icon) — never inline a raw <svg> in a component in place of I9kIcon.

IMPORTANT: I9kIcon is aria-hidden unless you pass \`title\` or \`desc\` — always set one of those when the icon is the only content of a link or button (e.g. an icon-only social link), or it will be invisible to screen readers.

Usage:
<I9kIcon name="github" title="GitHub" size="1.5em" />`,
  gotchas: [
    'Icon names are limited to the fixed set in src/icons/paths.json — add a new icon there, do not inline raw SVG in a component.',
    'I9kIcon is aria-hidden by default; pass `title` or `desc` whenever the icon is the only content of an interactive element.',
  ],
  demos: [
    {
      label: 'Icon set',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--component-gap-md)">
  <I9kIcon name="github" title="GitHub" size="1.5em" />
  <I9kIcon name="linkedin" title="LinkedIn" size="1.5em" />
  <I9kIcon name="x" title="X" size="1.5em" />
  <I9kIcon name="mail" title="Email" size="1.5em" />
  <I9kIcon name="dev" title="DEV Community" size="1.5em" />
</div>`,
    },
    {
      label: 'Editor actions',
      code: `<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--component-gap-md)">
  <I9kIcon name="add" title="Add" size="1.5em" />
  <I9kIcon name="edit" title="Edit" size="1.5em" />
  <I9kIcon name="delete" title="Delete" size="1.5em" />
  <I9kIcon name="close" title="Close" size="1.5em" />
  <I9kIcon name="arrowUp" title="Move up" size="1.5em" />
  <I9kIcon name="arrowDown" title="Move down" size="1.5em" />
  <I9kIcon name="archive" title="Archive" size="1.5em" />
  <I9kIcon name="unarchive" title="Unarchive" size="1.5em" />
  <I9kIcon name="eye" title="Show" size="1.5em" />
  <I9kIcon name="eyeOff" title="Hide" size="1.5em" />
  <I9kIcon name="warning" title="Warning" size="1.5em" />
</div>`,
    },
    {
      label: 'Sizes',
      code: `<div style="display: flex; align-items: center; gap: var(--component-gap-md)">
  <I9kIcon name="github" title="GitHub" size="1em" />
  <I9kIcon name="github" title="GitHub" size="1.5em" />
  <I9kIcon name="github" title="GitHub" size="2.5em" />
</div>`,
    },
  ],
};
