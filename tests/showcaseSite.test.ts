import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { entries } from '../showcase/registry';
import { RULES } from '../showcase/registry/rules';
import type { ShowcaseComponent } from '../showcase/registry/types';
import { catalogFrom, loadColorTokens, PAGES_DIR } from '../showcase/site/catalog';
import { componentPageContent } from '../showcase/site/componentPage';
import { SITE_URL } from '../showcase/site/config';
import { componentMarkdown, fence, guideMarkdown, llmsTxt } from '../showcase/site/markdown';
import { GUIDE_GROUPS, markdownPath, pathOfMarkdown, slugFor } from '../showcase/site/pages';
import { allTwins } from '../showcase/site/twins';

const catalog = catalogFrom(entries);
const colorTokens = loadColorTokens();
const context = { colorTokens, components: catalog.components };

/** Every Markdown page under showcase/pages, as a URL path. */
const markdownFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'public' ? [] : markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });

const component = (overrides: Partial<ShowcaseComponent> = {}): ShowcaseComponent => ({
  name: 'I9kThing',
  section: 'content',
  summary: 'Wraps a `<dialog>` in a <section>.',
  agentPrompt: 'Use I9kThing.',
  gotchas: ['Never nest one inside a <form>.'],
  demos: [{ label: 'Default', code: '<I9kThing label="a | b" />' }],
  props: [{ name: 'label', type: "'a' | 'b'", required: true, default: null }],
  emits: [{ name: 'close', payload: '[]' }],
  slots: ['default'],
  referencedTypes: {},
  ...overrides,
});

describe('docs site pages', () => {
  it('lists every prose page in GUIDE_GROUPS, and nothing else', () => {
    const onDisk = markdownFiles(PAGES_DIR)
      .map((file) => `/${relative(PAGES_DIR, file).replace(/\.md$/, '')}`)
      .filter((path) => !['/index', '/components', '/components/[slug]'].includes(path))
      .sort();
    const listed = GUIDE_GROUPS.flatMap((group) => [...group.paths]).sort();
    expect(onDisk).toEqual(listed);
  });

  it('gives every registry entry a page, under a unique path', () => {
    const paths = catalog.pages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const entry of entries) {
      expect(paths).toContain(`/components/${slugFor(entry.name)}`);
    }
  });

  it('opens with the home page and the getting-started guides', () => {
    expect(catalog.pages[0].path).toBe('/');
    expect(catalog.sidebar[0].title).toBe('Getting started');
  });

  it('slugs component names for URLs', () => {
    expect(slugFor('I9kButton')).toBe('button');
    expect(slugFor('I9kNinoMaze')).toBe('nino-maze');
    expect(slugFor('I9kFAQ')).toBe('faq');
  });

  it('maps a page to its Markdown twin and back', () => {
    for (const path of ['/', '/components', '/foundations/theming']) {
      expect(pathOfMarkdown(markdownPath(path))).toBe(path);
    }
    expect(markdownPath('/')).toBe('/index.md');
  });
});

describe('Markdown twins', () => {
  it('writes one twin per page', () => {
    const twins = allTwins(catalog, colorTokens);
    expect(twins.map((twin) => twin.path)).toEqual(catalog.pages.map((page) => page.path));
    for (const twin of twins) expect(twin.markdown.trim()).not.toBe('');
  });

  it('renders a component twin with its API tables and prompt', () => {
    const markdown = componentMarkdown(component());
    expect(markdown).toMatch(/^# I9kThing\n\n> /);
    expect(markdown).toContain("| `label` | `'a' \\| 'b'` | — | yes |");
    expect(markdown).toContain('| `close` | `[]` |');
    expect(markdown).toContain('### Slots\n\n- `default`');
    expect(markdown).toContain('## Agent prompt\n\n```text\nUse I9kThing.\n```');
  });

  it('fences code with more backticks than it contains', () => {
    expect(fence('md', 'a ``` b')).toBe('````md\na ``` b\n````');
  });

  const page = {
    path: '/guides/example',
    title: 'Example',
    description: 'An example page.',
    kind: 'guide' as const,
  };

  it('expands widgets and strips page furniture from a guide twin', () => {
    const body = [
      '# Example',
      '',
      '<p class="docs-lede">Lede.</p>',
      '',
      '<DocsPageActions />',
      '',
      '<DocsRules />',
      '',
      '```vue demo',
      '<I9kButton />',
      '```',
    ].join('\n');
    const markdown = guideMarkdown(page, body, context);
    expect(markdown).toMatch(/^# Example\n\n> An example page\.\n\n1\. /);
    expect(markdown.match(/^# /gm)).toHaveLength(1);
    expect(markdown).not.toContain('docs-lede');
    expect(markdown).not.toContain('DocsPageActions');
    expect(markdown).toContain(`${RULES.length}. ${RULES.at(-1)}`);
    expect(markdown).toContain('```vue\n<I9kButton />');
  });

  it('points site links at absolute twins, and files at themselves', () => {
    const markdown = guideMarkdown(
      page,
      'See [tokens](/foundations/tokens#color), [llms](/llms.txt) and [W3C](https://w3.org/).',
      context,
    );
    expect(markdown).toContain(`[tokens](${SITE_URL}/foundations/tokens.md#color)`);
    expect(markdown).toContain(`[llms](${SITE_URL}/llms.txt)`);
    expect(markdown).toContain('[W3C](https://w3.org/)');
  });

  it('fails on a widget it cannot write as Markdown', () => {
    expect(() => guideMarkdown(page, '<DocsUnknown />', context)).toThrow(/DocsUnknown/);
  });
});

describe('llms.txt', () => {
  const index = llmsTxt(catalog.sidebar);

  it('opens with the rules', () => {
    for (const rule of RULES) expect(index).toContain(`- ${rule}`);
  });

  it('links every page but the home page to its twin', () => {
    for (const page of catalog.pages.filter((page) => page.kind !== 'home')) {
      expect(index).toContain(`(${SITE_URL}${markdownPath(page.path)})`);
    }
  });
});

describe('component page source', () => {
  const source = componentPageContent(component());

  it('escapes element names in prose, leaving code spans alone', () => {
    expect(source).toContain('Wraps a `<dialog>` in a &lt;section&gt;.');
    expect(source).toContain('- Never nest one inside a &lt;form&gt;.');
  });

  it('keeps registry prose out of Vue interpolation', () => {
    expect(source).toMatch(/::: v-pre\n<p class="docs-lede">/);
    expect(source).toMatch(/::: v-pre\n\| Prop \|/);
  });

  it('places a live demo above each code block', () => {
    expect(source).toContain(
      '<DocsDemo name="I9kThing" :index="0" />\n\n```vue\n<I9kThing label="a | b" />\n```',
    );
  });

  it('matches what the build writes for real components', () => {
    for (const real of catalog.components) {
      expect(componentPageContent(real)).toContain(`<DocsPageActions name="${real.name}" />`);
    }
  });
});

describe('pages on disk', () => {
  it('gives every prose page a lede and page actions', () => {
    for (const path of GUIDE_GROUPS.flatMap((group) => [...group.paths])) {
      const source = readFileSync(join(PAGES_DIR, `${path.slice(1)}.md`), 'utf8');
      expect(source, path).toMatch(/^<p class="docs-lede">/m);
      expect(source, path).toMatch(/^<DocsPageActions \/>$/m);
    }
  });
});
