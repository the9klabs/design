import { ref } from 'vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import I9kBrandWordmark from '../src/components/I9kBrandWordmark.vue';
import I9kFooter from '../src/components/I9kFooter.vue';
import I9kLanguageSwitcher from '../src/components/I9kLanguageSwitcher.vue';
import I9kNavigation from '../src/components/I9kNavigation.vue';
import I9kSocialLinks from '../src/components/I9kSocialLinks.vue';
import I9kThemeSwitcher from '../src/components/I9kThemeSwitcher.vue';

const meta = { title: 'Components/Portable components' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const socialItems = [
  { name: 'GitHub', url: 'https://github.com/ismail9k' },
  { name: 'Instagram', url: 'https://instagram.com/ismail9k' },
];

export const ThemeSwitcher: Story = {
  render: () => ({
    components: { I9kThemeSwitcher },
    setup: () => ({ dark: ref(false) }),
    template: '<I9kThemeSwitcher v-model="dark" />',
  }),
};
export const BrandWordmark: Story = {
  render: () => ({
    components: { I9kBrandWordmark },
    setup: () => ({ compact: ref(false) }),
    template:
      '<div class="cluster"><I9kBrandWordmark :compact="compact" /><button class="btn btn--default" @click="compact = !compact">Toggle compact</button></div>',
  }),
};
export const LanguageSwitcher: Story = {
  render: () => ({
    components: { I9kLanguageSwitcher },
    template: '<I9kLanguageSwitcher label="العربية" href="/ar" hreflang="ar" />',
  }),
};
export const SocialLinks: Story = {
  render: () => ({
    components: { I9kSocialLinks },
    setup: () => ({ socialItems }),
    template: '<I9kSocialLinks :items="socialItems" labels />',
  }),
};
export const Footer: Story = {
  render: () => ({
    components: { I9kFooter },
    setup: () => ({ socialItems }),
    template:
      '<I9kFooter :social-links="socialItems" social-labels tagline="AI changes the tools. Engineering judgment still matters." />',
  }),
};
export const FooterWithColumns: Story = {
  render: () => ({
    components: { I9kFooter, I9kBrandWordmark, I9kLanguageSwitcher },
    setup: () => ({
      socialItems,
      columns: [
        {
          id: 'explore',
          title: 'Explore',
          links: [
            { id: 'blog', label: 'Blog', href: '#blog' },
            { id: 'talks', label: 'Talks', href: '#talks' },
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
      ],
    }),
    template:
      '<I9kFooter :columns="columns" :social-links="socialItems" tagline="AI changes the tools. Engineering judgment still matters." copyright="© 2026 Ismail9k" brand-label="Ismail9k"><template #brand><I9kBrandWordmark /></template><template #utilities><I9kLanguageSwitcher label="العربية" code="ar" href="#ar" /></template></I9kFooter>',
  }),
};
export const Navigation: Story = {
  render: () => ({
    components: { I9kNavigation, I9kBrandWordmark, I9kThemeSwitcher },
    setup: () => ({
      links: [
        { id: 'blog', label: 'Blog', href: '#blog' },
        { id: 'projects', label: 'Projects', href: '#projects' },
      ],
      dark: ref(false),
    }),
    template:
      '<I9kNavigation :links="links" brand-label="Ismail9k"><template #brand="{ compact }"><I9kBrandWordmark :compact="compact" /></template><template #actions><I9kThemeSwitcher v-model="dark" /></template></I9kNavigation>',
  }),
};
