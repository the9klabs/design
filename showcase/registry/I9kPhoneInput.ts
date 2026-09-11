import type { ShowcaseEntry } from './types';

export const I9kPhoneInputEntry: ShowcaseEntry = {
  name: 'I9kPhoneInput',
  section: 'forms',
  summary:
    'Phone number input with a compact country-code picker: a flag-and-code face over a transparent native select that lists every country by name. Registers the number, not the picker, with a wrapping I9kField.',
  agentPrompt: `Use I9kPhoneInput from @9klabs/design for a phone number that needs a country calling code, inside an I9kField.

import { I9kField, I9kPhoneInput } from '@9klabs/design';

Props:
- modelValue: string (required) — the number as typed, v-model target. The component does not parse or validate it; combine it with the country yourself (libphonenumber-js is a good fit).
- country: string (required) — ISO 3166-1 alpha-2 code, v-model:country target. Must be a key of I9K_COUNTRY_DIAL_CODES.
- countryLabel: string (required) — accessible name of the country select, e.g. "Country code".
- locale?: string — language the country names are listed in (default 'en'). Pass the page locale.
- countryName?: string — name attribute for the country select.
- uiSize?: 'sm' | 'md' | 'lg' — falls back to a wrapping I9kField's size, then to 'md'.

Emits: update:modelValue with the typed string; update:country with the picked code.

Behavior: inside an I9kField, only the number registers with the field, so the field's label, hint and error describe the number; the select is named by countryLabel. Other attributes (name, autocomplete, placeholder) go to the number input, which is type="tel"; class and style go to the wrapper. The control is always dir="ltr" so the code sits before the number in Arabic too. Standalone, give the number an accessible name with aria-label or aria-labelledby.

IMPORTANT: the named country list is rendered only after mount — the server renders just the selected code — because server and browser ICU name and sort countries differently and would otherwise hydrate out of step. Do not rely on the full option list in server-rendered HTML.

Usage:
<I9kField label="WhatsApp number"><I9kPhoneInput v-model="phone" v-model:country="country" country-label="Country code" name="phone" autocomplete="tel" /></I9kField>`,
  gotchas: [
    'The component only collects the country and the typed number; it does not validate or normalise them.',
    'The server renders only the selected country; the named list appears after hydration.',
    'Inside an I9kField, do not pass id, aria-invalid, or aria-describedby — the field supplies them to the number.',
  ],
  demos: [
    {
      label: 'Inside I9kField',
      code: `<I9kField label="WhatsApp number">
  <I9kPhoneInput v-model="phone" v-model:country="country" country-label="Country code" />
</I9kField>`,
      state: { phone: '', country: 'EG' },
    },
    {
      label: 'Arabic country names',
      code: `<I9kField label="رقم واتساب">
  <I9kPhoneInput v-model="phone" v-model:country="country" country-label="مفتاح الدولة" locale="ar" />
</I9kField>`,
      state: { phone: '', country: 'SA' },
    },
    {
      label: 'Error state',
      code: `<I9kField label="WhatsApp number" error="That number doesn't look right.">
  <I9kPhoneInput v-model="phone" v-model:country="country" country-label="Country code" />
</I9kField>`,
      state: { phone: '123', country: 'AE' },
    },
  ],
};
