# Documentation site design

Intent-Issue: #35 — https://github.com/the9klabs/design/issues/35

## Intent

The showcase at https://design.the9klabs.com is one page about 136,000px tall that holds all 60
components, with no search and no page of its own for any component. It was built for agents, so a
person looking for one component or one rule has to scroll. The maintainer asked for documentation
"on the level of mui.com": a site a person can browse and search, with a page per component, live
demos, an API reference, and guidance on the system as a whole. Agents (Claude in particular)
remain primary consumers, so every page must also be readable as Markdown.

## Goals

- One page per component at `/components/<slug>`, with live demos, their code, gotchas, the API
  extracted from source, and the agent prompt.
- Foundations and guide pages for what a props table cannot say: installation, framework setup,
  tokens, sizes and tones, theming, RTL and Arabic, page layout, notifications and dialogs, and how
  to build a new component in this system.
- A persistent sidebar, a search dialog (`⌘K` / `Ctrl+K` / `/`), breadcrumbs, an on-page table of
  contents, and previous/next links.
- A Markdown twin of every page at `<path>.md`, an `llms.txt` index of those twins in the
  llmstxt.org shape, and an `llms-full.txt` with everything in one file. `components.json` stays.
- Two kinds of prompt, as #35 requires: one per component for using it, and one for building a new
  component inside this design system.

## Non-goals

- The MCP server for querying the design language (#35 leaves it out; the Markdown twins are its
  future content).
- Editable playgrounds or CodeSandbox export.
- Translating the docs into Arabic.
- Versioned docs.

## Anti-goals

- Losing the showcase's guarantees: props, emits and slots read from source; demo code that is the
  same string that renders; a test failure when an exported component has no registry entry.
- A docs site that does not look like the design system it documents.

## Decisions

The maintainer opted out of questions, and then made one call mid-build: **use VitePress, styled to
look like the 9k design language.** Everything else here is the builder's call.

- **VitePress 1, with `showcase/` as its root and `showcase/pages/` as `srcDir`.** The default
  theme supplies the sidebar, local search (`⌘K` / `Ctrl+K`), the on-page outline, previous/next
  links, the theme switch and the mobile menu. It builds to `showcase-dist/` with clean URLs, which
  Cloudflare Pages serves as before.
- **The theme is dressed, not replaced.** `showcase/.vitepress/theme/style.css` maps every
  `--vp-*` variable onto a token from `src/styles/`, so the docs change when the system does. Both
  use `html.dark`, so dark mode needs no second mapping. The library's own stylesheet is imported,
  and the custom pieces (demo frame, page actions, the Nino hero, the RTL toggle) are built from
  `@9klabs/design` components.
- **Component pages are generated.** `showcase/pages/components/[slug].paths.ts` turns each merged
  registry entry into a page's Markdown, so `showcase/registry/<Name>.ts` stays the one place a
  component's docs are written, and the registry test still fails for an export without an entry.
  The registry is loaded in Node through a short-lived Vite server, because one entry imports
  `.vue` files.
- **Live demos compile at runtime.** VitePress ships Vue's runtime-only build, so `compileDemo`
  calls `@vue/compiler-dom` itself; the code shown is still the string that renders. A
  ` ```vue demo ` fence in a guide page renders the same way. Demos sit in `.vp-raw`, which
  `postcssIsolateStyles` keeps VitePress's prose styles out of, and a toggle in the nav flips every
  demo to `dir="rtl"`.
- **Guide pages are Markdown files** listed, in sidebar order, in `showcase/site/pages.ts`; a test
  fails when a file and the list disagree. Front matter gives each its title and description.
- **Markdown for agents** is written at build time (and served by middleware in dev): a twin at
  `<path>.md` for every page, `llms.txt` as an llmstxt.org index of the twins opening with the
  rules, `llms-full.txt` with every twin, `components.json`, and a sitemap whose `lastmod` is the
  last commit's date. Widgets such as `<DocsRules />` expand into Markdown in the twin; an unknown
  one fails the build. Each page's head carries a canonical URL and a
  `<link rel="alternate" type="text/markdown">` to its twin.
- **Old anchors** (`/#I9kButton`) are not redirected. The single-page showcase was never linked
  from the consuming projects.

## Left to the builder

Page copy, the exact sidebar order, and the visual details of the theme.
