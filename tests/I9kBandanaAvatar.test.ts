import { mount } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import I9kBandanaAvatar from '../src/components/I9kBandanaAvatar.vue';

const props = { src: '/me.webp', alt: 'Abdelrahman Ismail', bandanaSrc: '/bandana.webp' };

// The bandana starts two animation frames after it is asked to, so that a
// replay restarts the CSS animation. The frames are run by hand here.
let frames: FrameRequestCallback[] = [];

async function runFrames() {
  for (let i = 0; i < 2; i += 1) {
    const due = frames;
    frames = [];
    for (const frame of due) frame(0);
  }
  await Promise.resolve();
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function isPlaying(wrapper: ReturnType<typeof mount>) {
  return wrapper.get('[data-bandana]').classes().includes('i9k-bandana-avatar__bandana--playing');
}

describe('I9kBandanaAvatar', () => {
  it('shows the photo with its alt text, and the bandana as decoration', () => {
    const wrapper = mount(I9kBandanaAvatar, { props });
    const [photo, bandana] = wrapper.findAll('img');

    expect(photo!.attributes('src')).toBe('/me.webp');
    expect(photo!.attributes('alt')).toBe('Abdelrahman Ismail');
    expect(bandana!.attributes('src')).toBe('/bandana.webp');
    expect(bandana!.attributes('alt')).toBe('');
    expect(bandana!.attributes('aria-hidden')).toBe('true');
    expect(bandana!.attributes('draggable')).toBe('false');
  });

  it('loads both images eagerly unless told to load them lazily', () => {
    const eager = mount(I9kBandanaAvatar, { props });
    expect(eager.findAll('img').map((img) => img.attributes('loading'))).toEqual([
      'eager',
      'eager',
    ]);

    const lazy = mount(I9kBandanaAvatar, { props: { ...props, loading: 'lazy' } });
    expect(lazy.findAll('img').map((img) => img.attributes('loading'))).toEqual(['lazy', 'lazy']);
  });

  it('draws the bandana once, when the photo and the bandana have both loaded', async () => {
    const wrapper = mount(I9kBandanaAvatar, { props });
    const [photo, bandana] = wrapper.findAll('img');

    await photo!.trigger('load');
    await runFrames();
    expect(isPlaying(wrapper)).toBe(false);

    await bandana!.trigger('load');
    await runFrames();
    await wrapper.vm.$nextTick();
    expect(isPlaying(wrapper)).toBe(true);
  });

  it('does not draw it again when an image loads a second time', async () => {
    const wrapper = mount(I9kBandanaAvatar, { props });
    const [photo, bandana] = wrapper.findAll('img');
    await photo!.trigger('load');
    await bandana!.trigger('load');
    await runFrames();

    await photo!.trigger('load');

    // A replay would have queued a frame to restart the animation.
    expect(frames).toHaveLength(0);
  });

  it('draws the bandana again when a pointer enters', async () => {
    const wrapper = mount(I9kBandanaAvatar, { props });
    const [photo, bandana] = wrapper.findAll('img');
    await photo!.trigger('load');
    await bandana!.trigger('load');
    await runFrames();
    await wrapper.vm.$nextTick();

    await wrapper.trigger('pointerenter');
    expect(isPlaying(wrapper)).toBe(false);

    await runFrames();
    await wrapper.vm.$nextTick();
    expect(isPlaying(wrapper)).toBe(true);
  });

  it('draws the bandana for images that had loaded before it mounted', async () => {
    // A server-rendered page: the browser may finish both images before Vue
    // hydrates, so no load event is left to hear.
    const loaded = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const sized = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(100);
    try {
      const wrapper = mount(I9kBandanaAvatar, { props });
      await runFrames();
      await wrapper.vm.$nextTick();

      expect(isPlaying(wrapper)).toBe(true);
    } finally {
      loaded.mockRestore();
      sized.mockRestore();
    }
  });

  it('stops a pending replay when it unmounts', async () => {
    const wrapper = mount(I9kBandanaAvatar, { props });
    await wrapper.trigger('pointerenter');
    expect(frames).toHaveLength(1);

    wrapper.unmount();

    expect(frames).toHaveLength(0);
  });

  it('renders its size as a class and no style attribute on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kBandanaAvatar, { ...props, size: 'lg' }) }),
    );

    expect(html).toContain('i9k-bandana-avatar--lg');
    expect(html).not.toContain('i9k-bandana-avatar__bandana--playing');
    expect(html).not.toMatch(/\sstyle=/);
  });

  it('passes attributes such as a class to its root', () => {
    const wrapper = mount(I9kBandanaAvatar, { props, attrs: { class: 'hero-avatar' } });

    expect(wrapper.classes()).toContain('hero-avatar');
    expect(wrapper.classes()).toContain('i9k-bandana-avatar--md');
  });
});

describe('I9kBandanaAvatar styles', () => {
  async function compiledCss() {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const { compileStyle, parse } = await import('vue/compiler-sfc');
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/I9kBandanaAvatar.vue'),
      'utf8',
    );
    const style = parse(source).descriptor.styles[0]!;
    const { code } = compileStyle({
      source: style.content,
      id: 'data-v-test',
      scoped: true,
      filename: 'I9kBandanaAvatar.vue',
    });
    return code.replace(/\/\*[\s\S]*?\*\//g, '');
  }

  // Every rule must stay scoped to the avatar, so that none of its animation
  // or positioning can reach another element of a page.
  it('scopes every compiled selector to the avatar', async () => {
    const css = await compiledCss();
    const selectors = [...css.matchAll(/(^|[{}])\s*([^{}@]+?)\s*\{/g)]
      .flatMap((match) => match[2]!.split(','))
      .map((selector) => selector.trim())
      .filter((selector) => selector && !/^(from|to|\d+%)$/.test(selector));

    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector, selector).toMatch(/i9k-bandana-avatar/);
    }
  });

  it('keeps the bandana hidden and still for people who prefer reduced motion', async () => {
    const css = await compiledCss();
    const reduced = css.slice(css.indexOf('prefers-reduced-motion'));

    expect(css).toContain('prefers-reduced-motion');
    expect(reduced).toContain('i9k-bandana-avatar__bandana--playing');
    expect(reduced).toMatch(/animation:\s*none/);
    expect(reduced).toMatch(/opacity:\s*0/);
  });
});
