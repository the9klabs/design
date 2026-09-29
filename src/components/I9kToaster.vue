<!-- src/components/I9kToaster.vue -->
<script setup lang="ts">
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';

import {
  I9K_TOASTER_KEY,
  I9K_TOASTER_LAYER_KEY,
  type I9kToaster as I9kToasterStore,
} from '../composables/i9kToaster';
import type { I9kComponentSize } from '../types/components';
import I9kIconButton from './I9kIconButton.vue';
import I9kToast from './I9kToast.vue';

const props = withDefaults(
  defineProps<{
    /** The store to show; defaults to the one installed with `app.use(createI9kToaster())`. */
    toaster?: I9kToasterStore | null;
    /** The stack's accessible name; defaults to the store's `labels.region`. */
    label?: string;
    /** Each dismiss button's accessible name; defaults to the store's `labels.dismiss`. */
    dismissLabel?: string;
    size?: I9kComponentSize;
  }>(),
  { toaster: null, label: undefined, dismissLabel: undefined, size: 'md' },
);

const injected = inject(I9K_TOASTER_KEY, null);
const layer = inject(I9K_TOASTER_LAYER_KEY, 0);
const store = computed(() => props.toaster ?? injected);
const host = shallowRef<symbol | null>(null);
const root = ref<HTMLElement | null>(null);
const pointerInside = ref(false);
const focusInside = ref(false);
let paused = false;
// Where focus was just before it entered the stack, so dismissing the last
// toast can hand it back (inside a modal, falling to <body> would escape it).
let cameFrom: HTMLElement | null = null;
// A toast raised before this toaster existed is not announced again by it, so
// opening a modal does not repeat the page's last notification.
const announcedAfter = store.value?.latest?.key ?? 0;

// Only the deepest registered host shows the toasts; hosts register once
// mounted, so the server and the first client render show none.
const active = computed(() => host.value !== null && store.value?.activeHost === host.value);
const visible = computed(() => (active.value ? (store.value?.toasts ?? []) : []));
// Only the host that was active when a toast was raised announces it (any host
// does when none was registered), so a page toaster left in the accessibility
// tree beside a custom aria-modal dialog does not say it a second time.
const latest = computed(() => {
  const toast = store.value?.latest ?? null;
  if (!toast || toast.key <= announcedAfter) return null;
  const raisedIn = toast.host ?? null;
  return raisedIn === null || raisedIn === host.value ? toast : null;
});
const polite = computed(() =>
  latest.value && latest.value.variant !== 'error' ? latest.value : null,
);
const assertive = computed(() => (latest.value?.variant === 'error' ? latest.value : null));
// Tells the store once this host's live region holds a toast, so a toast
// raised as a modal closes, which its toaster unmounted before announcing, is
// handed to the page instead, and one the modal did announce is not repeated.
watch(
  latest,
  (toast) => {
    if (toast) store.value?.markAnnounced(toast.key);
  },
  { flush: 'post' },
);
const regionLabel = computed(() => props.label ?? store.value?.labels.region ?? 'Notifications');
const dismissText = computed(() => props.dismissLabel ?? store.value?.labels.dismiss ?? 'Dismiss');

function syncPause() {
  const want = pointerInside.value || focusInside.value;
  if (want === paused || !store.value) return;
  paused = want;
  if (want) store.value.pause();
  else store.value.resume();
}

function onPointer(inside: boolean) {
  pointerInside.value = inside;
  syncPause();
}

function isOutside(target: EventTarget | null): target is Node {
  return target instanceof Node && !root.value?.contains(target);
}

function onFocusIn(event: FocusEvent) {
  // A focusin with no relatedTarget (focus returning to the window, or handed
  // on after the focused item was removed) keeps what was remembered.
  if (isOutside(event.relatedTarget) && event.relatedTarget instanceof HTMLElement) {
    cameFrom = event.relatedTarget;
  }
  focusInside.value = true;
  syncPause();
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  focusInside.value = Boolean(next && root.value?.contains(next));
  // Focus genuinely left: to another element, or to nothing while the window
  // keeps focus (a click on the page). A window switch keeps the memory.
  if (isOutside(next) || (!next && document.hasFocus())) cameFrom = null;
  syncPause();
}

function canReturnTo(element: HTMLElement | null): element is HTMLElement {
  return Boolean(
    element &&
    element.isConnected &&
    !root.value?.contains(element) &&
    !element.matches(':disabled') &&
    !element.closest('[inert]'),
  );
}

// Only a device whose pointer hovers can be trusted with :hover: a touch
// browser can keep it on the last tapped element after pointerleave.
function hovered() {
  const hovers = window.matchMedia?.('(hover: hover)').matches ?? false;
  return hovers && (root.value?.matches(':hover') ?? false);
}

// A removed element fires no focusout or pointerleave, so whenever a toast
// leaves (the limit, a source clearing it, a replacement, dismiss() or clear()
// from app code) re-read where focus and the pointer are. Focus on a leaving
// item counts as outside: that item is about to go, unless a toast shown again
// under its id replaces it, when focus moves to the replacement's dismiss
// button rather than falling to <body>. Runs once the list has re-rendered and
// again once a leave transition ends.
function syncInside() {
  const leaving = document.activeElement?.closest<HTMLElement>('.i9k-toaster-leave-active');
  if (leaving && root.value?.contains(leaving)) {
    dismissButtonOf(leaving.dataset.i9kToast ?? '')?.focus();
  }
  const focused = document.activeElement;
  focusInside.value = Boolean(
    focused && root.value?.contains(focused) && !focused.closest('.i9k-toaster-leave-active'),
  );
  pointerInside.value = hovered();
  syncPause();
}

