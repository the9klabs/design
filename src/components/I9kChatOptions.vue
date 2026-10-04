<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  /** Accessible name of the group, usually the question being answered. */
  label: string;
}>();

defineSlots<{ default?: () => unknown }>();

const root = ref<HTMLElement>();

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]';

// Lets the conversation hand focus to the next question's answers.
const focus = () => root.value?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

defineExpose({ focus });
</script>

<template>
  <div ref="root" class="i9k-chat-options" role="group" :aria-label="label">
    <slot />
  </div>
</template>

<style scoped>
.i9k-chat-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--spacing-4);
}
</style>
