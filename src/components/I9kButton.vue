<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import type { I9kComponentSize } from '../types/components';

type Variant = 'default' | 'primary' | 'link' | 'filter' | 'pagination' | 'page';
const props = withDefaults(
  defineProps<{
    to?: string | Record<string, unknown> | null;
    href?: string | null;
    variant?: Variant;
    size?: I9kComponentSize;
    active?: boolean;
    type?: 'button' | 'submit' | 'reset';
    linkComponent?: string | object | null;
  }>(),
  {
    to: null,
    href: null,
    variant: 'default',
    size: 'md',
    active: false,
    type: 'button',
    linkComponent: null,
  },
);
const attrs = useAttrs();
const isLink = computed(() => props.to !== null || props.href !== null);
const destination = computed(() => props.to ?? props.href ?? undefined);
const tag = computed(() => props.linkComponent ?? (isLink.value ? 'a' : 'button'));
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    :to="linkComponent && to !== null ? to : undefined"
    :href="!linkComponent && isLink ? destination : undefined"
    :type="!isLink ? type : undefined"
    :class="[
      'btn',
      `btn--${variant}`,
      'i9k-button',
      `i9k-button--${variant}`,
      `i9k-button--${size}`,
      { 'is-active': active },
    ]"
    ><slot
  /></component>
</template>

<style scoped>
.i9k-button {
  --i9k-button-height: var(--control-height-md);
  --i9k-button-padding: var(--spacing-8);
  --i9k-button-font-size: var(--control-font-size-md);
  --i9k-button-bg: var(--surface-color);
  --i9k-button-hover-bg: var(--surface-hover-color);
  --i9k-button-pressed-bg: var(--surface-sunken-color);
  --i9k-button-border: var(--control-border-color);
  --i9k-button-color: var(--theme-text-color);

  display: inline-flex;
  min-height: var(--i9k-button-height);
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: 0 var(--i9k-button-padding);
  border: 1px solid var(--i9k-button-border);
  border-radius: var(--radius-sm);
  appearance: none;
  background: var(--i9k-button-bg);
  color: var(--i9k-button-color);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--i9k-button-font-size);
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.i9k-button--sm {
  --i9k-button-height: var(--control-height-sm);
  --i9k-button-padding: var(--spacing-6);
  --i9k-button-font-size: var(--control-font-size-sm);
}

.i9k-button--lg {
  --i9k-button-height: var(--control-height-lg);
  --i9k-button-padding: var(--spacing-11);
  --i9k-button-font-size: var(--control-font-size-lg);
}

.i9k-button--default,
.i9k-button--pagination {
  background: var(--i9k-button-bg);
}

.i9k-button--primary {
  --i9k-button-bg: var(--primary-color);
  --i9k-button-hover-bg: var(--primary-hover-color);
  --i9k-button-pressed-bg: var(--primary-pressed-color);
  --i9k-button-border: transparent;
  --i9k-button-color: var(--on-primary-color);
}

.i9k-button--link {
  --i9k-button-bg: transparent;
  --i9k-button-hover-bg: transparent;
  --i9k-button-pressed-bg: transparent;
  --i9k-button-border: transparent;
  --i9k-button-color: var(--primary-text-color);

  min-height: auto;
  padding: 0;
  border: none;
  text-decoration-color: var(--accent-color);
}

.i9k-button--filter {
  border-radius: var(--radius-pill);
}

.i9k-button--page {
  width: var(--i9k-button-height);
  height: var(--i9k-button-height);
  min-height: 0;
  padding: 0;
}

.i9k-button--filter.is-active,
.i9k-button--page.is-active {
  --i9k-button-bg: var(--selected-bg-color);
  --i9k-button-hover-bg: var(--selected-hover-bg-color);
  --i9k-button-pressed-bg: var(--selected-pressed-bg-color);
  --i9k-button-border: var(--primary-text-color);
  --i9k-button-color: var(--primary-text-color);
}

.i9k-button:hover:not(:disabled, [aria-disabled='true'], [aria-busy='true']) {
  background: var(--i9k-button-hover-bg);
}

.i9k-button--link:hover:not(:disabled, [aria-disabled='true'], [aria-busy='true']) {
  text-decoration: underline;
  text-decoration-color: var(--accent-color);
}

.i9k-button:active:not(:disabled, [aria-disabled='true'], [aria-busy='true']) {
  background: var(--i9k-button-pressed-bg);
  transform: translateY(1px);
}

.i9k-button:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

.i9k-button:disabled,
.i9k-button[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Consumers pair aria-busy with disabled on native buttons while an action runs. */
.i9k-button[aria-busy='true'] {
  cursor: progress;
  opacity: 0.75;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-button {
    transition: none;
  }

  .i9k-button:active:not(:disabled, [aria-disabled='true'], [aria-busy='true']) {
    transform: none;
  }
}
</style>
