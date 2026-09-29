<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import type { I9kComponentSize } from '../types/components';
import I9kAvatar from './I9kAvatar.vue';
import type { I9kNavigationLink } from './I9kNavigation.vue';

const props = withDefaults(
  defineProps<{
    label: string;
    name?: string | null;
    detail?: string | null;
    avatarSrc?: string | null;
    links?: I9kNavigationLink[];
    linkComponent?: string | object | null;
    open?: boolean;
    size?: I9kComponentSize;
  }>(),
  {
    name: null,
    detail: null,
    avatarSrc: null,
    links: () => [],
    linkComponent: null,
    open: false,
    size: 'md',
  },
);
const emit = defineEmits<{
  'update:open': [open: boolean];
  navigate: [link: I9kNavigationLink, event: MouseEvent];
}>();

const tag = computed(() => props.linkComponent ?? 'a');

// A disclosure, not an ARIA menu: the panel holds ordinary links and buttons,
// in DOM order right after the button, so Tab walks into it. The panel drives
// itself; v-model:open mirrors the state for what only the consumer can see,
// such as a router navigation.
const isOpen = ref(props.open);
watch(
  () => props.open,
  (open) => {
    isOpen.value = open;
  },
);
const setOpen = (open: boolean) => {
  if (isOpen.value === open) return;
  isOpen.value = open;
  emit('update:open', open);
};
const close = () => setOpen(false);

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const panelId = useId();

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isOpen.value) return;
  close();
  trigger.value?.focus();
};

// Tab past the last item, or Shift+Tab before the button, closes the panel.
// A press on something unfocusable has no relatedTarget; the outside-press
// listener handles that.
const handleFocusout = (event: FocusEvent) => {
  const next = event.relatedTarget as Node | null;
  if (next && root.value && !root.value.contains(next)) close();
};

const handleOutsidePress = (event: Event) => {
  if (root.value && !root.value.contains(event.target as Node)) close();
};

const listenForOutsidePress = (open: boolean) => {
  if (typeof document === 'undefined') return;
  if (open) document.addEventListener('pointerdown', handleOutsidePress);
  else document.removeEventListener('pointerdown', handleOutsidePress);
};

watch(isOpen, listenForOutsidePress);

// A menu mounted already open (v-model:open starting true) never sees isOpen
// change, so it starts listening here instead.
onMounted(() => listenForOutsidePress(isOpen.value));

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePress);
});

const handleLinkClick = (link: I9kNavigationLink, event: MouseEvent) => {
  emit('navigate', link, event);
  close();
};
</script>

<template>
  <div ref="root" class="i9k-profile-menu" @keydown="handleKeydown" @focusout="handleFocusout">
    <button
      ref="trigger"
      class="i9k-profile-menu__trigger"
      type="button"
      :aria-label="label"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="setOpen(!isOpen)"
    >
      <I9kAvatar :src="avatarSrc" :size="size" aria-hidden="true" />
    </button>

    <div v-show="isOpen" :id="panelId" class="i9k-profile-menu__panel">
      <div v-if="name || detail" class="i9k-profile-menu__identity">
        <I9kAvatar :src="avatarSrc" size="lg" aria-hidden="true" />
        <div class="i9k-profile-menu__names">
          <p v-if="name" class="i9k-profile-menu__name">{{ name }}</p>
          <p v-if="detail" class="i9k-profile-menu__detail">{{ detail }}</p>
        </div>
      </div>

      <ul v-if="links.length" class="i9k-profile-menu__links">
        <li v-for="link in links" :key="link.id">
          <component
            :is="tag"
            class="i9k-profile-menu__link"
            v-bind="linkComponent ? { to: link.href } : { href: link.href }"
            @click="handleLinkClick(link, $event)"
          >
            {{ link.label }}
          </component>
        </li>
      </ul>

      <div v-if="$slots.actions" class="i9k-profile-menu__actions">
        <slot name="actions" :close="close" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.i9k-profile-menu {
  --i9k-profile-menu-width: 17rem;

  position: relative;
  display: inline-flex;

  /* The panel hangs from the root's bottom edge, so the root must be exactly as
     tall as the button. A flex or grid parent stretches only an item whose block
     size is auto; a definite one opts out without overriding the parent's own
     alignment (I9kNavigation still centres it). */
  block-size: fit-content;
}

.i9k-profile-menu__trigger {
  display: inline-grid;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  place-items: center;
}

.i9k-profile-menu__trigger :deep(.i9k-avatar) {
  transition: var(--transition);
}

.i9k-profile-menu__trigger:hover :deep(.i9k-avatar),
.i9k-profile-menu__trigger[aria-expanded='true'] :deep(.i9k-avatar) {
  border-color: var(--primary-color);
}

.i9k-profile-menu__trigger:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}

/* Under the button, aligned to its inline end, so it opens inward from the
   bar's end in both left-to-right and right-to-left pages. */
.i9k-profile-menu__panel {
  position: absolute;
  z-index: 150;
  inset-block-start: calc(100% + var(--spacing-4));
  inset-inline-end: 0;
  display: grid;
  width: min(var(--i9k-profile-menu-width), calc(100vw - 2 * var(--spacing-8)));
  padding: var(--spacing-6);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--theme-bg-color);
  box-shadow: var(--shadow-md);
  gap: var(--spacing-6);
}

.i9k-profile-menu__identity {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding-block-end: var(--spacing-6);
  border-block-end: 1px solid var(--border-color);
}

.i9k-profile-menu__names {
  display: grid;
  min-width: 0;
  gap: var(--spacing-1);
}

.i9k-profile-menu__name,
.i9k-profile-menu__detail {
  margin: 0;
  overflow-wrap: anywhere;
}

.i9k-profile-menu__name {
  color: var(--theme-text-color);
  font-weight: 600;
}

.i9k-profile-menu__detail {
  color: var(--text-color-light);
  font-size: var(--text-size-1);
}

.i9k-profile-menu__links {
  display: grid;
  margin: 0;
  padding: 0;
  gap: var(--spacing-1);
  list-style: none;
}

.i9k-profile-menu__link {
  display: block;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-sm);
  color: var(--theme-text-color);
  text-decoration: none;
}

.i9k-profile-menu__link:hover,
.i9k-profile-menu__link.router-link-active,
.i9k-profile-menu__link[aria-current='page'] {
  background: var(--surface-color);
  color: var(--primary-text-color);
}

.i9k-profile-menu__link:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 2px;
}

.i9k-profile-menu__actions {
  display: grid;
  padding-block-start: var(--spacing-6);
  border-block-start: 1px solid var(--border-color);
}
</style>
