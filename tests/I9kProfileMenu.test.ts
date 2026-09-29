import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import I9kProfileMenu from '../src/components/I9kProfileMenu.vue';

const links = [
  { id: 'profile', label: 'My account', href: '/profile' },
  { id: 'orders', label: 'My orders', href: '/profile/orders' },
];

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  template: '<a data-router-link :href="to"><slot /></a>',
});

const mounted: { unmount: () => void }[] = [];
const mountMenu = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => {
  const wrapper = mount(I9kProfileMenu, {
    props: {
      label: 'Account menu',
      name: 'Ismail',
      detail: 'me@example.com',
      avatarSrc: '/me.png',
      links,
      ...props,
    },
    slots,
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
};
afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
});

const trigger = (wrapper: ReturnType<typeof mountMenu>) =>
  wrapper.get('button.i9k-profile-menu__trigger');
const panel = (wrapper: ReturnType<typeof mountMenu>) => wrapper.get('.i9k-profile-menu__panel');

describe('I9kProfileMenu', () => {
  it('is a labelled button that controls a closed panel', () => {
    const wrapper = mountMenu();
    const button = trigger(wrapper);

    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Account menu');
    expect(button.attributes('aria-expanded')).toBe('false');
    expect(button.attributes('aria-controls')).toBe(panel(wrapper).attributes('id'));
    expect(panel(wrapper).isVisible()).toBe(false);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it('server-renders a closed panel hidden by attribute, with no inline style', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(I9kProfileMenu, { label: 'Account menu', name: 'Ismail', links }),
      }),
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const serverPanel = doc.querySelector('.i9k-profile-menu__panel')!;
    const serverTrigger = doc.querySelector('button.i9k-profile-menu__trigger')!;

    expect(serverPanel.hasAttribute('hidden')).toBe(true);
    expect(serverPanel.hasAttribute('style')).toBe(false);
    expect(serverTrigger.getAttribute('aria-controls')).toBe(serverPanel.id);
  });

  it('removes the hidden attribute when it opens and restores it when it closes', async () => {
    const wrapper = mountMenu();
    expect(panel(wrapper).attributes('hidden')).toBeDefined();

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).attributes('hidden')).toBeUndefined();
    expect(panel(wrapper).attributes('style')).toBeUndefined();

    await trigger(wrapper).trigger('click');
    expect(panel(wrapper).attributes('hidden')).toBeDefined();
  });

  it('keeps the trigger picture out of the accessibility tree', () => {
    const wrapper = mountMenu();

    expect(trigger(wrapper).get('.i9k-avatar').attributes('aria-hidden')).toBe('true');
  });

  it('opens on a press, names the account and lists its links', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
    expect(panel(wrapper).isVisible()).toBe(true);
    expect(panel(wrapper).text()).toContain('Ismail');
    expect(panel(wrapper).text()).toContain('me@example.com');
    expect(
      wrapper.findAll('a.i9k-profile-menu__link').map((a) => [a.text(), a.attributes('href')]),
    ).toEqual([
      ['My account', '/profile'],
      ['My orders', '/profile/orders'],
    ]);
    expect(wrapper.emitted('update:open')).toEqual([[true]]);
  });

  it('shows only the detail line when there is no name', async () => {
    const wrapper = mountMenu({ name: null });
    await trigger(wrapper).trigger('click');

    expect(wrapper.find('.i9k-profile-menu__name').exists()).toBe(false);
    expect(wrapper.get('.i9k-profile-menu__detail').text()).toBe('me@example.com');
  });

  it('closes on Escape and returns focus to the button', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');
    (wrapper.get('a.i9k-profile-menu__link').element as HTMLElement).focus();

    await wrapper.get('a.i9k-profile-menu__link').trigger('keydown', { key: 'Escape' });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger(wrapper).element);
  });

  // Safari and Firefox on macOS do not focus a clicked button, so after a mouse
  // open the key goes to the body, never through the menu's own root.
  it('closes on Escape after a mouse open that left focus on the body', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');
    (document.activeElement as HTMLElement | null)?.blur();
    expect(document.activeElement).toBe(document.body);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger(wrapper).element);
  });

  it('closes on a press outside it', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('closes on a press outside it when it starts open', async () => {
    const wrapper = mountMenu({ open: true });

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });

  it('stays open on a press inside its panel', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');

    panel(wrapper).element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await nextTick();

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('closes when keyboard focus leaves it', async () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');

    await wrapper.get('a.i9k-profile-menu__link').trigger('focusout', { relatedTarget: outside });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    outside.remove();
  });

  it('stays open while focus moves within it', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');
    const [first, second] = wrapper.findAll('a.i9k-profile-menu__link');

    await first.trigger('focusout', { relatedTarget: second.element });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');
  });

  it('closes and reports the link when one is followed', async () => {
    const wrapper = mountMenu();
    await trigger(wrapper).trigger('click');

    await wrapper.findAll('a.i9k-profile-menu__link')[1].trigger('click');

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('navigate')?.[0]?.[0]).toEqual(links[1]);
  });

  it('renders links with a router link component, passing the destination as to', async () => {
    const wrapper = mountMenu({ linkComponent: RouterLinkStub });
    await trigger(wrapper).trigger('click');

    expect(wrapper.findAll('[data-router-link]').map((a) => a.attributes('href'))).toEqual([
      '/profile',
      '/profile/orders',
    ]);
  });

  it('hands its actions slot a close function', async () => {
    const wrapper = mountMenu(
      {},
      {
        actions:
          '<template #actions="{ close }"><button data-sign-out @click="close">Sign out</button></template>',
      },
    );
    await trigger(wrapper).trigger('click');

    await wrapper.get('[data-sign-out]').trigger('click');

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });

  it('follows v-model:open from outside', async () => {
    const wrapper = mountMenu({ open: true });
    expect(trigger(wrapper).attributes('aria-expanded')).toBe('true');

    await wrapper.setProps({ open: false });

    expect(trigger(wrapper).attributes('aria-expanded')).toBe('false');
  });
});
