<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue';

import I9kIconButton from './I9kIconButton.vue';

const props = withDefaults(
  defineProps<{
    sidebarLabel: string;
    toggleLabel?: string;
    closeLabel?: string;
    sidebarHidden?: boolean;
    drawerOpen?: boolean;
  }>(),
  {
    toggleLabel: 'Toggle sidebar',
    closeLabel: 'Close sidebar',
    sidebarHidden: false,
    drawerOpen: false,
  },
);

const emit = defineEmits<{
  'update:sidebarHidden': [hidden: boolean];
  'update:drawerOpen': [open: boolean];
}>();

// The stylesheet's narrow query below is written as this one's exact
// complement, `not all and (min-width: 769px)`: with `(max-width: 768px)` a
// fractional width (browser zoom) would match neither. That query hides the
// drawer before hydration, and a media query cannot read a prop, so this is
// not one. I9kNavigation and I9kNavMenu switch at the same width.
const DESKTOP_QUERY = '(min-width: 769px)';

// The server cannot know the viewport, so the first render assumes the wide
// one; the stylesheet alone keeps the sidebar out of view on a narrow screen
// until mount reads the real width.
const isDesktop = ref(true);

// Both models drive themselves, so a consumer that binds neither still gets a
// working layout; binding mirrors the state back, as I9kNavMenu's open does.
const hidden = ref(props.sidebarHidden);
const open = ref(props.drawerOpen);

const setHidden = (value: boolean) => {
  hidden.value = value;
  emit('update:sidebarHidden', value);
};
const setOpen = (value: boolean) => {
  open.value = value;
  emit('update:drawerOpen', value);
};

watch(
  () => props.sidebarHidden,
  (value) => {
    hidden.value = value;
  },
);
// The drawer exists only on a narrow screen. A request to open it on a wide
// one is refused, not stored, or the next narrowing would open it unprompted.
watch(
  () => props.drawerOpen,
  (value) => {
    if (value && isDesktop.value) setOpen(false);
    else open.value = value;
  },
);

const isDrawer = computed(() => !isDesktop.value && open.value);
// What the toggle reports and what the sidebar shows are the same fact.
const expanded = computed(() => (isDesktop.value ? !hidden.value : open.value));
const sidebarIsHidden = computed(() => !expanded.value);

const sidebarId = useId();
const toggleButton = ref<{ $el: HTMLElement } | null>(null);
const sidebar = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);

function onToggle() {
  if (isDesktop.value) setHidden(!hidden.value);
  else setOpen(!open.value);
}

// Whether the next close hands focus back to the toggle. Every close path
// does, except a followed link.
let focusToggleOnClose = true;

function closeDrawer(returnFocus = true) {
  if (!open.value) return;
  focusToggleOnClose = returnFocus;
  setOpen(false);
}

// A followed link leaves the page, so the drawer closes and focus stays with
// the navigation rather than jumping back to the toggle. A link opened in
// another tab or window leaves the page where it is, so the drawer stays open.
// `defaultPrevented` is no sign of that: RouterLink and NuxtLink prevent the
// default on the very click they navigate on, before it bubbles up to here.
// A link to the page already shown (`aria-current="page"`, the same signal
// revealCurrent reads) goes nowhere, so focus goes back to the toggle instead
// of staying on a link inside the hidden sidebar.
function onSidebarClick(event: MouseEvent) {
  if (!isDrawer.value || !(event.target instanceof Element)) return;
  const link = event.target.closest('a');
  if (!link) return;
  const opensElsewhere =
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    link.target === '_blank';
  if (opensElsewhere) return;
  closeDrawer(link.getAttribute('aria-current') === 'page');
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDrawer();
}

// Centres the current page's entry in the sidebar's own scrolling region.
// Computed by hand rather than with scrollIntoView, which would scroll every
// scrollable ancestor, the window included.
function revealCurrent() {
  const region = scroller.value;
  const current = region?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!region || !current) return;
  const regionBox = region.getBoundingClientRect();
  const currentBox = current.getBoundingClientRect();
  if (currentBox.top >= regionBox.top && currentBox.bottom <= regionBox.bottom) return;
  region.scrollTop +=
    currentBox.top - regionBox.top - (region.clientHeight - currentBox.height) / 2;
}

let scrollLocked = false;
function lockScroll(lock: boolean) {
  if (lock === scrollLocked) return;
  scrollLocked = lock;
  document.body.style.overflow = lock ? 'hidden' : '';
}

