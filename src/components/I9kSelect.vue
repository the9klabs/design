<script setup lang="ts">
import {
  cloneVNode,
  computed,
  Fragment,
  isVNode,
  onScopeDispose,
  useAttrs,
  useId,
  useSlots,
} from 'vue';
import type { VNode, VNodeNormalizedChildren } from 'vue';

import {
  hasI9kBooleanAttr,
  i9kAriaInvalidAttr,
  i9kStringAttr,
  mergeI9kIds,
  omitI9kAttrs,
  useI9kField,
} from '../composables/i9kField';
import type { I9kComponentSize } from '../types/components';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  modelValue: string;
  uiSize?: I9kComponentSize;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const attrs = useAttrs();
const slots = useSlots();
const field = useI9kField();
const localId = useId();
const unregister = field?.registerControl();

if (unregister) {
  onScopeDispose(unregister);
}

const resolvedId = computed(() => field?.controlId.value ?? i9kStringAttr(attrs.id) ?? localId);
const resolvedSize = computed(() => props.uiSize ?? field?.size.value ?? 'md');
const selectedValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

function optionText(children: VNodeNormalizedChildren): string {
  if (typeof children === 'string') return children;
  if (!Array.isArray(children)) return '';

  return children
    .map((child) => {
      if (typeof child === 'string') return child;
      return isVNode(child) ? optionText(child.children) : '';
    })
    .join('');
}

function selectMatchingOption(vnode: VNode): VNode {
  if (vnode.type === 'option') {
    const optionValue = vnode.props?.value ?? optionText(vnode.children);
    return cloneVNode(vnode, { selected: String(optionValue) === props.modelValue });
  }

  if ((vnode.type === Fragment || vnode.type === 'optgroup') && Array.isArray(vnode.children)) {
    const clone = cloneVNode(vnode);
    clone.children = vnode.children.map((child) =>
      isVNode(child) ? selectMatchingOption(child) : child,
    );
    return clone;
  }

  return vnode;
}

const I9kSelectOptions = () => (slots.default?.() ?? []).map(selectMatchingOption);
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
  omitI9kAttrs(attrs, ['id', 'required', 'aria-invalid', 'aria-describedby', 'multiple', 'size']),
);
const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment) {
  const suppliedId = i9kStringAttr(attrs.id);
  const hasRejectedMode = ['multiple', 'size'].some((name) =>
    Object.prototype.hasOwnProperty.call(attrs, name),
  );

  if (field && suppliedId && suppliedId !== field.controlId.value) {
    console.warn('I9kSelect id conflicts with the enclosing I9kField controlId.');
  }

  if (!field && !i9kStringAttr(attrs['aria-label']) && !i9kStringAttr(attrs['aria-labelledby'])) {
    console.warn(
      'I9kSelect requires an accessible name via I9kField, aria-label, or aria-labelledby.',
    );
  }

  if (hasRejectedMode) {
    console.warn(
      'I9kSelect supports native single-select behavior only; size and multiple are ignored.',
    );
  }
}
</script>

<template>
  <select
    v-bind="nativeAttrs"
    :id="resolvedId"
    v-model="selectedValue"
    :class="['i9k-select', `i9k-select--${resolvedSize}`]"
    :required="required"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
  >
    <I9kSelectOptions />
  </select>
</template>

<style scoped>
.i9k-select {
  width: 100%;
  min-height: var(--control-height-md);
  padding: 0 var(--spacing-8);
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  background-color: var(--surface-color);
  color: var(--text-color);
  font: inherit;
  font-size: var(--control-font-size-md);
  transition: var(--transition);
}

.i9k-select--sm {
  min-height: var(--control-height-sm);
  padding-inline: var(--spacing-6);
  font-size: var(--control-font-size-sm);
}

.i9k-select--lg {
  min-height: var(--control-height-lg);
  padding-inline: var(--spacing-11);
  font-size: var(--control-font-size-lg);
}

.i9k-select:focus-visible {
  border-color: var(--focus-color);
  outline: 2px solid var(--focus-color);
  outline-offset: 1px;
}

.i9k-select[aria-invalid='true'] {
  border-color: var(--error-color);
}

.i9k-select:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .i9k-select {
    transition: none;
  }
}
</style>
