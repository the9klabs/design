<script setup lang="ts">
import type { I9kComponentSize } from '../types/components';

withDefaults(
  defineProps<{
    name: string;
    alias?: string | null;
    namePrefix?: string | null;
    avatarSrc?: string | null;
    avatarAlt?: string;
    size?: I9kComponentSize;
  }>(),
  { alias: null, namePrefix: null, avatarSrc: null, avatarAlt: '', size: 'md' },
);
</script>

<template>
  <aside :class="['surface', 'profile-card', 'i9k-profile-card', `i9k-profile-card--${size}`]">
    <div v-if="$slots.avatar || avatarSrc" class="profile-card__avatar i9k-profile-card__avatar">
      <slot name="avatar">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="avatarAlt"
          width="72"
          height="72"
          loading="lazy"
        />
      </slot>
    </div>
    <div class="profile-card__body i9k-profile-card__body">
      <p class="profile-card__name i9k-profile-card__name">
        <template v-if="namePrefix">{{ `${namePrefix} ` }}</template
        >{{ name
        }}<span v-if="alias" class="profile-card__alias i9k-profile-card__alias">
          · {{ alias }}</span
        >
      </p>
      <div v-if="$slots.default" class="profile-card__bio i9k-profile-card__bio"><slot /></div>
      <div
        v-if="$slots.actions"
        class="cluster cluster--tight profile-card__actions i9k-profile-card__actions"
      >
        <slot name="actions" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.i9k-profile-card {
  --i9k-profile-card-padding: var(--spacing-10);
  --i9k-profile-card-gap: var(--spacing-8);
  --i9k-profile-card-avatar-size: 4.5rem;
  --i9k-profile-card-body-size: 0.95rem;

  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-color);
  backdrop-filter: none;
  transition: var(--transition);
}

.i9k-profile-card--sm {
  --i9k-profile-card-padding: var(--spacing-8);
  --i9k-profile-card-gap: var(--spacing-6);
  --i9k-profile-card-avatar-size: 3.5rem;
  --i9k-profile-card-body-size: 0.875rem;
}

.i9k-profile-card--lg {
  --i9k-profile-card-padding: var(--spacing-13);
  --i9k-profile-card-gap: var(--spacing-11);
  --i9k-profile-card-avatar-size: 5.5rem;
  --i9k-profile-card-body-size: 1rem;
}

.profile-card {
  display: flex;
  gap: var(--i9k-profile-card-gap);
  padding: var(--i9k-profile-card-padding);
}
@media (max-width: 480px) {
  .profile-card {
    flex-direction: column;
  }
}
.profile-card__avatar {
  flex-shrink: 0;
}
.profile-card__avatar :deep(img) {
  width: var(--i9k-profile-card-avatar-size);
  height: var(--i9k-profile-card-avatar-size);
  border-radius: var(--radius-circle);
  object-fit: cover;
  border: 2px solid var(--primary-color);
}
.profile-card__name {
  margin: 0 0 var(--spacing-3);
  font-weight: 800;
}
.profile-card__alias {
  color: var(--primary-text-color);
  font-weight: 600;
}
.profile-card__bio {
  margin: 0 0 var(--spacing-6);
  font-size: var(--i9k-profile-card-body-size);
  line-height: 1.55;
  color: var(--text-color-light);
}
.i9k-profile-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--component-gap-sm);
}

@media (prefers-reduced-motion: reduce) {
  .i9k-profile-card {
    transition: none;
  }
}
</style>
