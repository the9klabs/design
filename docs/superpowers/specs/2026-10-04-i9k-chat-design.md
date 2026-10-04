# I9kChat — shared chat surface

## Goal

the9klabs.com (project cost estimator) and ismail9k.com (work-with-me inquiry) each
hand-rolled the same scripted-chat UI. Move the presentation into the design system so
both sites render one chat look — the 9k Labs one — while each keeps its own
conversation logic.

## Decisions

- **Build now**, no intent issue.
- **One look:** the 9k Labs estimator wins. ismail9k.com drops its glass, header-less
  panel and adopts the header (Nino + bot name + action), scrolling log and footer tray.
- **Presentation only.** The package ships no flow engine, no i18n, no analytics. Every
  visible or announced string is a prop the site translates.

## Components

Four small components, composable rather than one configurable monolith, because the
two flows differ (branching multi-select vs. chips + free text + validation + handoff).

### I9kChat — the shell

A feature `I9kPanel` laid out as header / log / footer.

| Prop         | Type                | Default  | Purpose                                                       |
| ------------ | ------------------- | -------- | ------------------------------------------------------------- |
| `title`      | `string`            | —        | Bot name in the header.                                       |
| `logLabel`   | `string`            | required | `aria-label` of the `role="log"` region.                      |
| `expression` | `I9kNinoExpression` | `'idle'` | Nino's face in the header.                                    |
| `expanded`   | `boolean`           | `false`  | Drop the log's max-height so a final result is never clipped. |

Slots: `avatar` (replaces Nino), `actions` (header end, e.g. "Start over"), `default`
(bubbles), `footer` (the answer tray; omitted entirely when the slot is empty).
Exposes `scrollToEnd()`. The log is `aria-live="polite"`.

### I9kChatBubble — one message

| Prop           | Type              | Default    | Purpose                                          |
| -------------- | ----------------- | ---------- | ------------------------------------------------ |
| `from`         | `'bot' \| 'user'` | `'bot'`    | Side, colour and tail corner.                    |
| `typing`       | `boolean`         | `false`    | Three-dot indicator instead of content.          |
| `typingLabel`  | `string`          | `'Typing'` | Accessible name of the indicator.                |
| `speakerLabel` | `string`          | —          | Screen-reader prefix, e.g. "You".                |
| `wide`         | `boolean`         | `false`    | Full width (rich results).                       |
| `editable`     | `boolean`         | `false`    | Render the bubble as a button that emits `edit`. |
| `editLabel`    | `string`          | —          | Accessible name for the editable bubble.         |

Slots: `default`, `after` (under the bubble, on its side — e.g. "↩ Change").
Logical corners and alignment, so the tail mirrors in Arabic. User bubbles keep line
breaks (`white-space: pre-wrap`); bot bubbles animate in unless reduced motion is set.

### I9kChatOptions — the answer row

`role="group"` with a required `label`; wraps its buttons and aligns them to the user's
side. Exposes `focus()` (first focusable child) so a site can move focus to the next
question.

### I9kChatComposer — free-text answer

`v-model` text field with a round send button. Props: `label` (required, aria-label),
`placeholder`, `sendLabel` (`'Send'`), `multiline`, `maxlength`, `invalid`, `disabled`.
Enter sends; Shift+Enter inserts a newline when `multiline`. The textarea grows to 10rem.
Emits `submit(value)` only for non-blank input. Exposes `focus()`.

## Site adoption

- **the9klabs.com:** `EstimatorChat` composes the four; `ChatBubble` and `ChatOptions`'
  layout wrapper are deleted, the flow/engine/result stay.
- **ismail9k.com:** `InquiryChat` composes the four; `InquiryChatMessage` is deleted and
  `InquiryChatInput` keeps only step logic (chips vs. composer, error). The review/handoff
  moves into the footer tray. New i18n key `inquiry.chat.botName`.

## Testing

Vitest + Vue Test Utils per component (rendering, slots, events, a11y attributes);
showcase registry entry and Storybook story per component; scoped-style and export
contracts updated. Each site is checked in the browser in light/dark and LTR/RTL.

## Release

Both sites consume `github:the9klabs/design`. Until this branch merges, sites are
verified against a local build; after merge each site bumps its dependency.
