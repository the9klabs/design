<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string | null;
    id?: string | null;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    /**
     * Up to 768px wide, sets the title at a section heading's size and, with an avatar, puts a
     * smaller avatar beside the title instead of a large one above a centred column. Wider
     * viewports are unchanged.
     */
    compactOnMobile?: boolean;
  }>(),
  { description: null, id: null, level: 1, compactOnMobile: false },
);
</script>

<template>
  <header
    class="page-header"
    :class="{
      'page-header--with-avatar': $slots.avatar,
      'page-header--compact-on-mobile': compactOnMobile,
    }"
  >
    <div class="page-header__body">
      <component :is="`h${level}`" :id="id ?? undefined" class="page-header-title">{{
        title
      }}</component>
      <slot name="subtitle" />
      <p v-if="description" class="lede">{{ description }}</p>
      <slot name="actions" />
    </div>
    <div v-if="$slots.avatar" class="page-header__avatar"><slot name="avatar" /></div>
  </header>
</template>

<style scoped>
.page-header {
  --i9k-page-header-compact-title-size: clamp(1.65rem, 3vw, 2.35rem);
  --i9k-page-header-compact-avatar-size: 5.5rem;

  min-width: 0;
  margin-top: var(--spacing-8);
}
.page-header--with-avatar {
  display: flex;
  align-items: center;
  gap: var(--spacing-15);
}
.page-header__body {
  min-width: 0;
  flex: 1 1 auto;
}
.page-header__avatar {
  flex: 0 0 auto;
}
.page-header-title {
  max-width: 16ch;
  margin-top: 0;
  margin-bottom: var(--spacing-8);
  font-size: clamp(2.35rem, 1.8rem + 2.75vw, 4rem);
  font-weight: 700;
  line-height: 0.98;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
@media (max-width: 768px) {
  .page-header--with-avatar {
    flex-direction: column;
    gap: var(--spacing-10);
    text-align: center;
  }
  .page-header--with-avatar .page-header__avatar {
    order: -1;
  }
  .page-header--with-avatar .page-header__body {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .page-header--with-avatar .page-header__body :deep(.cluster) {
    justify-content: center;
  }

  .page-header-title {
    max-width: 15ch;
  }

  /* Compact: the title at a section heading's size. */
  .page-header--compact-on-mobile .page-header-title {
    max-width: none;
    font-size: var(--i9k-page-header-compact-title-size);
    line-height: 1.2;
  }

  /* Compact with an avatar: the body's children join the header's grid, so a smaller avatar and
     the title share the first row and everything else runs full width below, read from the start
     edge. */
  .page-header--with-avatar.page-header--compact-on-mobile {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--spacing-8);
    align-items: center;
    text-align: start;
  }
  .page-header--with-avatar.page-header--compact-on-mobile .page-header__body {
    display: contents;
  }
  .page-header--with-avatar.page-header--compact-on-mobile .page-header__avatar {
    grid-row: 1;
    grid-column: 1;
  }
  .page-header--with-avatar.page-header--compact-on-mobile .page-header__avatar :deep(.i9k-avatar) {
    --i9k-avatar-size: var(--i9k-page-header-compact-avatar-size);
  }
  .page-header--with-avatar.page-header--compact-on-mobile
    .page-header__avatar
    :deep(.i9k-bandana-avatar) {
    --i9k-bandana-avatar-size: var(--i9k-page-header-compact-avatar-size);
  }
  .page-header--with-avatar.page-header--compact-on-mobile .page-header-title {
    grid-row: 1;
    grid-column: 2;
    margin: 0;
  }
  .page-header--with-avatar.page-header--compact-on-mobile
    .page-header__body
    > :deep(:not(.page-header-title)) {
    grid-column: 1 / -1;
    justify-self: start;
    margin: 0;
  }
  .page-header--with-avatar.page-header--compact-on-mobile .page-header__body :deep(.cluster) {
    justify-content: flex-start;
  }
}
</style>
