<!-- src/components/I9kInput.vue -->
<script setup lang="ts">
import { computed, onScopeDispose, useAttrs, useId } from 'vue';

import {
  hasI9kBooleanAttr,
  i9kAriaInvalidAttr,
  i9kStringAttr,
  mergeI9kIds,
  omitI9kAttrs,
  useI9kField,
} from '../composables/i9kField';
import type { I9kComponentSize } from '../types/components';

type InputType = 'text' | 'email' | 'password';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    type?: InputType;
    error?: string | null;
    hint?: string;
    required?: boolean;
    uiSize?: I9kComponentSize;
  }>(),
  {
    label: undefined,
    type: 'text',
    error: null,
    hint: undefined,
    required: false,
    uiSize: undefined,
  },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const attrs = useAttrs();
const field = useI9kField();
const localId = useId();
const unregister = field?.registerControl();

if (unregister) {
  onScopeDispose(unregister);
}

const resolvedId = computed(() => field?.controlId.value ?? i9kStringAttr(attrs.id) ?? localId);
const resolvedSize = computed(() => props.uiSize ?? field?.size.value ?? 'md');
const standaloneHintId = computed(() => `${resolvedId.value}-hint`);
const standaloneErrorId = computed(() => `${resolvedId.value}-error`);
const localDescription = computed(() =>
  !field
    ? props.error
      ? standaloneErrorId.value
      : props.hint
        ? standaloneHintId.value
        : undefined
    : undefined,
);
const describedBy = computed(() =>
  mergeI9kIds(
    i9kStringAttr(attrs['aria-describedby']),
    field?.describedBy.value ?? localDescription.value,
  ),
);
const invalid = computed(() =>
  field?.invalid.value || (!field && props.error)
    ? 'true'
    : i9kAriaInvalidAttr(attrs['aria-invalid']),
);
const required = computed(
  () => props.required || Boolean(field?.required.value) || hasI9kBooleanAttr(attrs.required),
);
const nativeAttrs = computed(() =>
  omitI9kAttrs(attrs, ['id', 'required', 'aria-invalid', 'aria-describedby']),
);
const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment) {
  const suppliedId = i9kStringAttr(attrs.id);

  if (field && suppliedId && suppliedId !== field.controlId.value) {
    console.warn('I9kInput id conflicts with the enclosing I9kField controlId.');
  }

  if (
    !field &&
    !props.label &&
    !i9kStringAttr(attrs['aria-label']) &&
    !i9kStringAttr(attrs['aria-labelledby'])
  ) {
    console.warn('I9kInput requires an accessible name via label, aria-label, or aria-labelledby.');
  }
}
</script>

<template>
  <input
    v-if="field"
    v-bind="nativeAttrs"
    :id="resolvedId"
    :class="['field__input', 'i9k-input', `i9k-input--${resolvedSize}`]"
    :type="props.type"
    :value="props.modelValue"
    :required="required"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
  <div v-else :class="['field', 'i9k-field', `i9k-field--${resolvedSize}`]">
    <label class="field__label i9k-field__label" :for="resolvedId">
      {{ props.label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <input
      v-bind="nativeAttrs"
      :id="resolvedId"
      :class="['field__input', 'i9k-input', `i9k-input--${resolvedSize}`]"
      :type="props.type"
      :value="props.modelValue"
      :required="required"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="props.hint && !props.error" :id="standaloneHintId" class="field__hint i9k-field__hint">
      {{ props.hint }}
    </p>
    <p
      v-if="props.error"
      :id="standaloneErrorId"
      class="field__error i9k-field__error"
      role="alert"
    >
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped>
.i9k-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-block-end: var(--spacing-8);
}

.i9k-field__label {
  color: var(--text-color);
  font-size: var(--text-size-1);
  font-weight: 600;
}

.i9k-input {
  width: 100%;
  min-height: var(--control-height-md);
  padding: 0 var(--spacing-6);
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font-family: inherit;
  font-size: var(--control-font-size-md);
  transition: var(--transition);
}

.i9k-input--sm {
  min-height: var(--control-height-sm);
  padding-inline: var(--spacing-5);
  font-size: var(--control-font-size-sm);
}

.i9k-input--lg {
  min-height: var(--control-height-lg);
  padding-inline: var(--spacing-8);
  font-size: var(--control-font-size-lg);
}

.i9k-input:focus-visible {
  border-color: var(--focus-color);
  outline: 2px solid var(--focus-color);
  outline-offset: 1px;
}

.i9k-input[aria-invalid='true'] {
  border-color: var(--error-color);
}

.i9k-field__hint {
  color: var(--text-color-light);
  font-size: var(--text-size-1);
}

.i9k-field__error {
  color: var(--error-color);
  font-size: var(--text-size-1);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-input {
    transition: none;
  }
}
</style>
