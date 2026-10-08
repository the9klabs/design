import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import I9kAnnouncementBar from '../src/components/I9kAnnouncementBar.vue';

const base = { closeLabel: 'Close announcement' };

describe('I9kAnnouncementBar', () => {
  it('renders the message in a labelled complementary landmark', () => {
    const wrapper = mount(I9kAnnouncementBar, {
      props: { ...base, label: 'Site announcement' },
      slots: { default: 'A new course is live' },
    });
    const aside = wrapper.get('aside');
    expect(aside.attributes('aria-label')).toBe('Site announcement');
    expect(aside.text()).toContain('A new course is live');
  });

  it('defaults the landmark label', () => {
    const wrapper = mount(I9kAnnouncementBar, { props: base, slots: { default: 'Hi' } });
    expect(wrapper.get('aside').attributes('aria-label')).toBe('Announcement');
  });

  it('renders the link only when both href and linkLabel are set', () => {
    const withLink = mount(I9kAnnouncementBar, {
      props: { ...base, href: '/courses/git', linkLabel: 'See the course' },
      slots: { default: 'Live' },
    });
    const link = withLink.get('a');
    expect(link.attributes('href')).toBe('/courses/git');
    expect(link.text()).toBe('See the course');

    expect(
      mount(I9kAnnouncementBar, { props: { ...base, href: '/x' }, slots: { default: 'Live' } })
        .find('a')
        .exists(),
    ).toBe(false);
    expect(
      mount(I9kAnnouncementBar, { props: { ...base, linkLabel: 'Go' }, slots: { default: 'Live' } })
        .find('a')
        .exists(),
    ).toBe(false);
  });

  it('renders the link through a link component when given', () => {
    const RouterLinkStub = {
      props: ['to'],
      template: '<a class="stub" :href="to"><slot /></a>',
    };
    const wrapper = mount(I9kAnnouncementBar, {
      props: { ...base, href: '/courses', linkLabel: 'Courses', linkComponent: RouterLinkStub },
      slots: { default: 'Live' },
    });
    const link = wrapper.get('a.stub');
    expect(link.attributes('href')).toBe('/courses');
    expect(link.text()).toBe('Courses');
  });

  it('emits close from a button named by closeLabel', async () => {
    const wrapper = mount(I9kAnnouncementBar, { props: base, slots: { default: 'Live' } });
    const button = wrapper.get('button');
    expect(button.attributes('aria-label')).toBe('Close announcement');
    expect(button.attributes('type')).toBe('button');
    await button.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('stays rendered after close, leaving hiding to the consumer', async () => {
    const wrapper = mount(I9kAnnouncementBar, { props: base, slots: { default: 'Live' } });
    await wrapper.get('button').trigger('click');
    expect(wrapper.find('aside').exists()).toBe(true);
  });

  it('renders no close button when not dismissible', () => {
    const wrapper = mount(I9kAnnouncementBar, {
      props: { dismissible: false },
      slots: { default: 'Preview' },
    });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('server-renders without inline style attributes', async () => {
    const app = createSSRApp({
      render: () =>
        h(I9kAnnouncementBar, { ...base, href: '/x', linkLabel: 'Go' }, { default: () => 'Live' }),
    });
    const html = await renderToString(app);
    expect(html).toContain('Live');
    expect(html).not.toMatch(/\sstyle="/);
  });
});
