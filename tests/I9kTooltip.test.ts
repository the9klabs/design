import { mount } from '@vue/test-utils';
import { computeAccessibleDescription } from 'dom-accessibility-api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import I9kTooltip from '../src/components/I9kTooltip.vue';

const Host = defineComponent({
  components: { I9kTooltip },
  props: { text: { type: String, default: 'Up to 2 years in a real team.' } },
  template: `
    <div>
      <I9kTooltip :text="text" v-slot="{ describedBy }">
        <button type="button" :aria-describedby="describedBy">Junior</button>
      </I9kTooltip>
      <button type="button" class="elsewhere">Elsewhere</button>
    </div>
  `,
});

function mountHost(text?: string) {
  return mount(Host, { props: text === undefined ? {} : { text }, attachTo: document.body });
}

function bubble(wrapper: ReturnType<typeof mountHost>) {
  return wrapper.get('[role="tooltip"]');
}

function isOpen(wrapper: ReturnType<typeof mountHost>) {
  return bubble(wrapper).attributes('hidden') === undefined;
}

function pointer(type: string, pointerType: string) {
  const event = new Event(type, { bubbles: type !== 'pointerenter' && type !== 'pointerleave' });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  return event;
}

let mounted: ReturnType<typeof mountHost> | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

describe('I9kTooltip', () => {
  it('describes its trigger with the text, closed until asked', () => {
    mounted = mountHost();
    const trigger = mounted.get('button');

    expect(bubble(mounted).text()).toBe('Up to 2 years in a real team.');
    expect(isOpen(mounted)).toBe(false);
    expect(computeAccessibleDescription(trigger.element)).toBe('Up to 2 years in a real team.');
  });

  it('opens on mouse hover and closes when the pointer leaves', async () => {
    mounted = mountHost();
    const root = mounted.get('.i9k-tooltip');

    root.element.dispatchEvent(pointer('pointerenter', 'mouse'));
    await mounted.vm.$nextTick();
    expect(isOpen(mounted)).toBe(true);

    root.element.dispatchEvent(pointer('pointerleave', 'mouse'));
    await mounted.vm.$nextTick();
    expect(isOpen(mounted)).toBe(false);
  });

  it('opens when its trigger takes keyboard focus and closes when focus leaves', async () => {
    mounted = mountHost();

    await mounted.get('button').trigger('focusin');
    expect(isOpen(mounted)).toBe(true);

    await mounted
      .get('button')
      .trigger('focusout', { relatedTarget: mounted.get('.elsewhere').element });
    expect(isOpen(mounted)).toBe(false);
  });

  // WCAG 1.4.13: dismissable without moving the pointer or the focus.
  it('closes on Escape while open', async () => {
    mounted = mountHost();
    await mounted.get('button').trigger('focusin');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await mounted.vm.$nextTick();
    expect(isOpen(mounted)).toBe(false);
  });

  // A phone has no hover: a tap toggles it, and a tap elsewhere closes it.
  it('toggles on tap and closes on a tap outside', async () => {
    mounted = mountHost();
    const root = mounted.get('.i9k-tooltip');
    const trigger = mounted.get('button').element;

    trigger.dispatchEvent(pointer('pointerdown', 'touch'));
    // The tap also focuses the trigger; the tap alone decides.
    await mounted.get('button').trigger('focusin');
    await mounted.get('button').trigger('click');
    expect(isOpen(mounted)).toBe(true);

    // A touch pointer leaves when the finger lifts; that must not close it.
    root.element.dispatchEvent(pointer('pointerleave', 'touch'));
    await mounted.vm.$nextTick();
    expect(isOpen(mounted)).toBe(true);

    trigger.dispatchEvent(pointer('pointerdown', 'touch'));
    await mounted.get('button').trigger('click');
    expect(isOpen(mounted)).toBe(false);

    trigger.dispatchEvent(pointer('pointerdown', 'touch'));
    await mounted.get('button').trigger('click');
    expect(isOpen(mounted)).toBe(true);
    mounted.get('.elsewhere').element.dispatchEvent(pointer('pointerdown', 'touch'));
    await mounted.vm.$nextTick();
    expect(isOpen(mounted)).toBe(false);
  });

  it('ignores a mouse click, which hover already answers', async () => {
    mounted = mountHost();
    const trigger = mounted.get('button').element;

    trigger.dispatchEvent(pointer('pointerdown', 'mouse'));
    await mounted.get('button').trigger('click');
    expect(isOpen(mounted)).toBe(false);
  });

  // A strict Content-Security-Policy (`style-src 'self'`) drops inline style
  // attributes, so a server render must hide the bubble without one.
  it('hides the bubble by attribute, never by an inline style', () => {
    mounted = mountHost();

    expect(mounted.html()).not.toMatch(/\sstyle=/);
  });
});

