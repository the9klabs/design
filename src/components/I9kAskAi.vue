<script setup lang="ts">
import { computed } from 'vue';

import { askAiUrl, I9K_ASK_AI_PROVIDERS, type I9kAskAiProvider } from '../utils/askAi';
import I9kIcon from './I9kIcon.vue';

const props = withDefaults(
  defineProps<{
    /** The question each assistant opens with, in the page's language. */
    prompt: string;
    heading?: string | null;
    /** `h2` matches I9kFooter's column headings. */
    headingTag?: string;
    providers?: I9kAskAiProvider[];
  }>(),
  {
    heading: null,
    headingTag: 'h2',
    providers: () => ['chatgpt', 'perplexity', 'claude'],
  },
);

defineEmits<{ click: [provider: I9kAskAiProvider, event: MouseEvent] }>();

const links = computed(() =>
  props.providers.map((id) => ({ ...I9K_ASK_AI_PROVIDERS[id], href: askAiUrl(id, props.prompt) })),
);
</script>

<template>
  <div class="i9k-ask-ai">
    <component :is="headingTag" v-if="heading" class="i9k-ask-ai__heading">{{ heading }}</component>
    <ul class="i9k-ask-ai__list">
      <li v-for="link in links" :key="link.id">
        <!-- noreferrer: the assistant gets the question, never the page's address. -->
        <a
          class="i9k-ask-ai__link"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          @click="$emit('click', link.id, $event)"
          ><span class="i9k-ask-ai__mark" :class="`i9k-ask-ai__mark--${link.id}`"
            ><I9kIcon :name="link.icon" size="1.05em" /></span
          >{{ link.name }}</a
        >
      </li>
    </ul>
  </div>
</template>

<style scoped>
.i9k-ask-ai {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-7);
}
.i9k-ask-ai__heading {
  margin: 0;
  color: var(--theme-text-color);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}
.i9k-ask-ai__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.i9k-ask-ai__link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-4);
  padding-block: var(--spacing-3);
  padding-inline: var(--spacing-3) var(--spacing-6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-pill);
  background: var(--surface-color);
  color: var(--theme-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}
.i9k-ask-ai__link:hover,
.i9k-ask-ai__link:focus-visible {
  border-color: var(--primary-color);
  color: var(--primary-text-color);
  transform: translateY(-1px);
}
/* Each logo sits on a white disc in its own brand colour, so it reads the same
   on the light and the dark theme. */
.i9k-ask-ai__mark {
  display: grid;
  width: 1.9em;
  height: 1.9em;
  border-radius: 50%;
  background: #fff;
  color: #000;
  place-items: center;
}
.i9k-ask-ai__mark--claude {
  color: #d97757;
}
@media (prefers-reduced-motion: reduce) {
  .i9k-ask-ai__link:hover,
  .i9k-ask-ai__link:focus-visible {
    transform: none;
  }
}
</style>
