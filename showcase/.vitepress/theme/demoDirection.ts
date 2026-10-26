import { ref } from 'vue';

/**
 * The reading direction every live demo renders in, flipped by the toggle in the nav bar. One
 * module-level ref is enough: the docs are a single app, and the server always renders `ltr`.
 */
export const demoDirection = ref<'ltr' | 'rtl'>('ltr');
