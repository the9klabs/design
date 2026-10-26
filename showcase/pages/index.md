---
layout: home
title: 9k Design System
description: Vue 3 components, design tokens and guidance for the 9k products, with live demos, an API reference read from source, and every page in Markdown for agents.

hero:
  name: 9k Design System
  text: Vue 3 components for the 9k products
  tagline: Accessible, bilingual, themeable. Every component documented with live demos, an API read from its source, and a prompt your agent can paste.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started/installation
    - theme: alt
      text: Browse components
      link: /components
    - theme: alt
      text: For AI agents
      link: /getting-started/ai-agents

features:
  - title: Built for two languages
    details: Arabic typography switches on with lang="ar", and every component is laid out with logical properties, so it mirrors in right-to-left pages without extra props.
    link: /foundations/rtl-and-arabic
  - title: Light and dark from one class
    details: Put dark or light on the html element. Theme tokens follow, and so does every component.
    link: /foundations/theming
  - title: One stylesheet, scoped components
    details: Import @9klabs/design/style.css once for fonts, tokens and base styles. Each component carries its own scoped CSS.
    link: /getting-started/installation
  - title: Docs an agent can read
    details: Every page is also Markdown at its URL plus .md. llms.txt indexes them all, and each component ships a self-contained prompt.
    link: /getting-started/ai-agents
---
