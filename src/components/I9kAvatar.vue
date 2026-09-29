<script setup lang="ts">
import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    size?: I9kComponentSize;
  }>(),
  { src: null, alt: '', size: 'md' },
);
</script>

<template>
  <span :class="['i9k-avatar', `i9k-avatar--${size}`]">
    <img v-if="src" class="i9k-avatar__image" :src="src" :alt="alt" decoding="async" />
    <slot v-else />
  </span>
</template>

<style scoped>
/* The diameter follows the shared control scale, so an avatar sits level with
   the buttons and switchers of the same size in a bar. */
.i9k-avatar {
  --i9k-avatar-size: var(--control-height-md);

  display: inline-grid;
  flex: none;
  overflow: hidden;
  width: var(--i9k-avatar-size);
  height: var(--i9k-avatar-size);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  background: var(--surface-color);
  color: var(--theme-text-color);
  font-size: calc(var(--i9k-avatar-size) * 0.4);
  font-weight: 600;
  line-height: 1;
  place-items: center;
}

.i9k-avatar--sm {
  --i9k-avatar-size: var(--control-height-sm);
}

.i9k-avatar--lg {
  --i9k-avatar-size: var(--control-height-lg);
}

.i9k-avatar__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
