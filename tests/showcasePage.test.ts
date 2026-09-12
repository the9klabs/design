import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { renderToString, type SSRContext } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import I9kNavMenu from '../src/components/I9kNavMenu.vue';
import { buildPage } from '../showcase/page';

const shell = readFileSync(resolve('showcase/index.html'), 'utf8');
const links = [{ id: 'blog', label: 'Blog', href: '/blog' }];

// The two ways the showcase renders I9kNavMenu: the specimen disables its teleport, the live
// menu teleports its closed panel to <body>.
const App = {
  render: () => h('main', [h(I9kNavMenu, { links, preview: true }), h(I9kNavMenu, { links })]),
};

// jsdom has never implemented window.matchMedia, and the live menu reads it on mount.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches: false,
    media,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

const unmounts: (() => void)[] = [];
afterEach(() => {
  unmounts.splice(0).forEach((unmount) => unmount());
  vi.restoreAllMocks();
});

const prerender = async () => {
  const context: SSRContext = {};
  const html = await renderToString(createSSRApp(App), context);
  return buildPage(shell, { html, teleports: context.teleports ?? {} });
};

/** Swaps the prerendered body in, as the browser would have parsed it. */
const loadBody = (page: string) => {
  const { body } = new DOMParser().parseFromString(page, 'text/html');
  document.documentElement.replaceChild(document.importNode(body, true), document.body);
};

describe('showcase page', () => {
  it('hydrates a component that teleports to <body> without replacing #app', async () => {
    loadBody(await prerender());
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const app = createSSRApp(App);
    app.mount('#app');
    unmounts.push(() => app.unmount());

    expect(document.querySelector('#app .nav-menu__toggle')).not.toBeNull();
    const logged = [...warn.mock.calls, ...error.mock.calls].flat().map(String).join('\n');
    expect(logged).not.toMatch(/hydration/i);
  });

  it('refuses teleport targets it has no place for', () => {
    expect(() => buildPage(shell, { html: '', teleports: { '#modals': '<div></div>' } })).toThrow(
      '#modals',
    );
  });
});
