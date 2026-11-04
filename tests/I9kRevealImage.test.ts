import { mount, type VueWrapper } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import I9kRevealImage from '../src/components/I9kRevealImage.vue';
import { REVEAL_DURATION_MS, REVEAL_ROOT_MARGIN } from '../src/utils/revealImage';

const props = {
  src: '/cover.webp',
  srcset: '/cover-640.webp 640w, /cover-1280.webp 1280w',
  sizes: '(max-width: 768px) 100vw, 400px',
  alt: 'The course cover',
  width: 1774,
  height: 887,
};

// An IntersectionObserver whose reports the test sends by hand.
class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly targets: Element[] = [];
  readonly disconnect = vi.fn();
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.targets.push(target);
  }
  unobserve() {}
  takeRecords() {
    return [];
  }
  report(near: boolean) {
    const entries = this.targets.map(
      (target) => ({ target, isIntersecting: near }) as IntersectionObserverEntry,
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

let clock = 0;
let frames: FrameRequestCallback[] = [];
let reducedMotion = false;
const cancelFrame = vi.fn();
const fillRect = vi.fn();
const clearRect = vi.fn();
const fakeContext = { fillRect, clearRect, fillStyle: '' } as unknown as CanvasRenderingContext2D;
let context: CanvasRenderingContext2D | null = fakeContext;

function observer() {
  const last = FakeObserver.instances.at(-1);
  if (!last) throw new Error('no IntersectionObserver was created');
  return last;
}

async function report(near: boolean) {
  observer().report(near);
  await nextTick();
}

// Runs every frame the reveal asks for while the clock moves on in 16 ms steps.
async function runFrames(untilMs: number) {
  const end = clock + untilMs;
  while (frames.length > 0 && clock < end) {
    clock += 16;
    const due = frames;
    frames = [];
    for (const frame of due) frame(clock);
  }
  await nextTick();
}

function img(wrapper: VueWrapper) {
  return wrapper.get('img');
}

function state(wrapper: VueWrapper) {
  return wrapper.attributes('data-state');
}

async function loadAfter(wrapper: VueWrapper, ms: number) {
  clock += ms;
  await img(wrapper).trigger('load');
  await nextTick();
}

beforeEach(() => {
  clock = 0;
  frames = [];
  reducedMotion = false;
  context = fakeContext;
  FakeObserver.instances = [];
  cancelFrame.mockReset();
  fillRect.mockReset();
  clearRect.mockReset();
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    cancelFrame(id);
    frames = [];
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') && reducedMotion,
    media: query,
  }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('I9kRevealImage on the server', () => {
  it('renders the image with every attribute, lazily, behind a hidden placeholder', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(I9kRevealImage, props) }));

    expect(html).toContain('<img');
    expect(html).toContain('src="/cover.webp"');
    expect(html).toContain(`srcset="${props.srcset}"`);
    expect(html).toContain(`sizes="${props.sizes}"`);
    expect(html).toContain('width="1774"');
    expect(html).toContain('height="887"');
    expect(html).toContain('alt="The course cover"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-state="native"');
    expect(html).not.toMatch(/\sstyle=/);
  });

  it('renders an eager image as a plain high-priority <img>', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kRevealImage, { ...props, eager: true }) }),
    );

    expect(html).toMatch(/^<img/);
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('src="/cover.webp"');
    expect(html).not.toContain('aria-hidden');
    expect(html).not.toContain('data-state');
    expect(html).not.toMatch(/\sstyle=/);
  });
});

