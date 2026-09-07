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

type I9kTextareaResize = 'vertical' | 'horizontal' | 'both' | 'none';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    uiSize?: I9kComponentSize;
    resize?: I9kTextareaResize;
  }>(),
  { uiSize: undefined, resize: 'vertical' },
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
const describedBy = computed(() =>
  mergeI9kIds(i9kStringAttr(attrs['aria-describedby']), field?.describedBy.value),
);
const invalid = computed(() =>
  field?.invalid.value ? 'true' : i9kAriaInvalidAttr(attrs['aria-invalid']),
);
const required = computed(
  () => Boolean(field?.required.value) || hasI9kBooleanAttr(attrs.required),
);
const nativeAttrs = computed(() =>
  omitI9kAttrs(attrs, ['id', 'required', 'aria-invalid', 'aria-describedby']),
);
const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment) {
  const suppliedId = i9kStringAttr(attrs.id);

  if (field && suppliedId && suppliedId !== field.controlId.value) {
    console.warn('I9kTextarea id conflicts with the enclosing I9kField controlId.');
  }

  if (!field && !i9kStringAttr(attrs['aria-label']) && !i9kStringAttr(attrs['aria-labelledby'])) {
    console.warn(
      'I9kTextarea requires an accessible name via I9kField, aria-label, or aria-labelledby.',
    );
  }
}
</script>

<template>
  <textarea
    v-bind="nativeAttrs"
    :id="resolvedId"
    :class="['i9k-textarea', `i9k-textarea--${resolvedSize}`]"
    :data-resize="props.resize"
    :value="props.modelValue"
    :required="required"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style scoped>
.i9k-textarea {
  width: 100%;
  min-height: calc(var(--control-height-md) * 2.5);
  padding: var(--spacing-6);
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font: inherit;
  font-size: var(--control-font-size-md);
  line-height: 1.5;
  transition: var(--transition);
}

.i9k-textarea--sm {
  min-height: calc(var(--control-height-sm) * 2.5);
  padding: var(--spacing-5);
  font-size: var(--control-font-size-sm);
}

.i9k-textarea--lg {
  min-height: calc(var(--control-height-lg) * 2.5);
  padding: var(--spacing-8);
  font-size: var(--control-font-size-lg);
}

.i9k-textarea[data-resize='vertical'] {
  resize: vertical;
}

.i9k-textarea[data-resize='horizontal'] {
  resize: horizontal;
}

.i9k-textarea[data-resize='both'] {
  resize: both;
}

.i9k-textarea[data-resize='none'] {
  resize: none;
}

.i9k-textarea:focus-visible {
  border-color: var(--focus-color);
  outline: 2px solid var(--focus-color);
  outline-offset: 1px;
}

.i9k-textarea[aria-invalid='true'] {
  border-color: var(--error-color);
}

.i9k-textarea:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-textarea {
    transition: none;
  }
}
</style>
