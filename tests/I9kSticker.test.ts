import { mount } from '@vue/test-utils';
import { computeAccessibleName } from 'dom-accessibility-api';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';

import I9kSticker from '../src/components/I9kSticker.vue';

describe('I9kSticker', () => {
  it('is an image named by its alt text', () => {
    const wrapper = mount(I9kSticker, { props: { src: '/s.webp', alt: 'Early adopter' } });
    const svg = wrapper.get('svg').element;

    expect(svg.getAttribute('role')).toBe('img');
    expect(computeAccessibleName(svg)).toBe('Early adopter');
  });

  it('draws the image and masks the foil with the same image', () => {
    const wrapper = mount(I9kSticker, { props: { src: '/s.webp', alt: 'x' } });
    const hrefs = wrapper.findAll('image').map((image) => image.attributes('href'));

    expect(hrefs).toEqual(['/s.webp', '/s.webp']);
    const maskId = wrapper.get('mask').attributes('id');
    expect(wrapper.get('[mask]').attributes('mask')).toBe(`url(#${maskId})`);
  });

  it('gives two stickers distinct mask and gradient ids', () => {
    const wrapper = mount({
      components: { I9kSticker },
      template:
        '<div><I9kSticker src="/a.webp" alt="a" /><I9kSticker src="/b.webp" alt="b" /></div>',
    });
    const ids = wrapper.findAll('mask, linearGradient').map((node) => node.attributes('id'));

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('renders no style attribute on the server', async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(I9kSticker, { src: '/s.webp', alt: 'x', size: 'lg' }) }),
    );

    expect(html).toContain('i9k-sticker--lg');
    expect(html).not.toMatch(/\sstyle=/);
  });

  // jsdom has no PointerEvent; a MouseEvent of the same type carries clientX.
  it('moves the foil with the pointer and lets it go on leave', () => {
    const wrapper = mount(I9kSticker, {
      props: { src: '/s.webp', alt: 'x' },
      attachTo: document.body,
    });
    const root = wrapper.element as HTMLElement;
    root.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      }) as DOMRect;

    root.dispatchEvent(new MouseEvent('pointermove', { clientX: 75, clientY: 10 }));
    expect(root.style.getPropertyValue('--i9k-sticker-shift')).toBe('0.75');

    root.dispatchEvent(new MouseEvent('pointermove', { clientX: 400, clientY: 10 }));
    expect(root.style.getPropertyValue('--i9k-sticker-shift')).toBe('1');

    root.dispatchEvent(new MouseEvent('pointerleave'));
    expect(root.style.getPropertyValue('--i9k-sticker-shift')).toBe('');
    wrapper.unmount();
  });
});
