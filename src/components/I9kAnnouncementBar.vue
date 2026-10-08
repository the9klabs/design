<script setup lang="ts">
/**
 * A full-bleed bar for one short site-wide message and an optional link,
 * placed above I9kNavigation (outside it). It is stateless: the close button
 * emits `close`, and the consumer hides the bar and remembers the choice.
 */
import { computed } from 'vue';

import I9kContainer from './I9kContainer.vue';
import I9kIconButton from './I9kIconButton.vue';

const props = withDefaults(
  defineProps<{
    /** The link's destination. The link renders only when `linkLabel` is set too. */
    href?: string | null;
    /** The link's text. The link renders only when `href` is set too. */
    linkLabel?: string | null;
    /** Render the link with this component (RouterLink, NuxtLink), passing `to` instead of `href`. */
    linkComponent?: string | object | null;
    /** The close button's accessible name. Required when `dismissible`. */
    closeLabel?: string;
    /** The landmark's accessible name. */
    label?: string;
    /** `false` renders no close button, for a preview of the bar. */
    dismissible?: boolean;
  }>(),
  {
    href: null,
    linkLabel: null,
    linkComponent: null,
    closeLabel: '',
    label: 'Announcement',
    dismissible: true,
  },
);

defineEmits<{ close: [] }>();

const hasLink = computed(() => Boolean(props.href && props.linkLabel));
const tag = computed(() => props.linkComponent ?? 'a');
// Only the attribute the tag reads: an `href: undefined` falling through onto a
// link component's root would override the href it renders from `to`.
const linkAttrs = computed(() => (props.linkComponent ? { to: props.href } : { href: props.href }));
</script>

<template>
  <aside class="i9k-announcement-bar" :aria-label="label">
    <I9kContainer class="i9k-announcement-bar__inner">
      <p class="i9k-announcement-bar__message">
        <span class="i9k-announcement-bar__text"><slot /></span>
        <component :is="tag" v-if="hasLink" v-bind="linkAttrs" class="i9k-announcement-bar__link">{{
          linkLabel
        }}</component>
      </p>
      <I9kIconButton
        v-if="dismissible"
        class="i9k-announcement-bar__close"
        icon="close"
        size="sm"
        variant="ghost"
        :label="closeLabel"
        @click="$emit('close')"
      />
    </I9kContainer>
  </aside>
</template>

<style scoped>
/* Not sticky: the bar scrolls away and the sticky I9kNavigation stays. Logical
   properties only, so it mirrors under dir="rtl". The brand green and the text
   on it are the same in both themes, so the bar needs no dark-mode rule. */
.i9k-announcement-bar {
  --i9k-announcement-bar-bg: var(--primary-color);
  --i9k-announcement-bar-fg: var(--on-primary-color);

  background-color: var(--i9k-announcement-bar-bg);
  color: var(--i9k-announcement-bar-fg);
  font-size: var(--text-size-1);
  line-height: 1.5;
}

/* The close button reads theme tokens that assume the page background: its
   icon would be dark on the green in the light theme, its hover a pale grey,
   and the light theme's focus ring the green itself. Re-map them here, on the
   inner box, as I9kSection's primary variant does on its content. */
.i9k-announcement-bar__inner {
  --theme-text-color: var(--i9k-announcement-bar-fg);
  --focus-color: var(--i9k-announcement-bar-fg);
  --surface-hover-color: color-mix(in srgb, var(--i9k-announcement-bar-fg) 15%, transparent);
  --surface-sunken-color: color-mix(in srgb, var(--i9k-announcement-bar-fg) 22%, transparent);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--component-gap-md);
  padding-block: var(--spacing-3);
}

.i9k-announcement-bar__message {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-1) var(--spacing-4);
  min-width: 0;
  margin: 0;
}

.i9k-announcement-bar__link {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.i9k-announcement-bar__link:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
}

.i9k-announcement-bar__close {
  flex: none;
}

@media (forced-colors: active) {
  .i9k-announcement-bar {
    border-block-end: 1px solid CanvasText;
  }
}
</style>