describe('I9kRevealImage in the browser', () => {
  it('keeps the box at the image size from a script, observing with the shared margin', () => {
    const wrapper = mount(I9kRevealImage, { props });

    expect((wrapper.element as HTMLElement).style.aspectRatio).toBe('1774 / 887');
    expect(observer().options?.rootMargin).toBe(REVEAL_ROOT_MARGIN);
    expect(observer().targets).toEqual([wrapper.element]);
  });

  it('holds back the request while the first report finds the image far away', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    expect(state(wrapper)).toBe('native');

    await report(false);

    expect(state(wrapper)).toBe('waiting');
    expect(img(wrapper).attributes('src')).toBeUndefined();
    expect(img(wrapper).attributes('srcset')).toBeUndefined();
    expect(img(wrapper).attributes('sizes')).toBeUndefined();
    expect(img(wrapper).attributes('width')).toBe('1774');
    expect(img(wrapper).attributes('height')).toBe('887');
  });

  it('requests the image once it comes near, and reveals it after a real wait', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await report(false);
    await report(true);

    expect(state(wrapper)).toBe('loading');
    expect(img(wrapper).attributes('src')).toBe('/cover.webp');
    expect(img(wrapper).attributes('srcset')).toBe(props.srcset);
    expect(img(wrapper).attributes('sizes')).toBe(props.sizes);

    await loadAfter(wrapper, 300);

    expect(state(wrapper)).toBe('revealing');
    const canvas = wrapper.get('canvas');
    expect(canvas.attributes('aria-hidden')).toBe('true');

    await runFrames(REVEAL_DURATION_MS + 100);

    expect(state(wrapper)).toBe('shown');
    expect(wrapper.find('canvas').exists()).toBe(false);
  });

  it('shows an image that arrives at once without a reveal', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await report(false);
    await report(true);

    await loadAfter(wrapper, 50);

    expect(state(wrapper)).toBe('shown');
    expect(wrapper.find('canvas').exists()).toBe(false);
    expect(frames).toHaveLength(0);
  });

  it('never animates for a reader who prefers reduced motion', async () => {
    reducedMotion = true;
    const wrapper = mount(I9kRevealImage, { props });
    await report(false);
    await report(true);

    await loadAfter(wrapper, 300);

    expect(state(wrapper)).toBe('shown');
    expect(wrapper.find('canvas').exists()).toBe(false);
  });

  it('shows the image without a reveal when the canvas cannot draw', async () => {
    context = null;
    const wrapper = mount(I9kRevealImage, { props });
    await report(false);
    await report(true);

    await loadAfter(wrapper, 300);

    expect(state(wrapper)).toBe('shown');
    expect(wrapper.find('canvas').exists()).toBe(false);
  });

  it('fails an image that does not load', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await report(true);

    await img(wrapper).trigger('error');

    expect(state(wrapper)).toBe('failed');
  });

  it('shows an image the browser loaded before the first report, and keeps it', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await loadAfter(wrapper, 40);
    expect(state(wrapper)).toBe('shown');

    await report(false);

    expect(state(wrapper)).toBe('shown');
    expect(img(wrapper).attributes('src')).toBe('/cover.webp');
  });

  it('fails an image that broke before the first report, and keeps it failed', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await img(wrapper).trigger('error');
    expect(state(wrapper)).toBe('failed');

    await report(true);

    expect(state(wrapper)).toBe('failed');
  });

  it('shows an image that had loaded before it mounted', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800);

    const wrapper = mount(I9kRevealImage, { props });
    await nextTick();

    expect(state(wrapper)).toBe('shown');
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it('loads at once where there is no IntersectionObserver', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const wrapper = mount(I9kRevealImage, { props });
    await nextTick();

    expect(state(wrapper)).toBe('loading');
    expect(img(wrapper).attributes('src')).toBe('/cover.webp');
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it('stops observing and drawing when it unmounts mid-reveal', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await report(false);
    await report(true);
    await loadAfter(wrapper, 300);
    await runFrames(32);
    expect(state(wrapper)).toBe('revealing');
    const watcher = observer();

    expect(() => wrapper.unmount()).not.toThrow();

    expect(watcher.disconnect).toHaveBeenCalled();
    expect(cancelFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });

  it('passes the alternative text through, an empty one included', () => {
    expect(img(mount(I9kRevealImage, { props })).attributes('alt')).toBe('The course cover');
    expect(img(mount(I9kRevealImage, { props: { ...props, alt: '' } })).attributes('alt')).toBe('');
  });

  it('keeps the placeholder away from screen readers', () => {
    const wrapper = mount(I9kRevealImage, { props });

    const hidden = wrapper.findAll('[aria-hidden="true"]');
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden.every((node) => node.find('img').exists() === false)).toBe(true);
  });

  it('tells its parent when the image loads or fails', async () => {
    const wrapper = mount(I9kRevealImage, { props });
    await report(true);
    await loadAfter(wrapper, 10);
    await img(wrapper).trigger('error');

    expect(wrapper.emitted('load')).toHaveLength(1);
    expect(wrapper.emitted('error')).toHaveLength(1);
  });

  it('renders an eager image with no observer, wrapper or state', () => {
    const wrapper = mount(I9kRevealImage, { props: { ...props, eager: true } });

    expect(wrapper.element.tagName).toBe('IMG');
    expect(wrapper.attributes('loading')).toBe('eager');
    expect(wrapper.attributes('fetchpriority')).toBe('high');
    expect(wrapper.attributes('data-state')).toBeUndefined();
    expect(FakeObserver.instances).toHaveLength(0);
  });
});
