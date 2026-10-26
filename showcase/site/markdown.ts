import type { ColorTokens } from '../extract/types';
import type { ShowcaseComponent } from '../registry/types';
import { RULES } from '../registry/rules';
import { SITE_URL } from './config';
import { COMPONENT_SECTIONS, componentPath, markdownPath } from './pages';

/** The parts of the catalog a Markdown twin is written from. */
export interface TwinSource {
  path: string;
  title: string;
  description: string;
  kind: 'home' | 'guide' | 'components' | 'component';
  component?: ShowcaseComponent;
}

/** Data a widget expands from, which lives outside the page's own source. */
export interface MarkdownContext {
  colorTokens: ColorTokens;
  components: ShowcaseComponent[];
}

/** A Markdown table cell: pipes would end the cell and newlines the row. */
const cell = (value: string): string => value.replace(/\|/g, '\\|').replace(/\n/g, ' ');

const table = (head: string[], rows: string[][]): string =>
  [
    `| ${head.join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ].join('\n');

/** A fenced block whose fence is longer than any backtick run inside it. */
export const fence = (language: string, code: string): string => {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((match) => match[0].length));
  const marker = '`'.repeat(longest + 1);
  return `${marker}${language}\n${code}\n${marker}`;
};

/** Wraps a prop type in a code span that survives a Markdown table. */
const code = (value: string): string => `\`${value}\``;

export const propsTable = (component: ShowcaseComponent): string =>
  table(
    ['Prop', 'Type', 'Default', 'Required'],
    component.props.map((prop) => [
      code(prop.name),
      code(prop.type),
      prop.default ? code(prop.default) : '—',
      prop.required ? 'yes' : 'no',
    ]),
  );

export const emitsTable = (component: ShowcaseComponent): string =>
  table(
    ['Event', 'Payload'],
    component.emits.map((emit) => [code(emit.name), code(emit.payload)]),
  );

export const componentList = (components: ShowcaseComponent[]): string =>
  COMPONENT_SECTIONS.map((section) =>
    [
      `### ${section.title}`,
      '',
      ...components
        .filter((component) => component.section === section.id)
        .map(
          (component) =>
            `- [${component.name}](${SITE_URL}${markdownPath(componentPath(component.name))}): ${component.summary}`,
        ),
    ].join('\n'),
  ).join('\n\n');

/**
 * The Vue components a prose page may place on a line of its own, and what each one becomes in
 * the page's Markdown twin. A component missing here fails the build, so no twin silently loses
 * content.
 */
const WIDGETS: Record<string, (context: MarkdownContext) => string> = {
  DocsColorTokens: ({ colorTokens }) =>
    [
      '### Brand colors',
      '',
      table(
        ['Token', 'HSL', 'Hex'],
        colorTokens.brand.map((token) => [code(token.name), token.hsl, token.hex]),
      ),
      '',
      '### Theme colors',
      '',
      table(
        ['Token', 'Light', 'Dark'],
        colorTokens.theme.map((token) => [
          code(token.name),
          token.light ? `${token.light.hsl} (${token.light.hex})` : '',
          token.dark ? `${token.dark.hsl} (${token.dark.hex})` : '',
        ]),
      ),
    ].join('\n'),
  DocsRules: () => RULES.map((rule, index) => `${index + 1}. ${rule}`).join('\n'),
  DocsComponentGrid: ({ components }) => componentList(components),
};

/**
 * The twin of a prose page: its source with the front matter replaced by a title and summary,
 * `vue demo` fences written as plain `vue` fences, and each widget expanded.
 */
