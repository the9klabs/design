---
title: Working with AI agents
description: Point Claude or any coding agent at these docs. Every page is Markdown at its URL plus .md, llms.txt indexes them, and each component has a self-contained prompt.
navTitle: AI agents
---

# Working with AI agents

<p class="docs-lede">These docs are written for people and read just as well by agents. Every page has a Markdown twin, the site has an index for agents, and every component carries a prompt an agent can follow without any other context.</p>

<DocsPageActions />

## Every page is Markdown

Add `.md` to any page's URL to get the same content as Markdown, with nothing to scrape:

| Page                                           | Markdown                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [`/components/button`](/components/button)     | <a href="/components/button.md" target="_blank"><code>/components/button.md</code></a>     |
| [`/foundations/theming`](/foundations/theming) | <a href="/foundations/theming.md" target="_blank"><code>/foundations/theming.md</code></a> |

A component's Markdown holds everything its page shows: the import line, the code of every
example, the gotchas, the full props, emits and slots tables, the types they reference, and the
agent prompt. Each HTML page also points to its twin with
`<link rel="alternate" type="text/markdown">`.

The **Copy page as Markdown** button at the top of each page puts that text on your clipboard, ready
to paste into a chat.

## The index and the full text

| URL                                                                          | What it holds                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a href="/llms.txt" target="_blank"><code>/llms.txt</code></a>               | The index, in the [llms.txt](https://llmstxt.org) format: the rules every component follows, then a link and a one-line summary for every page's Markdown. Start here. |
| <a href="/llms-full.txt" target="_blank"><code>/llms-full.txt</code></a>     | Every page's Markdown in one file, for agents that would rather read everything at once.                                                                               |
| <a href="/components.json" target="_blank"><code>/components.json</code></a> | Every component's API as JSON: props with resolved types and defaults, emits with payloads, slots, gotchas and prompts.                                                |

## Prompts

Two kinds of prompt come with the docs:

- **Using a component.** The end of every component page has an agent prompt. It names the
  import, every prop with its type and default, the events, the slots, the behavior that
  surprises people, and a usage example. Paste it when you ask an agent to build with that
  component.
- **Building a new component.** [Building a component](/guides/building-a-component) ends with a
  prompt that teaches an agent this repository's conventions: scoped styles, the size scale,
  logical properties, the registry entry and the tests.

## Set up Claude Code in a consuming app

To have Claude Code use the design system in an app, add a short note to the app's `CLAUDE.md`
(or `AGENTS.md`), so every session knows where to look:

```md
## UI components

Build UI with @9klabs/design. Before using a component, read its Markdown page,
for example https://design.the9klabs.com/components/button.md. The index of every page
is https://design.the9klabs.com/llms.txt. Follow the rules listed there.
```

With that note, a request like "add a sign-in form" goes from the index to the
[`I9kField`](/components/field), [`I9kInput`](/components/input) and
[`I9kButton`](/components/button) pages, and from there to code that uses their real props.

## Rules every component follows

The constraints a props table cannot express are on one page:
[Rules for agents](/guides/rules-for-agents). They are also at the top of `llms.txt`.
