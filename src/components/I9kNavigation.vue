<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import I9kContainer from './I9kContainer.vue';

export interface I9kNavigationLink {
  id: string;
  label: string;
  href: string;
}
const props = withDefaults(
  defineProps<{
    links: I9kNavigationLink[];
    brandHref?: string;
    brandLabel?: string;
    compactAt?: number;
    expandAt?: number;
    linkComponent?: string | object | null;
  }>(),
  { brandHref: '/', brandLabel: 'Home', compactAt: 72, expandAt: 24, linkComponent: null },
);
defineEmits<{ navigate: [link: I9kNavigationLink, event: MouseEvent] }>();
const isScrolled = ref(false);
const isCompact = ref(false);
const brandHref = computed(() => props.brandHref);
// Matches I9kLanguageSwitcher: without a link component the header stays plain
// anchors, so a router-less consumer needs no extra prop.
const tag = computed(() => props.linkComponent ?? 'a');
const handleScroll = () => {
  const offset = window.scrollY;
  isScrolled.value = offset > 0;
  if (offset > props.compactAt) isCompact.value = true;
  else if (offset < props.expandAt) isCompact.value = false;
};
onMounted(() => {
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
});
onUnmounted(() => window.removeEventListener('scroll', handleScroll));
</script>
<template>
  <header class="navigation" :class="{ 'is-scrolled': isScrolled }">
    <I9kContainer as="nav" class="navigation__inner" :aria-label="brandLabel">
      <component
        :is="tag"
        class="navigation__brand"
        :to="linkComponent ? brandHref : undefined"
        :href="linkComponent ? undefined : brandHref"
        :aria-label="brandLabel"
        ><slot name="brand" :compact="isCompact"
      /></component>
      <div class="navigation__end">
        <ul class="navigation__menu">
          <li v-for="link in links" :key="link.id">
            <component
              :is="tag"
              class="navigation__link"
              :to="linkComponent ? link.href : undefined"
              :href="linkComponent ? undefined : link.href"
              @click="$emit('navigate', link, $event)"
              >{{ link.label }}</component
            >
          </li>
        </ul>
        <div class="navigation__actions"><slot name="actions" :compact="isCompact" /></div>
      </div>
    </I9kContainer>
  </header>
</template>
<style scoped>
.navigation {
  position: sticky;
  top: 0;
  z-index: 100;
  transition:
    background 0.3s ease,
    box-shadow 0.3s ease;
}
.navigation.is-scrolled {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  box-shadow: var(--shadow-sm);
}
/* The bar is an I9kContainer, so it sits in the shared page column and its
   brand starts where the page's headings do. */
.navigation__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: var(--spacing-8);
}
/* Pulled back by its own padding so the wordmark, not its hover box, lines up
   with the column's edge. */
.navigation__brand {
  padding: var(--spacing-4);
  margin-inline-start: calc(var(--spacing-4) * -1);
  color: inherit;
  text-decoration: none;
}
.navigation__end,
.navigation__menu,
.navigation__actions {
  display: flex;
  align-items: center;
}
.navigation__end {
  gap: var(--spacing-6);
}
.navigation__menu {
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.navigation__link {
  display: block;
  padding: var(--spacing-5);
  color: var(--theme-text-color);
  text-decoration: none;
  transition: color 0.2s ease;
}
.navigation__link:hover,
.navigation__link:focus-visible {
  color: var(--primary-text-color);
}
/* A router link marks its own active route: vue-router adds router-link-active
   for the whole branch and aria-current="page" only on an exact match, so the
   header highlights a section while a nested page inside it is open. Plain
   anchors match neither and are unaffected. */
.navigation__link.router-link-active,
.navigation__link[aria-current='page'] {
  color: var(--primary-text-color);
}
@media (max-width: 768px) {
  .navigation__inner {
    padding-block: var(--spacing-6);
  }
  .navigation__menu {
    display: none;
  }
}
</style>
