<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, useAttrs, useId } from 'vue';

import {
  hasI9kBooleanAttr,
  i9kAriaInvalidAttr,
  i9kStringAttr,
  mergeI9kIds,
  omitI9kAttrs,
  useI9kField,
} from '../composables/i9kField';
import { I9K_COUNTRY_DIAL_CODES, i9kCountryFlag, i9kListCountries } from '../data/countries';
import type { I9kComponentSize } from '../types/components';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    country: string;
    countryLabel: string;
    locale?: string;
    countryName?: string;
    uiSize?: I9kComponentSize;
  }>(),
  {
    locale: 'en',
    countryName: undefined,
    uiSize: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:country': [country: string];
}>();

const attrs = useAttrs();
const field = useI9kField();
const localId = useId();
// Only the number registers with an enclosing I9kField: the field's label,
// description and error are about the number. The country select names itself
// through countryLabel.
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
// class and style belong to the whole control; everything else describes the
// number the visitor types.
const numberAttrs = computed(() =>
  omitI9kAttrs(attrs, ['id', 'required', 'aria-invalid', 'aria-describedby', 'class', 'style']),
);

const dialCode = computed(() => I9K_COUNTRY_DIAL_CODES[props.country]);
const face = computed(() =>
  dialCode.value ? `${i9kCountryFlag(props.country)} +${dialCode.value}` : '',
);
const selectedCountry = computed({
  get: () => props.country,
  set: (country: string) => emit('update:country', country),
});

// The named list is built only once mounted. The server's ICU and the
// browser's name and sort countries differently, and a list rendered on both
// would hydrate with each option's value and label out of step. Until then the
// select holds just the selected code, which is all the closed control shows.
const hasMounted = ref(false);
onMounted(() => {
  hasMounted.value = true;
});
const countries = computed(() => (hasMounted.value ? i9kListCountries(props.locale) : []));

const isDevelopment = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);

if (isDevelopment) {
  if (!field && !i9kStringAttr(attrs['aria-label']) && !i9kStringAttr(attrs['aria-labelledby'])) {
    console.warn(
      'I9kPhoneInput requires an accessible name for the number via I9kField, aria-label, or aria-labelledby.',
    );
  }

  if (!dialCode.value) {
    console.warn(`I9kPhoneInput has no calling code for country "${props.country}".`);
  }
}
</script>

<template>
  <!-- International order in every locale: the calling code, then the number. -->
  <div
    :class="['i9k-phone-input', `i9k-phone-input--${resolvedSize}`, attrs.class]"
    :style="attrs.style as string"
    dir="ltr"
  >
    <!-- A transparent native select laid over a compact flag-and-code face:
         the closed control stays short while the native picker still lists
         every country by name. -->
    <div class="i9k-phone-input__country">
      <span class="i9k-phone-input__face" aria-hidden="true">{{ face }}</span>
      <select
        v-model="selectedCountry"
        class="i9k-phone-input__select"
        :name="countryName"
        :aria-label="countryLabel"
      >
        <!-- :selected as well as v-model: Vue's SSR does not mark the
             selected option inside a v-if or v-for. -->
        <option v-if="!hasMounted" :value="country" selected>+{{ dialCode }}</option>
        <option
          v-for="option in countries"
          :key="option.code"
          :value="option.code"
          :selected="option.code === country"
        >
          {{ option.name }} +{{ option.dialCode }}
        </option>
      </select>
    </div>
    <input
      v-bind="numberAttrs"
      :id="resolvedId"
      class="i9k-phone-input__number"
      type="tel"
      :value="modelValue"
      :required="required"
      :aria-invalid="invalid"
      :aria-describedby="describedBy"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<style scoped>
.i9k-phone-input {
  --i9k-phone-input-height: var(--control-height-md);
  --i9k-phone-input-font-size: var(--control-font-size-md);
  --i9k-phone-input-padding: var(--spacing-6);

  display: flex;
  gap: var(--spacing-4);
  width: 100%;
}

.i9k-phone-input--sm {
  --i9k-phone-input-height: var(--control-height-sm);
  --i9k-phone-input-font-size: var(--control-font-size-sm);
  --i9k-phone-input-padding: var(--spacing-5);
}

.i9k-phone-input--lg {
  --i9k-phone-input-height: var(--control-height-lg);
  --i9k-phone-input-font-size: var(--control-font-size-lg);
  --i9k-phone-input-padding: var(--spacing-8);
}

.i9k-phone-input__country,
.i9k-phone-input__number {
  min-height: var(--i9k-phone-input-height);
  border: 1px solid var(--control-border-color);
  border-radius: var(--radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font-family: inherit;
  font-size: var(--i9k-phone-input-font-size);
  transition: var(--transition);
}

.i9k-phone-input__country {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  min-width: 6.5em;
  padding-inline: var(--i9k-phone-input-padding);
}

/* The chevron that says this opens a list. */
.i9k-phone-input__country::after {
  width: 0.4em;
  height: 0.4em;
  border-inline-end: 2px solid currentColor;
  border-block-end: 2px solid currentColor;
  content: '';
  transform: translateY(-25%) rotate(45deg);
}

.i9k-phone-input__face {
  white-space: nowrap;
}

.i9k-phone-input__select {
  position: absolute;
  inset: 0;
  width: 100%;
  cursor: pointer;
  opacity: 0;
  /* Below 16px, iOS zooms the page when the picker opens. */
  font-size: max(1rem, var(--i9k-phone-input-font-size));
}

.i9k-phone-input__number {
  flex: 1;
  min-width: 0;
  padding: 0 var(--i9k-phone-input-padding);
}

/* The select is invisible, so its focus ring is drawn on the face. */
.i9k-phone-input__number:focus-visible,
.i9k-phone-input__country:has(.i9k-phone-input__select:focus-visible) {
  border-color: var(--focus-color);
  outline: 2px solid var(--focus-color);
  outline-offset: 1px;
}

.i9k-phone-input__number[aria-invalid='true'] {
  border-color: var(--error-color);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-phone-input__country,
  .i9k-phone-input__number {
    transition: none;
  }
}
</style>
