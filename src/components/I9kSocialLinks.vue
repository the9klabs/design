<script setup lang="ts">
import I9kIcon, { type I9kIconName } from './I9kIcon.vue';

export interface I9kSocialLink {
  name: string;
  url: string;
  label?: string;
  icon?: I9kIconName;
}

withDefaults(
  defineProps<{
    items: I9kSocialLink[];
    labels?: boolean;
    followLabel?: (platform: string) => string;
  }>(),
  {
    labels: false,
    followLabel: (platform: string) => `Follow on ${platform}`,
  },
);

defineEmits<{ click: [item: I9kSocialLink, event: MouseEvent] }>();
</script>

<template>
  <ul class="social-links">
    <li v-for="item in items" :key="item.name">
      <a
        class="social-link"
        :class="{ 'has-label': labels }"
        :href="item.url"
        target="_blank"
        rel="noopener"
        :aria-label="followLabel(item.name)"
        @click="$emit('click', item, $event)"
      >
        <slot name="icon" :item="item">
          <I9kIcon v-if="item.icon" :name="item.icon" :title="item.name" />
          <span v-else class="social-link__initial" aria-hidden="true">{{
            item.name.slice(0, 1)
          }}</span>
        </slot>
        <span v-if="labels" class="social-link-label">{{ item.label ?? item.name }}</span>
      </a>
    </li>
  </ul>
</template>

<style scoped>
.social-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.social-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-pill);
  background: var(--surface-color);
  backdrop-filter: none;
  color: var(--theme-text-color);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition);
}
.social-link.has-label {
  padding-inline: var(--spacing-6);
}
.social-link:hover {
  border-color: var(--primary-color);
  color: var(--primary-text-color);
  transform: translateY(-1px);
}
.social-link__initial {
  display: grid;
  width: 1em;
  height: 1em;
  font-size: 0.8em;
  place-items: center;
}
</style>
