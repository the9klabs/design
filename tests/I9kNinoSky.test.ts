import { flushPromises, mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { computeAccessibleName } from 'dom-accessibility-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp, h, nextTick } from 'vue';

import I9kNinoSky from '../src/components/I9kNinoSky.vue';
import { DIZZY_FACE_MS } from '../src/composables/i9kNinoSky';
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

    // Nino swaps each face in behind his mood beat, so it shows a beat later.
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('boop')).toEqual([['happy']]);
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

/** A pointer event as jsdom can build one: a MouseEvent carrying the pointer fields. */
function pointer(
  type: string,
  x: number,
  y: number,
  init: { id?: number; button?: number; primary?: boolean } = {},
) {
  const event = new MouseEvent(type, {
    clientX: x,
    clientY: y,
    button: init.button ?? 0,
    bubbles: true,
  });
  Object.defineProperty(event, 'pointerId', { value: init.id ?? 1 });
  Object.defineProperty(event, 'isPrimary', { value: init.primary ?? true });
  Object.defineProperty(event, 'pointerType', { value: 'mouse' });
  return event;
}

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

type SkyWrapper = ReturnType<typeof mount>;

/** The sky on screen: 300px tall, its top edge 500px down a 1000px-wide window. */
function placeSky(wrapper: SkyWrapper) {
  vi.spyOn(wrapper.element as HTMLElement, 'getBoundingClientRect').mockReturnValue(
    rect(0, 500, 1000, 300),
  );
}

const flightOf = (wrapper: SkyWrapper) =>
  wrapper.get('.i9k-nino-sky__flight').element as HTMLElement;
const isAirborne = (wrapper: SkyWrapper) =>
  wrapper.get('.i9k-nino-sky__flight').classes().includes('i9k-nino-sky__flight--airborne');

async function press(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointerdown', x, y, init));
  await nextTick();
}

async function move(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointermove', x, y, init));
  await nextTick();
}

async function release(wrapper: SkyWrapper, x: number, y: number, init = {}) {
  wrapper.get('button').element.dispatchEvent(pointer('pointerup', x, y, init));
  await nextTick();
}

async function pointerClick(wrapper: SkyWrapper) {
  wrapper
    .get('button')
    .element.dispatchEvent(new MouseEvent('click', { detail: 1, bubbles: true }));
  await nextTick();
}

// jsdom lays Nino out at (0, 0) with no size, so pressing at (0, 0) grabs his
// top-left corner and his top-left then follows the pointer exactly.
describe('I9kNinoSky drag', () => {
  it('picks Nino up only once the pointer moves past the threshold', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 3, 0);
    expect(isAirborne(wrapper)).toBe(false);

    await move(wrapper, 30, 620);
    expect(isAirborne(wrapper)).toBe(true);
    expect(nino(wrapper).classes()).toContain('i9k-nino--surprised');
    expect(nino(wrapper).classes()).toContain('i9k-nino--look-center');
  });

  it('keeps him inside the window while he is dragged', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 5000, 5000);

    expect(flightOf(wrapper).style.transform).toBe(
      `translate(1000.0px, ${window.innerHeight}.0px) rotate(0.00deg)`,
    );
  });

  it('does not boop when a drag ends in a click', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    await release(wrapper, 40, 650);
    await pointerClick(wrapper);

    expect(wrapper.emitted('boop')).toBeUndefined();
  });

  it('still boops on a tap', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await release(wrapper, 1, 1);
    await pointerClick(wrapper);

    expect(wrapper.emitted('boop')).toEqual([['happy']]);
  });

  it('boops from the keyboard right after a drag', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    await release(wrapper, 40, 650);
    // Enter and Space fire a click with detail 0.
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('boop')).toEqual([['happy']]);
  });

  it('sends Nino back and makes him dizzy when he is dropped above the sky', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 0, 100);
    await release(wrapper, 0, 100);

    expect(isAirborne(wrapper)).toBe(false);
    expect(flightOf(wrapper).style.transform).toBe('');
    expect(nino(wrapper).classes()).toContain('i9k-nino--dizzy');

    await vi.advanceTimersByTimeAsync(DIZZY_FACE_MS);
    expect(nino(wrapper).classes()).toContain('i9k-nino--idle');
  });

  it('lets him settle without fuss when he is dropped inside the sky', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 0, 650);
    await release(wrapper, 0, 650);

    expect(isAirborne(wrapper)).toBe(false);
    expect(nino(wrapper).classes()).toContain('i9k-nino--idle');
  });

  it('ignores a right-click and a second finger', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0, { button: 2 });
    await move(wrapper, 300, 300);
    expect(isAirborne(wrapper)).toBe(false);

    await press(wrapper, 0, 0);
    await move(wrapper, 300, 300, { id: 2, primary: false });
    expect(isAirborne(wrapper)).toBe(false);
  });

  it('lands him when the drag is cancelled', async () => {
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi', animated: false } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    wrapper.get('button').element.dispatchEvent(pointer('pointercancel', 40, 650));
    await nextTick();

    expect(isAirborne(wrapper)).toBe(false);
  });

  it('lets go of every timer and frame when it unmounts mid-drag', async () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 11),
    );
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const wrapper = mount(I9kNinoSky, { props: { boopLabel: 'Hi' } });
    placeSky(wrapper);

    await press(wrapper, 0, 0);
    await move(wrapper, 40, 650);
    wrapper.unmount();

    expect(cancel).toHaveBeenCalledWith(11);
    expect(vi.getTimerCount()).toBe(0);
  });
});
