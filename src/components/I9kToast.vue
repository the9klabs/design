<!-- src/components/I9kToast.vue -->
<script setup lang="ts">
import type { I9kComponentSize } from '../types/components';

type Variant = 'info' | 'success' | 'error';

const props = withDefaults(defineProps<{ variant?: Variant; size?: I9kComponentSize }>(), {
  variant: 'info',
  size: 'md',
});
</script>

<template>
  <div
    :class="[
      'toast',
      `toast--${props.variant}`,
      'i9k-toast',
      `i9k-toast--${props.variant}`,
      `i9k-toast--${props.size}`,
    ]"
    :role="props.variant === 'error' ? 'alert' : 'status'"
  >
    <slot />
  </div>
</template>

<style scoped>
.i9k-toast {
  display: flex;
  align-items: flex-start;
  gap: var(--component-gap-md);
  padding: var(--spacing-6) var(--spacing-8);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-raised-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: none;
  font-size: var(--text-size-1);
}

.i9k-toast--sm {
  gap: var(--component-gap-sm);
  padding: var(--spacing-4) var(--spacing-6);
  font-size: 0.75rem;
}

.i9k-toast--lg {
  gap: var(--component-gap-lg);
  padding: var(--spacing-8) var(--spacing-11);
  font-size: var(--text-size-2);
}

.i9k-toast--info {
  border-color: var(--border-color);
  color: var(--text-color);
}

.i9k-toast--success {
  border-color: var(--success-color);
  background: var(--success-bg-color);
  color: var(--success-color);
}

.i9k-toast--error {
  border-color: var(--error-color);
  background: var(--error-bg-color);
  color: var(--error-color);
}
</style>
