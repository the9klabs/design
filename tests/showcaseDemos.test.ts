import { resolve } from 'node:path';

import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';

import { I9kBadge } from '../src';
import { extractComponent } from '../showcase/extract/props';
import { compileDemo } from '../showcase/.vitepress/theme/components/compileDemo';
import { entries } from '../showcase/registry';
import { mergeRegistry } from '../showcase/registry/merge';

const components = mergeRegistry(
  entries,
  entries.map((entry) => extractComponent(resolve(`src/components/${entry.name}.vue`))),
);

// jsdom has never implemented window.matchMedia. I9kBrandWordmark reads it in onMounted
// to respect prefers-reduced-motion, so mounting its demo needs a spec-shaped stub.
beforeAll(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
});

describe('showcase demo compilation', () => {
  it('renders a demo from its own code string', () => {
    const wrapper = mount(compileDemo({ label: 'x', code: '<I9kBadge>Live</I9kBadge>' }));
    expect(wrapper.text()).toContain('Live');
    expect(wrapper.findComponent(I9kBadge).exists()).toBe(true);
  });

  it('binds a demo state object so v-model code renders', () => {
    const wrapper = mount(
      compileDemo({
        label: 'x',
        code: '<I9kInput v-model="email" label="Email" />',
        state: { email: 'a@b.c' },
      }),
    );
    expect(wrapper.find('input').element.value).toBe('a@b.c');
  });

  it('renders a multi-root demo without warning', () => {
    const wrapper = mount(
      compileDemo({ label: 'x', code: '<I9kBadge>One</I9kBadge><I9kBadge>Two</I9kBadge>' }),
    );
    expect(wrapper.text()).toContain('One');
    expect(wrapper.text()).toContain('Two');
  });

  it('every registered demo compiles and mounts without throwing', () => {
    for (const component of components) {
      for (const demo of component.demos) {
        expect(() => mount(compileDemo(demo)), `${component.name} / ${demo.label}`).not.toThrow();
      }
    }
  });

  it('every registered demo server-renders without throwing', async () => {
    for (const component of components) {
      for (const demo of component.demos) {
        await expect(
          renderToString(createSSRApp(compileDemo(demo))),
          `${component.name} / ${demo.label}`,
        ).resolves.toContain('showcase-demo-stage');
      }
    }
  });

  it('every registered demo mounts without a Vue warning', () => {
    // Vue only reports unresolved components, missing props, etc. via console.warn — it never
    // throws, and production builds strip these warnings entirely — so `not.toThrow()` above
    // cannot catch a demo that references a component or prop that no longer resolves.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const component of components) {
        for (const demo of component.demos) {
          warnSpy.mockClear();
          mount(compileDemo(demo));
          expect(
            warnSpy.mock.calls,
            `${component.name} / ${demo.label} logged a Vue warning: ${warnSpy.mock.calls
              .map((call) => call.join(' '))
              .join('\n')}`,
          ).toEqual([]);
        }
      }
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('every demo referencing a binding declares state for it', () => {
    const missing: string[] = [];
    for (const component of components) {
      for (const demo of component.demos) {
        const bindings = [...demo.code.matchAll(/v-model="(\w+)"/g)].map((match) => match[1]);
        for (const binding of bindings) {
          if (!demo.state || !(binding in demo.state)) {
            missing.push(`${component.name} / ${demo.label} / ${binding}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
