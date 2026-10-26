import { SECTIONS } from '../registry/sections';

/** Registry sections that hold components rather than page furniture. */
export const COMPONENT_SECTIONS = SECTIONS.filter(
  (section) => !['install', 'tokens', 'rules'].includes(section.id),
);

/**
 * The prose pages, in sidebar order. Each path is a Markdown file under `showcase/pages/`, whose
 * front matter supplies its title and description; `tests/showcaseSite.test.ts` fails when a file
 * exists that this list leaves out, or the other way round.
 */
export const GUIDE_GROUPS = [
  {
    id: 'getting-started',
    title: 'Getting started',
    paths: [
      '/getting-started/installation',
      '/getting-started/frameworks',
      '/getting-started/ai-agents',
    ],
  },
  {
    id: 'foundations',
    title: 'Foundations',
    paths: [
      '/foundations/tokens',
      '/foundations/sizes',
      '/foundations/theming',
      '/foundations/rtl-and-arabic',
      '/foundations/layout',
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    paths: [
      '/guides/notifications-and-dialogs',
      '/guides/building-a-component',
      '/guides/rules-for-agents',
    ],
  },
] as const;

/** `I9kNinoMaze` → `nino-maze`: the component's URL segment. */
export const slugFor = (name: string): string =>
  name
    .replace(/^I9k/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

export const componentPath = (name: string): string => `/components/${slugFor(name)}`;

/** The Markdown twin of a page: `/` is `/index.md`, anything else gains `.md`. */
export const markdownPath = (path: string): string => (path === '/' ? '/index.md' : `${path}.md`);

/** The page a Markdown twin belongs to: the inverse of {@link markdownPath}. */
export const pathOfMarkdown = (twin: string): string =>
  twin === '/index.md' ? '/' : twin.replace(/\.md$/, '');
