import type { ShowcaseComponent } from '../registry/types';
import { emitsTable, fence, propsTable } from './markdown';

/**
 * Registry prose is written for agents and names elements as `<dialog>` or `<a>` outside code
 * spans. A VitePress page is a Vue template, so those would be parsed as markup; escape them,
 * leaving code spans to Markdown, which escapes them itself.
 */
const prose = (text: string): string =>
  text
    .split(/(`[^`]*`)/)
    .map((part) => (part.startsWith('`') ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('');

/** Prose a Vue template must not interpolate, such as a gotcha that mentions `{{ label }}`. */
const verbatim = (markdown: string): string => `::: v-pre\n${markdown}\n:::`;

/**
 * The VitePress page for one component, generated from its registry entry and the API read from
 * its source. It renders the same content as the Markdown twin, with live demos above each code
 * block.
 */
export const componentPageContent = (component: ShowcaseComponent): string => {
  const parts = [
    `# ${component.name}`,
    '',
    verbatim(`<p class="docs-lede">${prose(component.summary)}</p>`),
    '',
    `<DocsPageActions name="${component.name}" />`,
    '',
    fence('ts', `import { ${component.name} } from '@9klabs/design';`),
    '',
    '## Examples',
  ];

  component.demos.forEach((demo, index) => {
    parts.push(
      '',
      `### ${prose(demo.label)}`,
      '',
      `<DocsDemo name="${component.name}" :index="${index}" />`,
      '',
      fence('vue', demo.code),
    );
  });

  if (component.gotchas.length) {
    parts.push(
      '',
      '## Watch out',
      '',
      verbatim(component.gotchas.map((gotcha) => `- ${prose(gotcha)}`).join('\n')),
    );
  }

  parts.push('', '## API');
  if (component.props.length) {
    parts.push('', '### Props', '', verbatim(propsTable(component)));
  }
  if (component.emits.length) {
    parts.push('', '### Emits', '', verbatim(emitsTable(component)));
  }
  if (component.slots.length) {
    parts.push(
      '',
      '### Slots',
      '',
      verbatim(component.slots.map((name) => `- \`${name}\``).join('\n')),
    );
  }
  const types = Object.values(component.referencedTypes);
  if (types.length) parts.push('', '### Types', '', fence('ts', types.join('\n\n')));
  if (!component.props.length && !component.emits.length && !component.slots.length) {
    parts.push('', 'This component takes no props, emits no events and renders no slots.');
  }

  parts.push(
    '',
    '## Agent prompt',
    '',
    'Paste this into an agent to have it use the component correctly. It is self-contained.',
    '',
    fence('text', component.agentPrompt),
    '',
  );
  return parts.join('\n');
};
