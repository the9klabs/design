<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import I9kIcon from './I9kIcon.vue';

const props = withDefaults(
  defineProps<{
    /** Accessible name of the field, usually the question being answered. */
    label: string;
    placeholder?: string;
    /** Accessible name of the send button; translate it. */
    sendLabel?: string;
    /** Use a growing textarea; Shift+Enter then inserts a line break. */
    multiline?: boolean;
    maxlength?: number;
    invalid?: boolean;
    disabled?: boolean;
  }>(),
  {
    placeholder: '',
    sendLabel: 'Send',
    multiline: false,
    maxlength: undefined,
    invalid: false,
    disabled: false,
  },
);

const model = defineModel<string>({ default: '' });
const emit = defineEmits<{ submit: [value: string] }>();

const field = ref<HTMLInputElement | HTMLTextAreaElement>();
const canSend = computed(() => !props.disabled && model.value.trim().length > 0);

// The textarea grows with the answer instead of scrolling inside a fixed box.
const autoGrow = () => {
  const element = field.value;
  if (!props.multiline || !element) return;
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
};

watch(model, () => nextTick(autoGrow));

// The field is a dynamic <component>, where v-model would bind as a component
// model rather than a native input, so the value is wired by hand.
const onInput = (event: Event) => {
  model.value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
};

const submit = () => {
  if (!canSend.value) return;
  emit('submit', model.value);
};

// Enter sends; Shift+Enter makes a new line in a multiline composer.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.isComposing) return;
  if (props.multiline && event.shiftKey) return;
  event.preventDefault();
  submit();
};

const focus = () => field.value?.focus({ preventScroll: true });

defineExpose({ focus });
</script>

<template>
  <div :class="['i9k-chat-composer', { 'i9k-chat-composer--invalid': invalid }]">
    <component
      :is="multiline ? 'textarea' : 'input'"
      ref="field"
      :value="model"
      class="i9k-chat-composer__field"
      :type="multiline ? undefined : 'text'"
      :rows="multiline ? 1 : undefined"
      autocomplete="off"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :aria-label="label"
      :aria-invalid="invalid"
      :disabled="disabled"
      @input="onInput"
      @keydown="onKeydown"
    />
    <button
      type="button"
      class="i9k-chat-composer__send"
      :aria-label="sendLabel"
      :disabled="!canSend"
      @click="submit"
    >
      <I9kIcon name="arrowUp" size="1.35rem" />
    </button>
  </div>
</template>

<style scoped>
.i9k-chat-composer {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-5);
  padding: var(--spacing-3);
  padding-inline-start: var(--spacing-7);
  border: 1px solid var(--border-color);
  border-radius: 1.5rem;
  background: var(--surface-color);
  transition: var(--transition);
}

.i9k-chat-composer:focus-within {
  border-color: var(--primary-color);
}

.i9k-chat-composer--invalid {
  border-color: var(--accent-color);
}

.i9k-chat-composer__field {
  flex: 1;
  min-width: 0;
  max-height: 10rem;
  padding-block: var(--spacing-4);
  border: 0;
  background: none;
  color: var(--text-color);
  font: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
}

.i9k-chat-composer__field:focus {
  outline: none;
}

.i9k-chat-composer__field::placeholder {
  color: var(--text-color-light);
}

.i9k-chat-composer__send {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-circle);
  background: var(--primary-color);
  color: var(--on-primary-color);
  cursor: pointer;
  transition: var(--transition);
}

.i9k-chat-composer__send:disabled {
  opacity: 0.35;
  cursor: default;
}

.i9k-chat-composer__send:not(:disabled):hover {
  opacity: 0.88;
}

.i9k-chat-composer__send:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-chat-composer,
  .i9k-chat-composer__send {
    transition: none;
  }
}
</style>
