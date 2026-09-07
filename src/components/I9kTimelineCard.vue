<script setup lang="ts">
import { computed } from 'vue';

import type { I9kComponentSize } from '../types/components';

const props = withDefaults(
  defineProps<{
    date: string | Date;
    linked?: boolean;
    locale?: string;
    size?: I9kComponentSize;
  }>(),
  { linked: false, locale: 'en', size: 'md' },
);
const formattedDate = computed(() =>
  new Intl.DateTimeFormat(props.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(props.date instanceof Date ? props.date : new Date(`${props.date}T00:00:00Z`)),
);
</script>

<template>
  <div :class="['timeline', 'i9k-timeline-card', `i9k-timeline-card--${size}`]">
    <p class="timeline__time i9k-timeline-card__time">{{ formattedDate }}</p>
    <div class="timeline__rail i9k-timeline-card__rail" />
    <div
      class="timeline__card i9k-timeline-card__card"
      :class="{
        'timeline__card--linked': linked,
        'i9k-timeline-card__card--linked': linked,
      }"
    >
      <div class="timeline__main i9k-timeline-card__main">
        <h3 v-if="$slots.title" class="i9k-timeline-card__title"><slot name="title" /></h3>
        <slot />
      </div>
      <div v-if="$slots.thumbnail" class="i9k-timeline-card__thumbnail">
        <slot name="thumbnail" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.i9k-timeline-card {
  --i9k-timeline-gap: var(--spacing-10);
  --i9k-timeline-card-padding: var(--spacing-10);
  --i9k-timeline-time-width: 6.25rem;
  --i9k-timeline-time-size: 0.75rem;
  --i9k-timeline-thumb-width: 10rem;
  --i9k-timeline-thumb-height: 6.25rem;

  position: relative;
  display: flex;
  gap: var(--i9k-timeline-gap);
  transition: var(--transition);
}

.i9k-timeline-card--sm {
  --i9k-timeline-gap: var(--spacing-7);
  --i9k-timeline-card-padding: var(--spacing-7);
  --i9k-timeline-time-width: 5.5rem;
  --i9k-timeline-time-size: 0.6875rem;
  --i9k-timeline-thumb-width: 8rem;
  --i9k-timeline-thumb-height: 5rem;
}

.i9k-timeline-card--lg {
  --i9k-timeline-gap: var(--spacing-13);
  --i9k-timeline-card-padding: var(--spacing-13);
  --i9k-timeline-time-width: 7rem;
  --i9k-timeline-time-size: 0.875rem;
  --i9k-timeline-thumb-width: 12rem;
  --i9k-timeline-thumb-height: 7.5rem;
}

.i9k-timeline-card__time {
  width: var(--i9k-timeline-time-width);
  flex-shrink: 0;
  margin-block-start: var(--spacing-10);
  margin-inline-end: var(--spacing-7);
  color: var(--dark-gray-color);
  font-size: var(--i9k-timeline-time-size);
  font-weight: 700;
  text-align: end;
  white-space: nowrap;
}

.i9k-timeline-card__rail {
  position: relative;
  transform: translateX(-5px);
}

.i9k-timeline-card__rail:where([dir='rtl'] *) {
  transform: translateX(5px);
}

.i9k-timeline-card__rail::before {
  position: absolute;
  top: var(--spacing-10);
  inset-inline-start: 0;
  display: block;
  width: 6px;
  height: 6px;
  border: 2px solid var(--dark-color-alpha-20);
  content: '';
  transform: translateY(5px);
}

.i9k-timeline-card__rail::after {
  position: absolute;
  top: var(--spacing-10);
  inset-inline-start: 4px;
  display: block;
  width: 1px;
  height: calc(100% - 10px);
  margin-inline-start: 0.5px;
  background: var(--dark-color-alpha-20);
  content: '';
  transform: translateY(15px);
}

.i9k-timeline-card__rail:where(.dark *)::before {
  border-color: var(--white-color-alpha-20);
}

.i9k-timeline-card__rail:where(.dark *)::after {
  background-color: var(--white-color-alpha-20);
}

.i9k-timeline-card__card {
  position: relative;
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: var(--component-gap-lg);
  padding: var(--i9k-timeline-card-padding);
  border-radius: 15px;
}

.i9k-timeline-card__card--linked:hover {
  background: var(--surface-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: none;
}

.i9k-timeline-card__main {
  min-width: 0;
  flex: 1;
}

.i9k-timeline-card__thumbnail {
  flex-shrink: 0;
}

.i9k-timeline-card__title {
  margin-top: 0;
  color: var(--theme-text-color);
}

.i9k-timeline-card__title :slotted(a) {
  color: inherit;
  text-decoration: none;
  text-decoration-color: var(--accent-color);
  transition: var(--transition);
}

.i9k-timeline-card__card--linked .i9k-timeline-card__title :slotted(a)::after {
  position: absolute;
  inset: 0;
  content: '';
}

.i9k-timeline-card__card--linked:hover .i9k-timeline-card__title :slotted(a) {
  text-decoration: underline;
  text-decoration-color: var(--accent-color);
}

.i9k-timeline-card__thumbnail :slotted(img) {
  display: block;
  width: var(--i9k-timeline-thumb-width);
  height: var(--i9k-timeline-thumb-height);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  object-fit: cover;
}

@media screen and (max-width: 991px) {
  .i9k-timeline-card {
    gap: var(--spacing-7);
  }

  .i9k-timeline-card__time {
    position: absolute;
    top: var(--spacing-15);
    inset-inline-start: 0;
    z-index: 1;
    width: auto;
    margin: 0;
    padding: 0 var(--spacing-5);
    background: var(--surface-color);
    color: var(--primary-text-color);
    transform: rotate(90deg);
    transform-origin: left;
    backdrop-filter: none;
  }

  .i9k-timeline-card__time:where([dir='rtl'] *) {
    transform-origin: right;
  }

  .i9k-timeline-card__card {
    padding: var(--spacing-7);
  }
}

@media (max-width: 600px) {
  .i9k-timeline-card__thumbnail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-timeline-card,
  .i9k-timeline-card__title :slotted(a) {
    transition: none;
  }
}
</style>