watch(isDrawer, async (drawer) => {
  lockScroll(drawer);
  if (drawer) {
    focusToggleOnClose = true;
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    sidebar.value?.querySelector<HTMLElement>('.i9k-sidebar-layout__close')?.focus();
    revealCurrent();
    return;
  }
  document.removeEventListener('keydown', onKeydown);
  if (!focusToggleOnClose) return;
  // After the re-render that lifts `inert` from the bar: an inert toggle
  // cannot take focus. Only when focus went down with the drawer (it is on
  // <body> or still inside the sidebar), so a close from outside never pulls
  // focus away from wherever the reader has since put it.
  await nextTick();
  const active = document.activeElement;
  if (!active || active === document.body || sidebar.value?.contains(active)) {
    toggleButton.value?.$el.focus();
  }
});

// A region under `display: none` loses its scroll offset, so a column shown
// again on a wide screen would come back scrolled to the top. The drawer
// reveals its own current item as it opens, above.
watch(expanded, (visible) => {
  if (visible && isDesktop.value) void nextTick(revealCurrent);
});

let desktopMedia: MediaQueryList | undefined;

function syncViewport() {
  isDesktop.value = desktopMedia?.matches ?? true;
  if (isDesktop.value && open.value) setOpen(false);
}

onMounted(() => {
  if (typeof window.matchMedia === 'function') {
    desktopMedia = window.matchMedia(DESKTOP_QUERY);
    desktopMedia.addEventListener('change', syncViewport);
  }
  syncViewport();
  void nextTick(revealCurrent);
});

onUnmounted(() => {
  desktopMedia?.removeEventListener('change', syncViewport);
  document.removeEventListener('keydown', onKeydown);
  lockScroll(false);
});
</script>

<template>
  <div
    class="i9k-sidebar-layout"
    :class="{
      'has-sidebar': $slots.sidebar,
      'is-sidebar-hidden': isDesktop && hidden,
      'is-drawer-open': isDrawer,
    }"
  >
    <header class="i9k-sidebar-layout__bar" :inert="isDrawer || undefined">
      <I9kIconButton
        v-if="$slots.sidebar"
        ref="toggleButton"
        class="i9k-sidebar-layout__toggle"
        icon="bars"
        variant="ghost"
        :label="toggleLabel"
        :aria-expanded="expanded ? 'true' : 'false'"
        :aria-controls="sidebarId"
        @click="onToggle"
      />
      <div class="i9k-sidebar-layout__bar-content"><slot name="bar" /></div>
      <div v-if="$slots['bar-end']" class="i9k-sidebar-layout__bar-end">
        <slot name="bar-end" />
      </div>
    </header>

    <div class="i9k-sidebar-layout__body">
      <div
        v-if="isDrawer"
        class="i9k-sidebar-layout__backdrop"
        aria-hidden="true"
        @click="closeDrawer()"
      />
      <div class="i9k-sidebar-layout__column" :inert="isDrawer || undefined">
        <main class="i9k-sidebar-layout__main"><slot /></main>
        <footer v-if="$slots.footer" class="i9k-sidebar-layout__footer">
          <slot name="footer" />
        </footer>
      </div>

      <div
        v-if="$slots.sidebar"
        :id="sidebarId"
        ref="sidebar"
        class="i9k-sidebar-layout__sidebar"
        :hidden="sidebarIsHidden || undefined"
        :role="isDrawer ? 'dialog' : undefined"
        :aria-modal="isDrawer ? 'true' : undefined"
        :aria-label="isDrawer ? sidebarLabel : undefined"
        @click="onSidebarClick"
      >
        <div v-if="isDrawer" class="i9k-sidebar-layout__drawer-head">
          <I9kIconButton
            class="i9k-sidebar-layout__close"
            icon="close"
            variant="ghost"
            size="sm"
            :label="closeLabel"
            @click="closeDrawer()"
          />
        </div>
        <!-- Inside the open drawer the dialog carries the name; a landmark
             with the same name inside it would only announce it twice. -->
        <aside
          class="i9k-sidebar-layout__aside"
          :role="isDrawer ? 'none' : undefined"
          :aria-label="isDrawer ? undefined : sidebarLabel"
        >
          <div ref="scroller" class="i9k-sidebar-layout__scroll"><slot name="sidebar" /></div>
          <div v-if="$slots['sidebar-footer']" class="i9k-sidebar-layout__sidebar-footer">
            <slot name="sidebar-footer" />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --i9k-sidebar-layout-height is read, never declared here, so a parent can
   bound the frame (a documentation demo) without a prop; the page default is
   the dynamic viewport height. */