// Where popovers are supported the bubble opens in the top layer, so a card's
// `overflow: hidden` or a hover transform cannot clip it, and it is placed
// from the trigger's rect, inside the viewport.
describe('I9kTooltip in the top layer', () => {
  // jsdom has no popovers; these stand in for the browser's methods.
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;

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

  function stubLayout(trigger: DOMRect, bubbleSize: DOMRect) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.getAttribute('role') === 'tooltip' ? bubbleSize : trigger;
    });
  }

  let show: ReturnType<typeof vi.fn>;
  let hide: ReturnType<typeof vi.fn>;

  afterEach(() => {
    // Unmount while the stubs still exist: an open tooltip hides its popover.
    mounted?.unmount();
    mounted = undefined;
    delete proto.showPopover;
    delete proto.hidePopover;
    vi.restoreAllMocks();
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 0,
    });
  });

  async function mountInTopLayer() {
    show = vi.fn();
    hide = vi.fn();
    proto.showPopover = show;
    proto.hidePopover = hide;
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: 375,
    });
    mounted = mountHost();
    await mounted.vm.$nextTick();
    return mounted;
  }

  it('opens and closes as a manual popover, never by the hidden attribute', async () => {
    const wrapper = await mountInTopLayer();
    stubLayout(rect(16, 400, 60, 20), rect(0, 0, 200, 50));
    const tip = bubble(wrapper);

    expect(tip.attributes('popover')).toBe('manual');
    expect(tip.attributes('hidden')).toBeUndefined();

    await wrapper.get('button').trigger('focusin');
    expect(show).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('keeps a bubble that would run past the screen edge inside it', async () => {
    const wrapper = await mountInTopLayer();
    // A trigger part-way along a 375px line, under a 288px bubble.
    stubLayout(rect(200, 400, 60, 20), rect(0, 0, 288, 50));

    await wrapper.get('button').trigger('focusin');
    const style = (bubble(wrapper).element as HTMLElement).style;

    // 375 - 288 - 16 = 71; 400 - 50 - 6 = 344.
    expect(style.getPropertyValue('--i9k-tooltip-x')).toBe('71px');
    expect(style.getPropertyValue('--i9k-tooltip-y')).toBe('344px');
    expect(bubble(wrapper).attributes('data-placement')).toBe('above');
  });

  it('opens below a trigger with no room above it', async () => {
    const wrapper = await mountInTopLayer();
    stubLayout(rect(16, 10, 60, 20), rect(0, 0, 200, 50));

    await wrapper.get('button').trigger('focusin');
    const style = (bubble(wrapper).element as HTMLElement).style;

    expect(style.getPropertyValue('--i9k-tooltip-y')).toBe('36px');
    expect(bubble(wrapper).attributes('data-placement')).toBe('below');
  });

  it('closes its popover when it unmounts open', async () => {
    const wrapper = await mountInTopLayer();
    stubLayout(rect(16, 400, 60, 20), rect(0, 0, 200, 50));
    await wrapper.get('button').trigger('focusin');

    wrapper.unmount();
    mounted = undefined;

    expect(hide).toHaveBeenCalledTimes(1);
  });
});
