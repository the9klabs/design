<script setup lang="ts">
import { nextTick, ref } from 'vue';

import type { I9kNinoExpression } from '../types/components';

import I9kNino from './I9kNino.vue';
import I9kPanel from './I9kPanel.vue';

withDefaults(
  defineProps<{
    /** Accessible name of the conversation log; translate it. */
    logLabel: string;
    /** The bot's name, shown next to its avatar. */
    title?: string;
    /** Nino's face in the header, e.g. 'thinking' while the bot types. */
    expression?: I9kNinoExpression;
    /** Lift the log's height cap so a final result is never clipped inside it. */
    expanded?: boolean;
  }>(),
  { title: '', expression: 'idle', expanded: false },
);

defineSlots<{
  avatar?: () => unknown;
  actions?: () => unknown;
  default?: () => unknown;
  footer?: () => unknown;
}>();

const log = ref<HTMLElement>();

// The log scrolls on its own, so new messages are brought into view here
// rather than by scrolling the page.
const scrollToEnd = async () => {
  await nextTick();
  log.value?.scrollTo({ top: log.value.scrollHeight, behavior: 'smooth' });
};

defineExpose({ scrollToEnd });
</script>

<template>
  <I9kPanel class="i9k-chat" variant="feature">
    <header class="i9k-chat__header">
      <slot name="avatar">
        <I9kNino :expression="expression" size="sm" />
      </slot>
      <strong v-if="title" class="i9k-chat__title">{{ title }}</strong>
      <div v-if="$slots.actions" class="i9k-chat__actions">
        <slot name="actions" />
      </div>
    </header>

    <div
      ref="log"
      class="i9k-chat__log"
      :class="{ 'i9k-chat__log--expanded': expanded }"
      role="log"
      aria-live="polite"
      :aria-label="logLabel"
    >
      <slot />
    </div>

    <footer v-if="$slots.footer" class="i9k-chat__footer">
      <slot name="footer" />
    </footer>
  </I9kPanel>
</template>

<style scoped>
.i9k-chat {
  --i9k-chat-gutter: var(--spacing-7);

  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.i9k-chat__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-5) var(--i9k-chat-gutter);
  border-block-end: 1px solid var(--border-color);
}

.i9k-chat__title {
  color: var(--text-color);
}

.i9k-chat__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-inline-start: auto;
}

.i9k-chat__log {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  min-height: 12rem;
  max-height: min(60vh, 34rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--i9k-chat-gutter);
}

.i9k-chat__log--expanded {
  max-height: none;
}

.i9k-chat__footer {
  padding: var(--i9k-chat-gutter);
  border-block-start: 1px solid var(--border-color);
  background: var(--surface-sunken-color);
}

@media (max-width: 40rem) {
  .i9k-chat {
    --i9k-chat-gutter: var(--spacing-5);
  }
}
</style>
