<script setup lang="ts">
import { computed, useSlots } from 'vue';

import type { I9kFooterColumn, I9kFooterLink } from '../types/components';
import I9kSocialLinks, { type I9kSocialLink } from './I9kSocialLinks.vue';

const props = withDefaults(
  defineProps<{
    tagline?: string | null;
    socialLinks?: I9kSocialLink[];
    socialLabels?: boolean;
    followLabel?: (platform: string) => string;
    columns?: I9kFooterColumn[];
    copyright?: string | null;
    brandHref?: string;
    brandLabel?: string;
    navLabel?: string;
    linkComponent?: string | object | null;
  }>(),
  {
    tagline: null,
    socialLinks: () => [],
    socialLabels: false,
    followLabel: undefined,
    columns: () => [],
    copyright: null,
    brandHref: '/',
    brandLabel: 'Home',
    navLabel: 'Footer',
    linkComponent: null,
  },
);
defineEmits<{
  socialClick: [item: I9kSocialLink, event: MouseEvent];
  navigate: [link: I9kFooterLink, event: MouseEvent];
}>();

const slots = useSlots();
// Columns or a brand switch to the multi-column layout. Without either the
// footer keeps its original centred stack, so existing consumers render as
// they always have.
const structured = computed(() => props.columns.length > 0 || Boolean(slots.brand));
const tag = computed(() => props.linkComponent ?? 'a');

// A router link component cannot resolve `https:` or `mailto:` targets, so only
// site-relative hrefs are handed to it.
const routed = (link: I9kFooterLink) =>
  Boolean(props.linkComponent) && !link.external && link.href.startsWith('/');
</script>
<template>
  <footer class="footer i9k-footer" :class="{ 'i9k-footer--structured': structured }">
    <template v-if="structured">
      <div class="i9k-footer__top">
        <div class="i9k-footer__brand">
          <component
            :is="tag"
            v-if="$slots.brand"
            class="i9k-footer__brand-link"
            :to="linkComponent ? brandHref : undefined"
            :href="linkComponent ? undefined : brandHref"
            :aria-label="brandLabel"
            ><slot name="brand"
          /></component>
          <slot
            ><p v-if="tagline" class="footer-tagline">{{ tagline }}</p></slot
          >
          <p v-if="copyright" class="i9k-footer__copyright">{{ copyright }}</p>
        </div>
        <nav v-if="columns.length" class="i9k-footer__columns" :aria-label="navLabel">
          <div v-for="column in columns" :key="column.id" class="i9k-footer__column">
            <h2 class="i9k-footer__heading">{{ column.title }}</h2>
            <ul class="i9k-footer__list">
              <li v-for="link in column.links" :key="link.id">
                <component
                  :is="routed(link) ? tag : 'a'"
                  class="i9k-footer__link"
                  :class="{ 'i9k-footer__link--featured': link.featured }"
                  :to="routed(link) ? link.href : undefined"
                  :href="routed(link) ? undefined : link.href"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener' : undefined"
                  @click="$emit('navigate', link, $event)"
                  ><span v-if="link.emoji" class="i9k-footer__emoji" aria-hidden="true">{{
                    link.emoji
                  }}</span
                  >{{ link.label
                  }}<span v-if="link.external" class="i9k-footer__external" aria-hidden="true"
                    >↗</span
                  ></component
                >
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div v-if="socialLinks.length || $slots.utilities" class="i9k-footer__bottom">
        <I9kSocialLinks
          v-if="socialLinks.length"
          class="footer-socials"
          :items="socialLinks"
          :labels="socialLabels"
          :follow-label="followLabel"
          @click="(item, event) => $emit('socialClick', item, event)"
          ><template #icon="slotProps"><slot name="social-icon" v-bind="slotProps" /></template
        ></I9kSocialLinks>
        <div v-if="$slots.utilities" class="i9k-footer__utilities"><slot name="utilities" /></div>
      </div>
    </template>
    <template v-else>
      <I9kSocialLinks
        v-if="socialLinks.length"
        class="footer-socials"
        :items="socialLinks"
        :labels="socialLabels"
        :follow-label="followLabel"
        @click="(item, event) => $emit('socialClick', item, event)"
        ><template #icon="slotProps"
          ><slot name="social-icon" v-bind="slotProps" /></template></I9kSocialLinks
      ><slot
        ><p v-if="tagline" class="footer-tagline">{{ tagline }}</p></slot
      >
      <div v-if="$slots.utilities" class="i9k-footer__utilities"><slot name="utilities" /></div>
    </template>
  </footer>
</template>
<style scoped>
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-8);
  padding: var(--spacing-10);
  margin-bottom: var(--spacing-5);
}
.footer-socials {
  justify-content: center;
}
.footer-tagline {
  max-width: 40ch;
  margin: 0;
  color: var(--text-color-light);
  font-size: 0.85rem;
  text-align: center;
}
.i9k-footer__utilities {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

/* Multi-column layout. The measure matches I9kPageContainer, so the footer
   lines up with the page content above it. */
.i9k-footer--structured {
  --i9k-footer-gutter: var(--spacing-13);

  display: block;
  width: 1000px;
  max-width: 100%;
  margin: 0 auto;
  padding: var(--spacing-15) var(--i9k-footer-gutter) var(--spacing-10);
}
.i9k-footer--structured .footer-socials {
  justify-content: flex-start;
}
.i9k-footer--structured .footer-tagline {
  line-height: 1.55;
  text-align: start;
}
.i9k-footer__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.5fr);
  gap: var(--spacing-13);
  padding-block-end: var(--spacing-13);
}
.i9k-footer__brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-5);
}
.i9k-footer__brand-link {
  color: var(--theme-text-color);
  text-decoration: none;
}
.i9k-footer__copyright {
  margin: 0;
  color: var(--text-color-light);
  font-size: 0.8rem;
}
.i9k-footer__columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-10);
}
.i9k-footer__heading {
  margin: 0 0 var(--spacing-7);
  color: var(--text-color-light);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.4;
}
.i9k-footer__list {
  display: grid;
  gap: var(--spacing-6);
  margin: 0;
  padding: 0;
  list-style: none;
}
/* Inline, not flex: a label that wraps keeps its arrow at the end of the text
   instead of centred beside the whole block. */
.i9k-footer__link {
  color: var(--theme-text-color);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}
.i9k-footer__link:hover,
.i9k-footer__link:focus-visible {
  color: var(--primary-text-color);
}
.i9k-footer__link--featured {
  color: var(--primary-text-color);
  font-weight: 700;
}
.i9k-footer__emoji {
  margin-inline-end: var(--spacing-3);
}
.i9k-footer__external {
  display: inline-block;
  margin-inline-start: var(--spacing-2);
  color: var(--text-color-light);
  font-size: 0.8em;
}
/* ↗ points toward the end of the line; mirrored, it still does in Arabic. */
.i9k-footer__external:dir(rtl) {
  transform: scaleX(-1);
}
.i9k-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-8);
  padding-block-start: var(--spacing-10);
  border-top: 1px solid var(--border-color);
}
@media (max-width: 768px) {
  .i9k-footer--structured {
    --i9k-footer-gutter: var(--spacing-8);
  }
  .i9k-footer__top {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-11);
  }
  .i9k-footer__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
