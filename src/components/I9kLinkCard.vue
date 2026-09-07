<script setup lang="ts">
import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    name: string;
    url: string;
    description: string;
    image?: string | null;
    badge?: string | null;
    showImage?: boolean;
    arrow?: boolean;
    arrowLabel?: string;
    size?: I9kComponentSize;
  }>(),
  { image: null, badge: null, showImage: true, arrow: false, arrowLabel: '↗', size: 'md' },
);
defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <a
    class="surface surface--interactive link-card i9k-link-card"
    :class="`i9k-link-card--${size}`"
    :href="url"
    target="_blank"
    rel="noopener"
    @click="$emit('click', $event)"
  >
    <div v-if="badge || arrow" class="link-card-meta i9k-link-card__meta">
      <span v-if="badge" class="badge badge--solid link-card-badge i9k-link-card__badge">{{
        badge
      }}</span>
      <span v-if="arrow" class="link-card-arrow i9k-link-card__arrow" aria-hidden="true">{{
        arrowLabel
      }}</span>
    </div>
    <div v-if="showImage && image" class="link-card-image i9k-link-card__image">
      <img :src="image" :alt="name" width="60" height="60" loading="lazy" />
    </div>
    <div class="link-card-body i9k-link-card__body">
      <h3 class="link-card-name i9k-link-card__name">{{ name }}</h3>
      <p class="link-card-description i9k-link-card__description">{{ description }}</p>
    </div>
  </a>
</template>

<style scoped>
.i9k-link-card {
  --i9k-link-card-padding: var(--spacing-11);
  --i9k-link-card-image-size: 3.75rem;
  --i9k-link-card-name-size: 1.05rem;
  --i9k-link-card-description-size: 0.95rem;

  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
  backdrop-filter: none;
  cursor: pointer;
  transition: var(--transition);
}

.i9k-link-card:hover {
  transform: translateY(var(--lift));
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.i9k-link-card--sm {
  --i9k-link-card-padding: var(--spacing-8);
  --i9k-link-card-image-size: 3rem;
  --i9k-link-card-name-size: 0.95rem;
  --i9k-link-card-description-size: 0.875rem;
}

.i9k-link-card--lg {
  --i9k-link-card-padding: var(--spacing-13);
  --i9k-link-card-image-size: 4.5rem;
  --i9k-link-card-name-size: 1.125rem;
  --i9k-link-card-description-size: 1rem;
}

.link-card {
  position: relative;
  display: block;
  padding: var(--i9k-link-card-padding);
  color: var(--theme-text-color);
  text-decoration: none;
  font-weight: normal;
}
.link-card:hover .link-card-name,
.link-card:hover .link-card-arrow {
  color: var(--primary-text-color);
}
.link-card:hover .link-card-arrow {
  opacity: 1;
  transform: translate(1px, -1px);
}
.link-card:hover .link-card-arrow:where([dir='rtl'] *) {
  transform: translate(-1px, -1px) scaleX(-1);
}
.link-card-meta {
  position: absolute;
  top: var(--spacing-6);
  inset-inline-end: var(--spacing-6);
  display: flex;
  align-items: center;
  gap: var(--spacing-5);
}
.i9k-link-card__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-5);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: var(--primary-color);
  color: var(--on-primary-color);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  white-space: nowrap;
  transition: var(--transition);
}
.link-card-image {
  width: var(--i9k-link-card-image-size);
  height: var(--i9k-link-card-image-size);
  margin-bottom: var(--spacing-5);
  padding: 2px;
  border-radius: var(--radius-sm);
}
.link-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.link-card-name {
  margin: 0 0 var(--spacing-4);
  font-size: var(--i9k-link-card-name-size);
  font-weight: 700;
  transition: var(--transition);
}
.link-card-description {
  margin: 0;
  color: var(--text-color-light);
  font-size: var(--i9k-link-card-description-size);
  line-height: 1.55;
}
.link-card-arrow {
  flex: none;
  line-height: 1;
  opacity: 0.3;
  transition: var(--transition);
}
.link-card-arrow:where([dir='rtl'] *) {
  transform: scaleX(-1);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-link-card,
  .link-card-name,
  .link-card-arrow {
    transition: none;
  }

  .i9k-link-card:hover,
  .link-card:hover .link-card-arrow {
    transform: none;
  }

  .link-card:hover .link-card-arrow:where([dir='rtl'] *) {
    transform: scaleX(-1);
  }
}
</style>
