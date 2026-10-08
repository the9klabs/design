import { flushPromises, mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { computeAccessibleName } from 'dom-accessibility-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';

import I9kNinoSky from '../src/components/I9kNinoSky.vue';
import { NINO_BEAT } from '../src/data/nino';

function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
  stubMotion(false);
  // jsdom has no 2D canvas; the component must cope.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const nino = (wrapper: ReturnType<typeof mount>) => wrapper.get('svg.i9k-nino');

describe('I9kNinoSky', () => {
  it('names the boop button and keeps the sky and Nino out of the accessibility tree', () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Say hi to Nino' } });
    const button = wrapper.get('button');

    expect(computeAccessibleName(button.element)).toBe('Say hi to Nino');
    expect(button.attributes('type')).toBe('button');
    expect(wrapper.get('canvas').attributes('aria-hidden')).toBe('true');
    expect(nino(wrapper).attributes('aria-hidden')).toBe('true');
  });

  it('changes Nino’s face on each boop, emits it, and settles back to idle', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Say hi to Nino' } });

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('boop')).toEqual([['happy']]);
    // I9kNino swaps a new face in behind a short blink, its mood beat.
    await vi.advanceTimersByTimeAsync(NINO_BEAT.duration);
    expect(nino(wrapper).classes()).toContain('i9k-nino--happy');

    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('boop')?.[1]).toEqual(['surprised']);

    await vi.advanceTimersByTimeAsync(1500 + NINO_BEAT.duration);
    expect(nino(wrapper).classes()).toContain('i9k-nino--idle');
  });

  it('turns Nino’s eyes toward the pointer and back after two seconds', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Say hi to Nino' } });

    wrapper.element.dispatchEvent(new MouseEvent('pointermove', { clientX: 400, clientY: 0 }));
    await wrapper.vm.$nextTick();
    expect(nino(wrapper).classes()).toContain('i9k-nino--look-end');

    await vi.advanceTimersByTimeAsync(2000);
    expect(nino(wrapper).classes()).toContain('i9k-nino--look-center');
  });

  it('ignores touch pointers for the eyes', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Say hi to Nino' } });
    const event = new MouseEvent('pointermove', { clientX: 400, clientY: 0 });
    Object.defineProperty(event, 'pointerType', { value: 'touch' });
    wrapper.element.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(nino(wrapper).classes()).toContain('i9k-nino--look-center');
  });

  it('runs an animation loop only when motion is allowed', () => {
    const frame = vi.fn(() => 1);
    vi.stubGlobal('requestAnimationFrame', frame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    expect(frame).not.toHaveBeenCalled();

    stubMotion(true);
    mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    expect(frame).not.toHaveBeenCalled();

    stubMotion(false);
    mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    expect(frame).toHaveBeenCalled();
  });

  it('stops every timer and frame when it unmounts', async () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 7),
    );
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    await wrapper.get('button').trigger('click');

    wrapper.unmount();
    expect(cancel).toHaveBeenCalledWith(7);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('spins Nino again when a boop lands while he is still spinning', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    const button = wrapper.get('button');
    await button.trigger('click');
    await flushPromises();

    const spinChanges: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        spinChanges.push((record.target as Element).className);
      }
    });
    observer.observe(button.element, { attributes: true, attributeFilter: ['class'] });
    await button.trigger('click');
    await flushPromises();
    observer.disconnect();

    // The spin class must come off and go back on, or the animation never restarts.
    expect(spinChanges.some((name) => !name.includes('i9k-nino-sky__nino--spin'))).toBe(true);
    expect(button.classes()).toContain('i9k-nino-sky__nino--spin');
  });

  it('starts and stops its loop when `animated` changes', async () => {
    const frame = vi.fn(() => 3);
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', frame);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    expect(frame).not.toHaveBeenCalled();

    await wrapper.setProps({ animated: true });
    expect(frame).toHaveBeenCalled();

    await wrapper.setProps({ animated: false });
    expect(cancel).toHaveBeenCalledWith(3);
  });

  it('starts Nino’s drift from the centre, however long the page has been open', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(288);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });

    // The first frame arrives long after the page loaded.
    callbacks.shift()?.(123_457);
    const flight = wrapper.get('.i9k-nino-sky__flight').element as HTMLElement;

    expect(flight.style.transform).toBe('translate(0.0px, 0.0px) rotate(0.00deg)');
  });

  it('redraws a still sky in the new colours when the page theme changes', async () => {
    const fillRect = vi.fn();
    const context = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect,
      globalAlpha: 1,
      fillStyle: '',
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(192);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    expect(fillRect).toHaveBeenCalled();
    fillRect.mockClear();

    const html = document.documentElement;
    const previous = html.className;
    html.className = 'light';
    await flushPromises();
    html.className = previous;
    wrapper.unmount();

    expect(fillRect).toHaveBeenCalled();
  });

  // A strict Content-Security-Policy (`style-src 'self'`) drops inline style
  // attributes, so nothing the server renders may carry one.
  it.each(['sm', 'md', 'lg'] as const)(
    'renders %s on the server without a style attribute',
    async (height) => {
      const html = await renderToString(
        createSSRApp({ render: () => h(I9kNinoSky, { boopLabel: 'Hi', height }) }),
      );

      expect(html).toContain('<canvas');
      expect(html).not.toMatch(/\sstyle=/);
    },
  );
});