watch(() => visible.value.map((toast) => toast.key).join(), syncInside, { flush: 'post' });

function dismissButtonOf(id: string) {
  for (const item of root.value?.querySelectorAll<HTMLElement>('[data-i9k-toast]') ?? []) {
    if (item.dataset.i9kToast === id && !item.classList.contains('i9k-toaster-leave-active')) {
      return item.querySelector<HTMLElement>('[data-i9k-toast-dismiss]');
    }
  }
  return null;
}

async function dismiss(id: string) {
  const current = store.value;
  if (!current) return;
  const hadFocus = Boolean(root.value?.contains(document.activeElement));
  const returnTo = cameFrom;
  const index = current.toasts.findIndex((toast) => toast.id === id);
  current.dismiss(id);
  await nextTick();
  // The dismissed button took focus with it: hand focus to the toast that took
  // its place (or the one before it) or, after the last one, back to where it
  // came from — unless focus has already gone somewhere else meanwhile.
  const next = current.toasts[index] ?? current.toasts[index - 1];
  const button = hadFocus && next ? dismissButtonOf(next.id) : null;
  const focused = document.activeElement;
  const stillOurs = !focused || focused === document.body || root.value?.contains(focused);
  if (button) button.focus();
  else if (hadFocus && !next && stillOurs && canReturnTo(returnTo)) returnTo.focus();
  syncInside();
}

onMounted(() => {
  if (store.value) host.value = store.value.registerHost(layer);
});

onBeforeUnmount(() => {
  if (host.value) store.value?.unregisterHost(host.value);
  host.value = null;
  if (paused) store.value?.resume();
  paused = false;
});
</script>

<template>
  <section
    ref="root"
    class="i9k-toaster"
    :aria-label="regionLabel"
    @pointerenter="onPointer(true)"
    @pointerleave="onPointer(false)"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <TransitionGroup
      tag="ol"
      name="i9k-toaster"
      class="i9k-toaster__list"
      @after-leave="syncInside"
    >
      <li
        v-for="toast in visible"
        :key="toast.key"
        class="i9k-toaster__item"
        :data-i9k-toast="toast.id"
        :data-i9k-toast-variant="toast.variant"
      >
        <I9kToast :variant="toast.variant" :size="size" :live="false" class="i9k-toaster__toast">
          <span class="i9k-toaster__text">
            <span>{{ toast.message }}</span>
            <span v-if="toast.detail" :lang="toast.detailLang" :dir="toast.detailDir">{{
              toast.detail
            }}</span>
          </span>
          <I9kIconButton
            icon="close"
            :label="dismissText"
            variant="ghost"
            size="sm"
            class="i9k-toaster__dismiss"
            data-i9k-toast-dismiss
            @click="dismiss(toast.id)"
          />
        </I9kToast>
      </li>
    </TransitionGroup>
    <!-- Present from the first render, so a change of text is announced.
         Keyed by the toast's key, so the same message raised twice is
         announced twice. The detail keeps its own lang and dir, so a screen
         reader speaks it in its language (WCAG 3.1.2). -->
    <p class="i9k-toaster__announcer" role="status" data-i9k-toaster-status>
      <span v-if="polite" :key="polite.key"
        >{{ polite.message }}{{ polite.detail ? ' ' : ''
        }}<span v-if="polite.detail" :lang="polite.detailLang" :dir="polite.detailDir">{{
          polite.detail
        }}</span></span
      >
    </p>
    <p class="i9k-toaster__announcer" role="alert" data-i9k-toaster-alert>
      <span v-if="assertive" :key="assertive.key"
        >{{ assertive.message }}{{ assertive.detail ? ' ' : ''
        }}<span v-if="assertive.detail" :lang="assertive.detailLang" :dir="assertive.detailDir">{{
          assertive.detail
        }}</span></span
      >
    </p>
  </section>
</template>

<style scoped>
.i9k-toaster {
  position: fixed;
  z-index: 300; /* above I9kNavigation (100) and I9kNavMenu's panel (200) */
  inset-block-start: calc(env(safe-area-inset-top, 0px) + var(--spacing-8));
  inset-inline: var(--spacing-8);
  pointer-events: none;
}

@media (min-width: 40rem) {
  .i9k-toaster {
    inset-inline-start: auto;
    width: min(24rem, 100% - 2 * var(--spacing-8));
  }
}

.i9k-toaster__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.i9k-toaster__item {
  pointer-events: auto;
}

.i9k-toaster__toast {
  align-items: center;
  box-shadow: var(--shadow-md);
}

.i9k-toaster__text {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: var(--spacing-2) var(--spacing-4);
  min-width: 0;
}

.i9k-toaster__dismiss {
  flex: none;
  margin-block: calc(-1 * var(--spacing-2));
  color: inherit;
}

.i9k-toaster__announcer {
  position: absolute;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  white-space: nowrap;
}

@media (prefers-reduced-motion: no-preference) {
  .i9k-toaster-enter-active,
  .i9k-toaster-leave-active {
    transition:
      opacity 150ms ease,
      transform 150ms ease;
  }

  .i9k-toaster-enter-from,
  .i9k-toaster-leave-to {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
}
</style>
