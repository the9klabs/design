<script setup lang="ts">
import { I9kIconButton } from '../../../../src';
import { demoDirection } from '../demoDirection';

const toggle = () => {
  demoDirection.value = demoDirection.value === 'ltr' ? 'rtl' : 'ltr';
};
</script>

<template>
  <I9kIconButton
    class="docs-direction"
    icon="translate"
    variant="ghost"
    size="sm"
    :label="demoDirection === 'rtl' ? 'Show demos left to right' : 'Show demos right to left'"
    :aria-pressed="demoDirection === 'rtl' ? 'true' : 'false'"
    @click="toggle"
  />
</template>

<style scoped>
.docs-direction {
  margin-inline-start: var(--spacing-4);
}

.docs-direction[aria-pressed='true'] {
  color: var(--vp-c-brand-1);
}
</style>
