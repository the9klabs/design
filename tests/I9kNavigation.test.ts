import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kNavigation from '../src/components/I9kNavigation.vue';

const links = [
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'talks', label: 'Talks', href: '/talks' },
];

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  template: '<a data-router-link><slot /></a>',
});

describe('I9kNavigation', () => {
  it('renders plain anchors for the brand and every link by default', () => {
    const wrapper = mount(I9kNavigation, { props: { links, brandHref: '/home' } });

    expect(wrapper.get('.navigation__brand').attributes('href')).toBe('/home');
    expect(wrapper.findAll('.navigation__link').map((link) => link.attributes('href'))).toEqual([
      '/blog',
      '/talks',
    ]);
  });

  it('hands every destination to a caller-supplied link component', () => {
    const wrapper = mount(I9kNavigation, {
      props: { links, brandHref: '/home', linkComponent: RouterLinkStub },
    });
    const rendered = wrapper.findAllComponents(RouterLinkStub);

    expect(rendered.map((link) => link.props('to'))).toEqual(['/home', '/blog', '/talks']);
    expect(wrapper.findAll('[data-router-link]').every((link) => !link.attributes('href'))).toBe(
      true,
    );
  });

  it('still emits navigate when the menu renders a link component', async () => {
    const wrapper = mount(I9kNavigation, { props: { links, linkComponent: RouterLinkStub } });
    await wrapper.findAll('.navigation__link')[1].trigger('click');

    expect(wrapper.emitted('navigate')?.[0]?.[0]).toEqual(links[1]);
  });

  it('keeps the accessible brand name on a link component', () => {
    const wrapper = mount(I9kNavigation, {
      props: { links, brandLabel: 'Ismail9k home', linkComponent: RouterLinkStub },
    });

    expect(wrapper.get('.navigation__brand').attributes('aria-label')).toBe('Ismail9k home');
  });

  it('lays the bar out in the shared page column', () => {
    const wrapper = mount(I9kNavigation, { props: { links } });

    expect(wrapper.get('nav').classes()).toContain('i9k-container');
  });

  it('exposes the compact state to the actions slot as well as the brand', () => {
    const wrapper = mount(I9kNavigation, {
      props: { links },
      slots: {
        brand: '<template #default="{ compact }"><b>{{ String(compact) }}</b></template>',
        actions: '<template #default="{ compact }"><i>{{ String(compact) }}</i></template>',
      },
    });

    expect(wrapper.get('b').text()).toBe('false');
    expect(wrapper.get('i').text()).toBe('false');
  });
});