export const guideMarkdown = (page: TwinSource, body: string, context: MarkdownContext): string => {
  const expanded = body
    // The lede repeats the description the twin already opens with, and the page actions are
    // buttons for people; neither belongs in the Markdown.
    .replace(/^<p class="docs-lede">.*<\/p>\n+/m, '')
    .replace(/^<DocsPageActions[^>]*\/>\n+/m, '')
    .replace(/^```(\w+) demo$/gm, '```$1')
    .replace(/^<(Docs\w+)\s*\/>$/gm, (tag, name: string) => {
      const widget = WIDGETS[name];
      if (!widget) throw new Error(`${page.path} uses <${name} />, which has no Markdown form`);
      return widget(context);
    })
    // The page's own h1 repeats the title the twin opens with.
    .replace(/^# .*\n+/m, '')
    // An agent follows links to other twins, so site links become absolute Markdown URLs.
    .replace(/\]\((\/[^)\s#]*)(#[^)\s]*)?\)/g, (link, path: string, hash = '') =>
      /\.\w+$/.test(path)
        ? `](${SITE_URL}${path}${hash})`
        : `](${SITE_URL}${markdownPath(path)}${hash})`,
    )
    .trim();
  return `# ${page.title}\n\n> ${page.description}\n\n${expanded}\n`;
};

/** A component page as an agent reads it: everything the HTML page says, in one document. */
export const componentMarkdown = (component: ShowcaseComponent): string => {
  const parts = [
    `# ${component.name}`,
    '',
    `> ${component.summary}`,
    '',
    fence('ts', `import { ${component.name} } from '@9klabs/design';`),
    '',
    '## Examples',
  ];

  for (const demo of component.demos) {
    parts.push('', `### ${demo.label}`, '', fence('vue', demo.code));
  }

  if (component.gotchas.length) {
    parts.push('', '## Watch out', '', ...component.gotchas.map((gotcha) => `- ${gotcha}`));
  }

  parts.push('', '## API');
  if (component.props.length) parts.push('', '### Props', '', propsTable(component));
  if (component.emits.length) parts.push('', '### Emits', '', emitsTable(component));
  if (component.slots.length) {
    parts.push('', '### Slots', '', ...component.slots.map((name) => `- ${code(name)}`));
  }

  const types = Object.values(component.referencedTypes);
  if (types.length) parts.push('', '### Types', '', fence('ts', types.join('\n\n')));

  if (!component.props.length && !component.emits.length && !component.slots.length) {
    parts.push('', 'This component takes no props, emits no events and renders no slots.');
  }

  parts.push('', '## Agent prompt', '', fence('text', component.agentPrompt), '');
  return parts.join('\n');
};

const absolute = (path: string): string => `${SITE_URL}${path}`;

/**
 * The llms.txt index (https://llmstxt.org): a title, a summary, then one list per sidebar group
 * linking each page's Markdown twin.
 */
export const llmsTxt = (sidebar: { title: string; pages: TwinSource[] }[]): string => {
  const lines = [
    '# @9klabs/design',
    '',
    '> Vue 3 components, design tokens and guidance for the 9k products. Every page of this site is also available as Markdown at its URL plus `.md`.',
    '',
    'Install with `npm install @9klabs/design` and import `@9klabs/design/style.css` once at the app entry.',
    `The whole site in one file is ${absolute('/llms-full.txt')}, and every component's API as JSON is ${absolute('/components.json')}.`,
    '',
    '## Rules',
    '',
    ...RULES.map((rule) => `- ${rule}`),
  ];

  for (const group of sidebar) {
    const pages = group.pages.filter((page) => page.kind !== 'home');
    if (!pages.length) continue;
    lines.push('', `## ${group.title}`, '');
    for (const page of pages) {
      lines.push(`- [${page.title}](${absolute(markdownPath(page.path))}): ${page.description}`);
    }
  }

  lines.push('');
  return lines.join('\n');
};

/** Every twin in reading order, each headed by its URL so an agent can split them again. */
export const llmsFullTxt = (twins: { path: string; markdown: string }[]): string =>
  twins
    .map(({ path, markdown }) => `<!-- ${absolute(path)} -->\n\n${markdown.trim()}`)
    .join('\n\n')
    .concat('\n');
