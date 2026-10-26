<script setup lang="ts">
import { RULES } from '../../../registry/rules';

/** Inline code in a rule is written with backticks; show it as code. */
const parts = (rule: string) =>
  rule
    .split(/(`[^`]*`)/)
    .map((part) =>
      part.startsWith('`') ? { code: true, text: part.slice(1, -1) } : { code: false, text: part },
    );
</script>

<template>
  <ol class="docs-rules">
    <li v-for="rule in RULES" :key="rule">
      <template v-for="(part, index) in parts(rule)" :key="index">
        <code v-if="part.code">{{ part.text }}</code>
        <template v-else>{{ part.text }}</template>
      </template>
    </li>
  </ol>
</template>
