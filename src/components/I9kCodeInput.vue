<!-- src/components/I9kCodeInput.vue -->
<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue';

import { i9kStringAttr, omitI9kAttrs } from '../composables/i9kField';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    length?: number;
    invalid?: boolean;
    disabled?: boolean;
  }>(),
  { length: 6, invalid: false, disabled: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  complete: [code: string];
  focus: [event: FocusEvent];
  blur: [event: FocusEvent];
}>();

const attrs = useAttrs();
const localId = useId();
const focused = ref(false);

const resolvedId = computed(() => i9kStringAttr(attrs.id) ?? localId);
const nativeAttrs = computed(() => omitI9kAttrs(attrs, ['id', 'aria-invalid']));
const digits = computed(() => props.modelValue.replace(/\D/g, '').slice(0, props.length));
const boxes = computed(() =>
  Array.from({ length: props.length }, (_, index) => digits.value[index] ?? ''),
);
const activeIndex = computed(() => Math.min(digits.value.length, props.length - 1));

function commit(target: HTMLInputElement, raw: string) {
  const next = raw.replace(/\D/g, '').slice(0, props.length);

  // The input stays in step with the model even when the parent does not accept the value.
  if (target.value !== next) {
    target.value = next;
  }

  const changed = next !== props.modelValue;

  emit('update:modelValue', next);

  if (changed && next.length === props.length) {
    emit('complete', next);
  }
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;

  commit(target, target.value);
}

// Browsers cut pasted text at maxlength before `input` fires, so "482 913" would lose its last
// digit. Read the clipboard ourselves and strip it first.
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text');

  if (text === undefined) {
    return;
  }

  event.preventDefault();
  commit(event.target as HTMLInputElement, text);
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  emit('focus', event);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  emit('blur', event);
}
</script>

<template>
  <div class="i9k-code-input" :class="{ 'i9k-code-input--disabled': props.disabled }">
    <label class="i9k-code-input__label" :for="resolvedId">{{ props.label }}</label>
    <div class="i9k-code-input__control" dir="ltr">
      <div class="i9k-code-input__boxes" data-i9k-code-boxes aria-hidden="true">
        <span
          v-for="(digit, index) in boxes"
          :key="index"
          class="i9k-code-input__box"
          :class="{
            'i9k-code-input__box--active': focused && index === activeIndex,
            'i9k-code-input__box--invalid': props.invalid,
          }"
          data-i9k-code-box
          >{{ digit }}</span
        >
      </div>
      <input
        v-bind="nativeAttrs"
        :id="resolvedId"
        class="i9k-code-input__input"
        type="text"
        dir="ltr"
        autocomplete="one-time-code"
        inputmode="numeric"
        pattern="[0-9]*"
        :maxlength="props.length"
        :value="digits"
        :disabled="props.disabled"
        :aria-invalid="props.invalid ? 'true' : undefined"
        @input="onInput"
        @paste="onPaste"
        @focus="onFocus"
        @blur="onBlur"
      />
    </div>
  </div>
</template>

<style scoped>
.i9k-code-input {
  --i9k-code-input-box-size: var(--control-height-lg);
  --i9k-code-input-gap: var(--spacing-3);

  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.i9k-code-input__label {
  color: var(--text-color);
  font-size: var(--text-size-1);
  font-weight: 600;
}

.i9k-code-input__control {
  position: relative;
  width: fit-content;
  max-width: 100%;
}

.i9k-code-input__boxes {
  display: flex;
  gap: var(--i9k-code-input-gap);
}

.i9k-code-input__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--i9k-code-input-box-size);
  height: var(--i9k-code-input-box-size);
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font-family: inherit;
  font-size: var(--control-font-size-lg);
  font-variant-numeric: tabular-nums;
  transition: var(--transition);
}

.i9k-code-input__box--active {
  border-color: var(--focus-color);
  outline: 2px solid var(--focus-color);
  outline-offset: 1px;
}

.i9k-code-input__box--invalid {
  border-color: var(--error-color);
}

/* The one real input sits over the boxes, invisible, so autofill and paste reach it. */
.i9k-code-input__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: transparent;
  caret-color: transparent;
  font-size: 16px;
  opacity: 0.01;
  text-align: start;
}

.i9k-code-input__input:focus {
  outline: none;
}

.i9k-code-input--disabled .i9k-code-input__box {
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-code-input__box {
    transition: none;
  }
}
</style>
