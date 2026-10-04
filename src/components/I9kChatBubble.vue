<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Who is speaking: the bot on the start side, the user on the end side. */
    from?: 'bot' | 'user';
    /** Show the three-dot typing indicator instead of the content. */
    typing?: boolean;
    /** Accessible name of the typing indicator; translate it. */
    typingLabel?: string;
    /** Screen-reader prefix naming the speaker, e.g. "You". */
    speakerLabel?: string;
    /** Span the full width of the log, for rich content such as a result card. */
    wide?: boolean;
    /** Render the bubble as a button so the user can revisit this answer. */
    editable?: boolean;
    /** Accessible name of the editable bubble, e.g. "Change your answer to: …". */
    editLabel?: string;
  }>(),
  {
    from: 'bot',
    typing: false,
    typingLabel: 'Typing',
    speakerLabel: '',
    wide: false,
    editable: false,
    editLabel: undefined,
  },
);

const emit = defineEmits<{ edit: [] }>();

defineSlots<{
  default?: () => unknown;
  after?: () => unknown;
}>();
</script>

<template>
  <div
    :class="[
      'i9k-chat-bubble',
      `i9k-chat-bubble--${from}`,
      { 'i9k-chat-bubble--wide': wide, 'i9k-chat-bubble--editable': editable },
    ]"
  >
    <button
      v-if="editable && !typing"
      type="button"
      class="i9k-chat-bubble__body"
      :aria-label="editLabel"
      @click="emit('edit')"
    >
      <slot />
    </button>
    <div v-else class="i9k-chat-bubble__body">
      <span v-if="typing" class="i9k-chat-bubble__dots" role="status" :aria-label="typingLabel">
        <span /><span /><span />
      </span>
      <template v-else>
        <span v-if="speakerLabel" class="i9k-chat-bubble__speaker">{{ `${speakerLabel}: ` }}</span>
        <slot />
      </template>
    </div>
    <slot name="after" />
  </div>
</template>

<style scoped>
.i9k-chat-bubble {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.i9k-chat-bubble--user {
  align-items: flex-end;
}

.i9k-chat-bubble__body {
  max-width: min(85%, 34rem);
  padding: var(--spacing-5) var(--spacing-7);
  border-radius: var(--radius-lg);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.i9k-chat-bubble--wide .i9k-chat-bubble__body {
  width: 100%;
  max-width: 100%;
}

/* Logical corners: the tail sits on the speaker's side in Arabic too. */
.i9k-chat-bubble--bot .i9k-chat-bubble__body {
  border: 1px solid var(--border-color);
  border-end-start-radius: var(--radius-sm);
  background: var(--surface-raised-color);
  color: var(--text-color);
  animation: i9k-chat-bubble-in 220ms ease-out;
}

.i9k-chat-bubble--user .i9k-chat-bubble__body {
  border: 0;
  border-end-end-radius: var(--radius-sm);
  background: var(--primary-color);
  color: var(--on-primary-color);
  white-space: pre-wrap;
}

.i9k-chat-bubble--editable .i9k-chat-bubble__body {
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: var(--transition);
}

.i9k-chat-bubble--editable .i9k-chat-bubble__body:hover,
.i9k-chat-bubble--editable .i9k-chat-bubble__body:focus-visible {
  opacity: 0.82;
}

.i9k-chat-bubble__speaker {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.i9k-chat-bubble__dots {
  display: inline-flex;
  gap: 0.3rem;
  padding-block: 0.35rem;
}

.i9k-chat-bubble__dots span {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: var(--radius-circle);
  background: currentColor;
  opacity: 0.35;
  animation: i9k-chat-dot 1s infinite ease-in-out;
}

.i9k-chat-bubble__dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.i9k-chat-bubble__dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes i9k-chat-dot {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-0.2rem);
  }
}

@keyframes i9k-chat-bubble-in {
  from {
    opacity: 0;
    transform: translateY(0.4rem);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-chat-bubble--bot .i9k-chat-bubble__body,
  .i9k-chat-bubble__dots span {
    animation: none;
  }

  .i9k-chat-bubble--editable .i9k-chat-bubble__body {
    transition: none;
  }
}
</style>
