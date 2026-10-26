import { compile } from '@vue/compiler-dom';
import * as Vue from 'vue';
import { defineComponent, type Component, type RenderFunction } from 'vue';

import * as library from '../../../../src/index';
import type { ShowcaseDemo } from '../../../registry/types';

/** Every I9k component, keyed by name, for the compiled demo's local registry. */
const libraryComponents = Object.fromEntries(
  Object.entries(library).filter(([name]) => name.startsWith('I9k')),
) as Record<string, Component>;

/**
 * Compiles a template to a render function, the way Vue's full build does. VitePress ships the
 * runtime-only build to the browser, so the compiler is called here rather than through the
 * `template` option; the same code then runs on the server and the client.
 */
const compileTemplate = (template: string): RenderFunction => {
  const { code } = compile(template, { hoistStatic: true, whitespace: 'condense' });
  const render = new Function('Vue', code)(Vue) as RenderFunction & { _rc?: boolean };
  // The compiled code reads its scope through `with (_ctx)`. Marking it runtime-compiled gives it
  // the instance proxy that answers `with`'s lookups, as Vue's own compileToFunction does.
  render._rc = true;
  return render;
};

/**
 * Turns a demo's own code string into a renderable component. The string shown to the
 * reader is the string that renders, so the two cannot disagree.
 *
 * The code may have several root elements, which a template alone cannot express, so it
 * is wrapped in a <div> that the demo frame styles as the stage.
 */
export const compileDemo = (
  demo: Pick<ShowcaseDemo, 'code'> & Partial<ShowcaseDemo>,
): Component => {
  if (demo.render) return demo.render;

  const state = demo.state ?? {};

  return defineComponent({
    name: 'ShowcaseDemoStage',
    components: libraryComponents,
    data: () => ({ ...state }),
    render: compileTemplate(`<div class="showcase-demo-stage">${demo.code}</div>`),
  });
};
