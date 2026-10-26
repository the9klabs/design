<script setup lang="ts">
import { ref } from 'vue';

import { I9kNino, type I9kNinoAction, type I9kNinoExposed } from '../../../../src';

const nino = ref<I9kNinoExposed | null>(null);
const moves: I9kNinoAction[] = ['wave', 'jump', 'nod', 'dizzy'];
let next = 0;

// Each press plays the next move, so pressing again always does something new.
const play = () => {
  nino.value?.play(moves[next]);
  next = (next + 1) % moves.length;
};
</script>

<template>
  <button type="button" class="docs-hero-nino" aria-label="Say hello to Nino" @click="play">
    <I9kNino ref="nino" class="docs-hero-nino__figure" size="auto" expression="happy" shadow />
  </button>
</template>

<style scoped>
.docs-hero-nino {
  display: grid;
  place-items: center;
  inline-size: min(18rem, 60vw);
  aspect-ratio: 1;
  padding: 12%;
  border: 0;
  border-radius: var(--radius-circle);
  background:
    radial-gradient(circle at 50% 60%, var(--primary-color-alpha-12), transparent 70%), transparent;
  cursor: pointer;
}

.docs-hero-nino:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 4px;
}

.docs-hero-nino__figure {
  inline-size: 100%;
  block-size: 100%;
}
</style>
