import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kSideNav from '../src/components/I9kSideNav.vue';

const links = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin' },
  { id: 'courses', label: 'Courses', href: '/admin/courses', current: true },
  { id: 'orders', label: 'Orders', href: '/admin/orders' },
];

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  template: '<a data-router-link :href="to"><slot /></a>',
});

describe('I9kSideNav', () => {
  it('is a navigation landmark named by its label', () => {
    const wrapper = mount(I9kSideNav, { props: { label: 'Admin sections', links } });

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Admin sections');
  });

  it('lists every link in order, with its label and destination', () => {
    const wrapper = mount(I9kSideNav, { props: { label: 'Admin sections', links } });

    expect(
      wrapper.findAll('nav li a').map((link) => [link.text(), link.attributes('href')]),
    ).toEqual([
      ['Dashboard', '/admin'],
      ['Courses', '/admin/courses'],
      ['Orders', '/admin/orders'],
    ]);
  });

  it('marks the current link, and only it, as the current page', () => {
    const wrapper = mount(I9kSideNav, { props: { label: 'Admin sections', links } });

    expect(wrapper.findAll('a').map((link) => link.attributes('aria-current'))).toEqual([
      undefined,
      'page',
      undefined,
    ]);
  });

  it('marks nothing current when no link is', () => {
    const wrapper = mount(I9kSideNav, {
      props: {
        label: 'Admin sections',
        links: links.map(({ current: _current, ...link }) => link),
      },
    });

    expect(wrapper.find('[aria-current]').exists()).toBe(false);
  });

  it('renders links through the given link component, passing the destination as `to`', () => {
    const wrapper = mount(I9kSideNav, {
      props: { label: 'Admin sections', links, linkComponent: RouterLinkStub },
    });

    const rendered = wrapper.findAll('[data-router-link]');
    expect(rendered).toHaveLength(3);
    expect(rendered[1]!.attributes('href')).toBe('/admin/courses');
    expect(rendered[1]!.attributes('aria-current')).toBe('page');
  });

  it('renders the footer slot inside the navigation, after the list', () => {
    const wrapper = mount(I9kSideNav, {
      props: { label: 'Account sections', links },
      slots: { footer: '<a href="/courses" data-footer-link>Browse the courses</a>' },
    });

    const footer = wrapper.get('[data-footer-link]');
    expect(wrapper.get('nav').element.contains(footer.element)).toBe(true);
    expect(wrapper.get('ul').element.contains(footer.element)).toBe(false);
  });
});
