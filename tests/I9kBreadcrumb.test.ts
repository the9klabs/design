import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';

import I9kBreadcrumb from '../src/components/I9kBreadcrumb.vue';

const items = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'course', label: 'Leveraging AI', href: '/courses/ai' },
  { id: 'lesson', label: 'Hello, Agent' },
];

describe('I9kBreadcrumb', () => {
  it('is a named navigation landmark holding an ordered trail', () => {
    const wrapper = mount(I9kBreadcrumb, { props: { items } });

    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb');
    expect(wrapper.findAll('ol > li')).toHaveLength(3);
  });

  it('takes the accessible name it is given', () => {
    const wrapper = mount(I9kBreadcrumb, { props: { items, label: 'مسار التنقّل' } });

    expect(wrapper.attributes('aria-label')).toBe('مسار التنقّل');
  });

  it('links every item before the last', () => {
    const wrapper = mount(I9kBreadcrumb, { props: { items } });

    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toEqual([
      '/',
      '/courses/ai',
    ]);
  });

  it('marks the last item as the current page and never links it', () => {
    const wrapper = mount(I9kBreadcrumb, {
      props: { items: [items[0], { id: 'lesson', label: 'Hello, Agent', href: '/lesson' }] },
    });
    const current = wrapper.findAll('[aria-current]');

    expect(current).toHaveLength(1);
    expect(current[0].attributes('aria-current')).toBe('page');
    expect(current[0].element.tagName).toBe('SPAN');
    expect(current[0].text()).toBe('Hello, Agent');
    expect(wrapper.findAll('a')).toHaveLength(1);
  });

  it('renders an earlier item without an href as plain text', () => {
    const wrapper = mount(I9kBreadcrumb, {
      props: { items: [{ id: 'area', label: 'Area' }, items[2]] },
    });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1);
    expect(wrapper.get('li').text()).toContain('Area');
  });

  it('hides the separators from assistive technology', () => {
    const wrapper = mount(I9kBreadcrumb, { props: { items } });
    const separators = wrapper.findAll('[aria-hidden="true"]');

    expect(separators).toHaveLength(2);
    expect(separators.map((separator) => separator.text())).toEqual(['/', '/']);
  });

  it('keeps each full label in a title, for a label the trail truncates', () => {
    const wrapper = mount(I9kBreadcrumb, { props: { items } });

    expect(wrapper.get('a').attributes('title')).toBe('Home');
    expect(wrapper.get('[aria-current="page"]').attributes('title')).toBe('Hello, Agent');
  });

  it('hands a router link component its destination as `to`', () => {
    const RouterLinkStub = defineComponent({
      props: { to: { type: String, required: true } },
      template: '<a data-router-link :data-to="to"><slot /></a>',
    });
    const wrapper = mount(I9kBreadcrumb, { props: { items, linkComponent: RouterLinkStub } });

    expect(wrapper.findAll('[data-router-link]').map((link) => link.attributes('data-to'))).toEqual(
      ['/', '/courses/ai'],
    );
  });
});
