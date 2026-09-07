<script setup lang="ts">
import {
  Comment,
  computed,
  Fragment,
  onMounted,
  ref,
  Text,
  useId,
  useSlots,
  type VNode,
} from 'vue';

import { provideI9kField } from '../composables/i9kField';
import type { I9kComponentSize } from '../types/components';

const props = withDefaults(
  defineProps<{
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    size?: I9kComponentSize;
    controlId?: string;
  }>(),
  {
    label: '',
    hint: undefined,
    error: undefined,
    required: false,
    size: 'md',
    controlId: undefined,
  },
);

const slots = useSlots();
const fallbackControlId = useId();
const registeredControls = ref(0);
const resolvedControlId = computed(() => props.controlId || fallbackControlId);
const hintId = computed(() => `${resolvedControlId.value}-hint`);
const errorId = computed(() => `${resolvedControlId.value}-error`);
const describedBy = computed(() =>
  props.error ? errorId.value : props.hint ? hintId.value : undefined,
);
const invalid = computed(() => Boolean(props.error));
const required = computed(() => props.required);
const size = computed(() => props.size);
const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

function hasLabelContent(nodes: VNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === Comment) {
      return false;
    }

    if (node.type === Text) {
      return typeof node.children === 'string' && Boolean(node.children.trim());
    }

    if (node.type === Fragment && Array.isArray(node.children)) {
      return hasLabelContent(node.children as VNode[]);
    }

    return true;
  });
}

function registerControl() {
  registeredControls.value += 1;

  if (isDevelopment && registeredControls.value > 1) {
    console.warn('I9kField expects exactly one registered control.');
  }

  return () => {
    registeredControls.value -= 1;
  };
}

provideI9kField({
  controlId: resolvedControlId,
  describedBy,
  invalid,
  required,
  size,
  registerControl,
});

if (isDevelopment) {
  onMounted(() => {
    const hasLabel = slots.label ? hasLabelContent(slots.label()) : Boolean(props.label.trim());

    if (!hasLabel) {
      console.warn('I9kField requires label content.');
    }
  });
}
</script>

<template>
  <div :class="['i9k-field', `i9k-field--${size}`]">
    <label class="i9k-field__label" :for="resolvedControlId">
      <slot name="label">{{ label }}</slot
      ><span v-if="required" aria-hidden="true"> *</span>
    </label>
    <slot
      :control-id="resolvedControlId"
      :described-by="describedBy"
      :invalid="Boolean(error)"
      :required="required"
      :size="size"
    />
    <p v-if="hint && !error" :id="hintId" class="i9k-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="i9k-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.i9k-field {
  --i9k-field-gap: var(--spacing-2);
  --i9k-field-label-size: var(--control-font-size-md);

  display: flex;
  flex-direction: column;
  gap: var(--i9k-field-gap);
  margin-block-end: var(--spacing-8);
}

.i9k-field--sm {
  --i9k-field-gap: var(--spacing-1);
  --i9k-field-label-size: var(--control-font-size-sm);
}

.i9k-field--lg {
  --i9k-field-gap: var(--spacing-4);
  --i9k-field-label-size: var(--control-font-size-lg);
}

.i9k-field__label {
  color: var(--text-color);
  font-size: var(--i9k-field-label-size);
  font-weight: 600;
}

.i9k-field__hint,
.i9k-field__error {
  margin: 0;
  font-size: var(--text-size-1);
}

.i9k-field__hint {
  color: var(--text-color-light);
}

.i9k-field__error {
  color: var(--error-color);
  font-weight: 600;
}
</style>
