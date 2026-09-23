import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import I9kFooter from '../src/components/I9kFooter.vue';
import type { I9kFooterColumn } from '../src/types/components';

const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/ismail9k', icon: 'github' as const },
];

const columns: I9kFooterColumn[] = [
  {
    id: 'explore',
    title: 'Explore',
    links: [
      { id: 'blog', label: 'Blog', href: '/blog' },
      { id: 'talks', label: 'Talks', href: '/talks' },
    ],
  },
  {
    id: 'more',
    title: 'More from me',
    links: [
      {
        id: 'school',
        label: '9k School',
        href: 'https://9k.school',
        external: true,
        featured: true,
        emoji: '🎓',
      },
      { id: 'email', label: 'Email me', href: 'mailto:hello@ismail9k.com' },
    ],
  },
];

const RouterLinkStub = defineComponent({
  props: { to: { type: [String, Object], required: true } },
  template: '<a data-router-link><slot /></a>',
});

describe('I9kFooter', () => {
  describe('without columns', () => {
    it('keeps the centred social row and tagline, with no link navigation', () => {
      const wrapper = mount(I9kFooter, { props: { socialLinks, tagline: 'Built with care.' } });

      expect(wrapper.get('footer').classes()).not.toContain('i9k-footer--structured');
      expect(wrapper.find('.footer-socials').exists()).toBe(true);
      expect(wrapper.get('.footer-tagline').text()).toBe('Built with care.');
      expect(wrapper.find('nav').exists()).toBe(false);
    });

    it('keeps the centred stack in the shared page column', () => {
      const wrapper = mount(I9kFooter, { props: { socialLinks, tagline: 'Built with care.' } });

      expect(wrapper.find('.i9k-container .footer-tagline').exists()).toBe(true);
    });

    it('lets the default slot replace the tagline', () => {
      const wrapper = mount(I9kFooter, {
        props: { tagline: 'Hidden' },
        slots: { default: '<p class="custom">Custom</p>' },
      });

      expect(wrapper.find('.footer-tagline').exists()).toBe(false);
      expect(wrapper.get('.custom').text()).toBe('Custom');
    });

    it('renders the utilities slot after the tagline', () => {
      const wrapper = mount(I9kFooter, {
        props: { tagline: 'Built with care.' },
        slots: { utilities: '<button class="util">Markdown</button>' },
      });

      expect(wrapper.get('.i9k-footer__utilities .util').text()).toBe('Markdown');
    });

    it('switches to the multi-column layout when a brand slot is added after mount', async () => {
      const showBrand = ref(false);
      const wrapper = mount(
        defineComponent({
          components: { I9kFooter },
          setup: () => ({ showBrand }),
          template: `<I9kFooter tagline="Built with care."
            ><template v-if="showBrand" #brand><b>Ismail9k_</b></template></I9kFooter
          >`,
        }),
      );
      expect(wrapper.get('footer').classes()).not.toContain('i9k-footer--structured');

      showBrand.value = true;
      await nextTick();

      expect(wrapper.get('footer').classes()).toContain('i9k-footer--structured');
      expect(wrapper.get('.i9k-footer__brand-link').text()).toBe('Ismail9k_');
    });
  });

  describe('with columns', () => {
    it('renders a labelled navigation with one heading and list per column', () => {
      const wrapper = mount(I9kFooter, { props: { columns, navLabel: 'Site links' } });
      const nav = wrapper.get('nav');

      expect(wrapper.get('footer').classes()).toContain('i9k-footer--structured');
      expect(nav.attributes('aria-label')).toBe('Site links');
      expect(nav.findAll('h2').map((heading) => heading.text())).toEqual([
        'Explore',
        'More from me',
      ]);
      expect(nav.findAll('ul').map((list) => list.findAll('li').length)).toEqual([2, 2]);
    });

    it('lays the columns out in the shared page column', () => {
      const wrapper = mount(I9kFooter, { props: { columns, socialLinks } });

      expect(wrapper.find('.i9k-container nav').exists()).toBe(true);
      expect(wrapper.find('.i9k-container .i9k-footer__bottom').exists()).toBe(true);
    });

    it('opens external links in a new tab and marks them with a hidden arrow', () => {
      const wrapper = mount(I9kFooter, { props: { columns } });
      const school = wrapper.findAll('.i9k-footer__link')[2];

      expect(school.attributes()).toMatchObject({
        href: 'https://9k.school',
        target: '_blank',
        rel: 'noopener',
      });
      expect(school.get('.i9k-footer__external').attributes('aria-hidden')).toBe('true');
    });

    it('emphasises a featured link and hides its emoji from assistive technology', () => {
      const wrapper = mount(I9kFooter, { props: { columns } });
      const school = wrapper.findAll('.i9k-footer__link')[2];

      expect(school.classes()).toContain('i9k-footer__link--featured');
      expect(school.get('.i9k-footer__emoji').attributes('aria-hidden')).toBe('true');
      expect(school.text()).toContain('9k School');
    });

    it('routes only site-relative links through the link component', () => {
      const wrapper = mount(I9kFooter, { props: { columns, linkComponent: RouterLinkStub } });

      expect(wrapper.findAllComponents(RouterLinkStub).map((link) => link.props('to'))).toEqual([
        '/blog',
        '/talks',
      ]);
      const [school, email] = wrapper.findAll('.i9k-footer__link').slice(2);
      expect(school.attributes('href')).toBe('https://9k.school');
      expect(email.attributes('href')).toBe('mailto:hello@ismail9k.com');
      expect(email.attributes('target')).toBeUndefined();
    });

    it('renders a protocol-relative href as a plain anchor, not a routed link', () => {
      const wrapper = mount(I9kFooter, {
        props: {
          columns: [
            {
              id: 'files',
              title: 'Files',
              links: [{ id: 'guide', label: 'Guide', href: '//cdn.example.com/guide.pdf' }],
            },
          ],
          linkComponent: RouterLinkStub,
        },
      });

      expect(wrapper.findAllComponents(RouterLinkStub)).toHaveLength(0);
      expect(wrapper.get('.i9k-footer__link').attributes('href')).toBe(
        '//cdn.example.com/guide.pdf',
      );
    });

    it('sizes the grid to the column count, at most four across', () => {
      const column = (id: string): I9kFooterColumn => ({ id, title: id, links: [] });
      const count = (length: number) =>
        mount(I9kFooter, {
          props: { columns: Array.from({ length }, (_, index) => column(`c${index}`)) },
        })
          .get('nav')
          .attributes('data-columns');

      expect(count(1)).toBe('1');
      expect(count(3)).toBe('3');
      expect(count(6)).toBe('4');
    });

    it('carries the column count without an inline style, so a style-src CSP allows it', () => {
      const wrapper = mount(I9kFooter, { props: { columns } });

      expect(wrapper.get('nav').attributes('style')).toBeUndefined();
      expect(wrapper.html()).not.toContain('style=');
    });

    it('emits navigate with the clicked link', async () => {
      const wrapper = mount(I9kFooter, { props: { columns } });
      await wrapper.findAll('.i9k-footer__link')[1].trigger('click');

      expect(wrapper.emitted('navigate')?.[0]?.[0]).toEqual(columns[0].links[1]);
    });

    it('wraps the brand slot in a home link beside the tagline and copyright', () => {
      const wrapper = mount(I9kFooter, {
        props: {
          columns,
          tagline: 'Built with care.',
          copyright: '© 2026 Ismail9k',
          brandHref: '/en',
          brandLabel: 'Ismail9k, Home',
        },
        slots: { brand: '<b>Ismail9k_</b>' },
      });
      const brand = wrapper.get('.i9k-footer__brand-link');

      expect(brand.attributes()).toMatchObject({ href: '/en', 'aria-label': 'Ismail9k, Home' });
      expect(brand.text()).toBe('Ismail9k_');
      expect(wrapper.get('.i9k-footer__brand .footer-tagline').text()).toBe('Built with care.');
      expect(wrapper.get('.i9k-footer__copyright').text()).toBe('© 2026 Ismail9k');
    });

    it('puts the social row and utilities slot in the bottom bar', () => {
      const wrapper = mount(I9kFooter, {
        props: {
          columns,
          socialLinks,
          followLabel: (platform: string) => `Follow on ${platform}!`,
        },
        slots: { utilities: '<button class="util">AR</button>' },
      });
      const bottom = wrapper.get('.i9k-footer__bottom');

      expect(bottom.get('.social-link').attributes('aria-label')).toBe('Follow on GitHub!');
      expect(bottom.get('.i9k-footer__utilities .util').text()).toBe('AR');
    });
  });
});
