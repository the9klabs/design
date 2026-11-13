---
title: Pixel accents
description: A small, game-like mark of progress or achievement, drawn in square pixels, that sits on top of the calm design language and never replaces it.
---

# Pixel accents

<p class="docs-lede">The design language is calm: soft panels, rounded corners, a sans-serif face. A pixel accent is the one game-like touch on top of it, a mark that says "you moved forward". It is drawn in square pixel blocks with notched corners and a flat fill, and numbers beside it are set in a monospace face.</p>

<DocsPageActions />

## Where it belongs

Use a pixel accent only for:

- **progress and levels**: how far through a course, which level of four;
- **achievements**: what was earned, what is still locked;
- **numbers and identifiers**: scores, counts, amounts, dates, references, codes;
- **an identity mark** when a person has no photo.

Never use it for panels, cards, buttons, inputs, navigation, headings or body text. Those stay in
the calm language, so an accent keeps meaning something.

## The pieces

| Piece                 | What it is                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `--pixel-size`        | The one pixel unit (4px): the notch depth and the gap between blocks.      |
| `--pixel-track-color` | An empty block, per theme.                                                 |
| `--font-mono`         | The monospace stack for numbers and identifiers.                           |
| `.i9k-pixel-corners`  | Notched pixel corners on any element, from `--pixel-size`.                 |
| `.i9k-numeric`        | `--font-mono` with tabular figures, so digits line up in a column.         |

```vue demo
<I9kCluster>
  <span class="i9k-pixel-corners" style="display:inline-block;inline-size:4rem;block-size:1.25rem;background:var(--accent-color)"></span>
  <span class="i9k-numeric">5 / 10</span>
  <span class="i9k-numeric">26.11.13-01</span>
</I9kCluster>
```

## Arabic and right to left

The monospace stack has no Arabic letters, and a browser falls back to whatever Arabic face it
finds. Put `.i9k-numeric` on the number or identifier only, never on a sentence, and wrap a number
inside an Arabic sentence in `<bdi>` so it keeps its order. Pixel fills run from the inline start,
so a bar fills from the right in Arabic.

## Motion

A pixel accent may blink once a second, like a cursor, to mark where a person stands. It stops
under `prefers-reduced-motion: reduce`.