.i9k-sidebar-layout {
  --i9k-sidebar-layout-bar-height: 3.5rem;
  --i9k-sidebar-layout-sidebar-width: 20rem;

  min-block-size: var(--i9k-sidebar-layout-height, 100dvh);
  background: var(--theme-bg-color);
  color: var(--text-color);
}

.i9k-sidebar-layout__bar {
  position: sticky;
  z-index: 100; /* I9kNavigation's layer */
  inset-block-start: 0;
  display: flex;
  align-items: center;
  gap: var(--component-gap-md);
  block-size: var(--i9k-sidebar-layout-bar-height);
  padding-inline: var(--spacing-6);
  border-block-end: 1px solid var(--border-color);
  background: var(--theme-bg-color);
}

.i9k-sidebar-layout__bar-content {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: var(--component-gap-md);
  min-inline-size: 0;
}

.i9k-sidebar-layout__bar-end {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--component-gap-sm);
}

.i9k-sidebar-layout__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.i9k-sidebar-layout.has-sidebar:not(.is-sidebar-hidden) .i9k-sidebar-layout__body {
  grid-template-columns: var(--i9k-sidebar-layout-sidebar-width) minmax(0, 1fr);
}

.i9k-sidebar-layout__sidebar {
  position: sticky;
  inset-block-start: var(--i9k-sidebar-layout-bar-height);
  display: flex;
  flex-direction: column;
  block-size: calc(var(--i9k-sidebar-layout-height, 100dvh) - var(--i9k-sidebar-layout-bar-height));
  border-inline-end: 1px solid var(--border-color);
  background: var(--surface-color);
}

.i9k-sidebar-layout__sidebar[hidden] {
  display: none;
}

.i9k-sidebar-layout__aside {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-block-size: 0;
}

.i9k-sidebar-layout__scroll {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--spacing-8) var(--spacing-6);
}

.i9k-sidebar-layout__sidebar-footer {
  flex: none;
  padding: var(--spacing-8) var(--spacing-6);
  border-block-start: 1px solid var(--border-color);
}

.i9k-sidebar-layout__drawer-head {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-4) var(--spacing-6) 0;
}

.i9k-sidebar-layout__column {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
  min-block-size: calc(
    var(--i9k-sidebar-layout-height, 100dvh) - var(--i9k-sidebar-layout-bar-height)
  );
}

.i9k-sidebar-layout__main {
  flex: 1 0 auto;
  min-inline-size: 0;
}

.i9k-sidebar-layout__footer {
  flex: none;
}

/* The content comes first in the reading order; the grid places the sidebar
   at the inline start. */
@media (min-width: 769px) {
  .i9k-sidebar-layout.has-sidebar:not(.is-sidebar-hidden) .i9k-sidebar-layout__sidebar {
    grid-column: 1;
    grid-row: 1;
  }

  .i9k-sidebar-layout.has-sidebar:not(.is-sidebar-hidden) .i9k-sidebar-layout__column {
    grid-column: 2;
    grid-row: 1;
  }
}

/* The exact complement of DESKTOP_QUERY in the script; see the note there. */
@media not all and (min-width: 769px) {
  .i9k-sidebar-layout.has-sidebar:not(.is-sidebar-hidden) .i9k-sidebar-layout__body {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Closed, and before hydration: the server cannot know the width. */
  .i9k-sidebar-layout__sidebar {
    display: none;
  }

  .i9k-sidebar-layout.is-drawer-open .i9k-sidebar-layout__sidebar {
    position: fixed;
    z-index: 200; /* above the bar, like I9kNavMenu's panel */
    inset-block: 0;
    inset-inline-start: 0;
    display: flex;
    inline-size: min(var(--i9k-sidebar-layout-sidebar-width), calc(100% - var(--spacing-15)));
    block-size: 100dvh;
    box-shadow: var(--shadow-md);
    animation: i9k-sidebar-layout-drawer 200ms ease;
  }

  .i9k-sidebar-layout__backdrop {
    position: fixed;
    z-index: 150;
    inset: 0;
    background: hsl(0 0% 0% / 0.5);
  }
}

@keyframes i9k-sidebar-layout-drawer {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .i9k-sidebar-layout.is-drawer-open .i9k-sidebar-layout__sidebar {
    animation: none;
  }
}
</style>
