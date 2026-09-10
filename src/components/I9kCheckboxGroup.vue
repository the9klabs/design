<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';

import {
  i9kAriaInvalidAttr,
  i9kStringAttr,
  mergeI9kIds,
  omitI9kAttrs,
} from '../composables/i9kField';
import type { I9kComponentSize } from '../types/components';
import type { I9kCheckboxOption } from '../types/forms';

type I9kCheckboxGroupOrientation = 'horizontal' | 'vertical';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: readonly string[];
    options: readonly I9kCheckboxOption[];
    legend: string;
    name?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    size?: I9kComponentSize;
    orientation?: I9kCheckboxGroupOrientation;
  }>(),
  {
    name: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    disabled: false,
    size: 'md',
    orientation: 'vertical',
  },
);

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const attrs = useAttrs();
const groupId = useId();
const resolvedName = computed(() => props.name ?? `${groupId}-group`);
const hintId = computed(() => `${groupId}-hint`);
const errorId = computed(() => `${groupId}-error`);
const groupDescriptionId = computed(() =>
  props.error ? errorId.value : props.hint ? hintId.value : undefined,
);
const describedBy = computed(() =>
  mergeI9kIds(i9kStringAttr(attrs['aria-describedby']), groupDescriptionId.value),
);
const invalid = computed(() => (props.error ? 'true' : i9kAriaInvalidAttr(attrs['aria-invalid'])));
const hasEnabledSelection = computed(() =>
  props.options.some((option) => !option.disabled && props.modelValue.includes(option.value)),
);
const fieldsetAttrs = computed(() =>
  omitI9kAttrs(attrs, ['aria-describedby', 'aria-invalid', 'class']),
);

function updateOption(value: string, checked: boolean) {
  const nextValue = props.modelValue.filter((selectedValue) => selectedValue !== value);

  if (checked) nextValue.push(value);
  emit('update:modelValue', nextValue);
}
</script>

<template>
  <fieldset
    v-bind="fieldsetAttrs"
    :class="[
      attrs.class,
      'i9k-checkbox-group',
      `i9k-checkbox-group--${props.size}`,
      `i9k-checkbox-group--${props.orientation}`,
    ]"
    :disabled="props.disabled"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
  >
    <legend class="i9k-checkbox-group__legend">
      <span>{{ props.legend }}</span>
      <span v-if="props.hint && !props.error" :id="hintId" class="i9k-checkbox-group__hint">
        {{ props.hint }}
      </span>
    </legend>
    <div class="i9k-checkbox-group__options">
      <label
        v-for="(option, index) in props.options"
        :key="option.value"
        class="i9k-checkbox-group__option"
      >
        <input
          :id="`${groupId}-option-${index}`"
          class="i9k-checkbox-group__input"
          type="checkbox"
          :name="resolvedName"
          :value="option.value"
          :checked="props.modelValue.includes(option.value)"
          :required="props.required && !hasEnabledSelection"
          :disabled="props.disabled || option.disabled"
          :aria-describedby="
            mergeI9kIds(
              option.description ? `${groupId}-option-${index}-description` : undefined,
              groupDescriptionId,
            )
          "
          @change="updateOption(option.value, ($event.target as HTMLInputElement).checked)"
        />
        <span class="i9k-checkbox-group__mark" aria-hidden="true">✓</span>
        <span class="i9k-checkbox-group__copy">
          <span class="i9k-checkbox-group__label">{{ option.label }}</span>
          <span
            v-if="option.description"
            :id="`${groupId}-option-${index}-description`"
            class="i9k-checkbox-group__description"
          >
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>
    <p v-if="props.error" :id="errorId" class="i9k-checkbox-group__error" role="alert">
      {{ props.error }}
    </p>
  </fieldset>
</template>

<style scoped>
.i9k-checkbox-group {
  --i9k-checkbox-gap: var(--component-gap-md);
  --i9k-checkbox-mark-size: 1.35rem;
  --i9k-checkbox-font-size: var(--control-font-size-md);
  --i9k-checkbox-line-height: 1.5;

  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.i9k-checkbox-group--sm {
  --i9k-checkbox-gap: var(--component-gap-sm);
  --i9k-checkbox-mark-size: 1.15rem;
  --i9k-checkbox-font-size: var(--control-font-size-sm);
}

.i9k-checkbox-group--lg {
  --i9k-checkbox-gap: var(--component-gap-lg);
  --i9k-checkbox-mark-size: 1.55rem;
  --i9k-checkbox-font-size: var(--control-font-size-lg);
}

.i9k-checkbox-group__legend {
  margin-block-end: var(--spacing-8);
  font-size: 1.08rem;
  font-weight: 700;
}

.i9k-checkbox-group__hint {
  display: block;
  margin-block-start: var(--spacing-2);
  color: var(--text-color-light);
  font-size: 0.72rem;
  font-weight: 400;
}

.i9k-checkbox-group__options {
  display: flex;
  gap: var(--i9k-checkbox-gap);
}

.i9k-checkbox-group--vertical .i9k-checkbox-group__options {
  flex-direction: column;
}

.i9k-checkbox-group--horizontal .i9k-checkbox-group__options {
  flex-flow: row wrap;
  column-gap: var(--spacing-13);
  row-gap: var(--spacing-8);
}

.i9k-checkbox-group__option {
  display: grid;
  grid-template-columns: var(--i9k-checkbox-mark-size) minmax(0, 1fr);
  gap: var(--spacing-6);
  align-items: start;
  padding: var(--spacing-7) 0;
  cursor: pointer;
}

.i9k-checkbox-group__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.i9k-checkbox-group__mark {
  display: grid;
  width: var(--i9k-checkbox-mark-size);
  height: var(--i9k-checkbox-mark-size);
  margin-block-start: calc(
    (
        var(--i9k-checkbox-font-size) * var(--i9k-checkbox-line-height) -
          var(--i9k-checkbox-mark-size)
      ) /
      2
  );
  place-items: center;
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  color: transparent;
  font-size: calc(var(--i9k-checkbox-mark-size) * 0.6);
  line-height: 1;
  transition: var(--transition);
}

.i9k-checkbox-group__input:checked + .i9k-checkbox-group__mark {
  border-color: var(--primary-text-color);
  background: var(--primary-color);
  color: var(--on-primary-color);
}

.i9k-checkbox-group__input:focus-visible + .i9k-checkbox-group__mark {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

.i9k-checkbox-group__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  font-size: var(--i9k-checkbox-font-size);
  line-height: var(--i9k-checkbox-line-height);
}

.i9k-checkbox-group__description {
  color: var(--text-color-light);
}

.i9k-checkbox-group__error {
  color: var(--error-color);
  font-weight: 600;
}

.i9k-checkbox-group__option:has(.i9k-checkbox-group__input:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-checkbox-group__mark {
    transition: none;
  }
}
</style>
