<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';

import type { I9kComponentSize } from '../types/components';
import I9kIconButton from './I9kIconButton.vue';

const props = withDefaults(
  defineProps<{
    open?: boolean;
    title: string;
    description?: string;
    size?: I9kComponentSize;
    closeLabel?: string;
    dismissible?: boolean;
  }>(),
  { open: false, description: undefined, size: 'md', closeLabel: 'Close', dismissible: true },
);

const emit = defineEmits<{ 'update:open': [open: boolean]; close: [] }>();

const dialog = ref<HTMLDialogElement | null>(null);
const titleId = useId();
const descriptionId = useId();
let returnFocus: HTMLElement | null = null;

function isShown(element: HTMLDialogElement) {
  return element.open || element.hasAttribute('open');
}

function show() {
  const element = dialog.value;
  if (!element || isShown(element)) return;
  // Kept when the dialog is shown again after the browser closed it, so focus
  // still returns to the element that opened it, not to where focus landed.
  if (!returnFocus) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }
  if (typeof element.showModal === 'function') element.showModal();
  else element.setAttribute('open', '');
}

function hide() {
  const element = dialog.value;
  if (!element || !isShown(element)) return;
  if (typeof element.close === 'function') element.close();
  else element.removeAttribute('open');
  returnFocus?.focus();
  returnFocus = null;
}

function dismiss() {
  if (!props.dismissible) return;
  emit('update:open', false);
  emit('close');
}

// Escape raises `cancel`. The parent owns `open`, so the native close is
// prevented and the request is forwarded instead. A non-cancelable `cancel`
// (a repeated Escape with no user activation in between) is always followed
// by a native close, so that request is forwarded once, from onNativeClose.
function onCancel(event: Event) {
  event.preventDefault();
  if (event.cancelable) dismiss();
}

// Skip a close the parent already asked for, and a stale `close` queued by
// hide() that arrives after the dialog was shown again. Otherwise the browser
// closed the dialog on its own: forward the request, then show the dialog
// again if the parent kept `open` true (not dismissible, or declined).
function onNativeClose() {
  const element = dialog.value;
  if (!element || isShown(element) || !props.open) return;
  dismiss();
  void nextTick(() => {
    if (props.open) show();
  });
}

// While not dismissible, cancel Escape before the browser turns it into a
// close request, so a repeated Escape during a save cannot close the dialog
// and reopen it with focus moved. Listening on the document catches the key
// even when the focused control was disabled and focus fell to <body>.
function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open && !props.dismissible) event.preventDefault();
}

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown, true);
  if (props.open) show();
});

watch(
  () => props.open,
  async (open) => {
    await nextTick();
    if (open) show();
    else hide();
  },
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown, true);
  hide();
});
</script>

<template>
  <dialog
    ref="dialog"
    :class="['i9k-modal', `i9k-modal--${size}`]"
    :aria-labelledby="titleId"
    :aria-describedby="description ? descriptionId : undefined"
    @cancel="onCancel"
    @close="onNativeClose"
  >
    <div v-if="open" class="i9k-modal__surface">
      <header class="i9k-modal__header">
        <div class="i9k-modal__heading">
          <h2 :id="titleId" class="i9k-modal__title">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="i9k-modal__description">
            {{ description }}
          </p>
        </div>
        <I9kIconButton
          icon="close"
          :label="closeLabel"
          variant="ghost"
          size="sm"
          :disabled="!dismissible"
          data-i9k-modal-close
          @click="dismiss"
        />
      </header>
      <div class="i9k-modal__body"><slot /></div>
      <footer v-if="$slots.footer" class="i9k-modal__footer"><slot name="footer" /></footer>
    </div>
  </dialog>
</template>

<style scoped>
.i9k-modal {
  --i9k-modal-width: 40rem;

  width: min(100% - 2 * var(--spacing-8), var(--i9k-modal-width));
  max-height: calc(100dvh - 2 * var(--spacing-8));
  /* Borders sit outside max-height, so .i9k-modal__surface can inherit it and still fit. */
  box-sizing: content-box;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--surface-raised-color);
  box-shadow: var(--shadow-sm);
  color: var(--text-color);
}

.i9k-modal--sm {
  --i9k-modal-width: 28rem;
}

.i9k-modal--lg {
  --i9k-modal-width: 56rem;
}

.i9k-modal::backdrop {
  background: hsl(0 0% 0% / 0.5);
}

.i9k-modal__surface {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  max-height: inherit;
}

.i9k-modal__header {
  display: flex;
  gap: var(--component-gap-md);
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--spacing-8) var(--spacing-10);
  border-block-end: 1px solid var(--border-color);
}

.i9k-modal__title {
  margin: 0;
  font-size: var(--text-size-2);
  line-height: 1.4;
}

.i9k-modal__description {
  margin: var(--spacing-2) 0 0;
  color: var(--text-color-light);
}

.i9k-modal__body {
  overflow-y: auto;
  padding: var(--spacing-10);
}

.i9k-modal__footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--component-gap-md);
  justify-content: flex-end;
  padding: var(--spacing-8) var(--spacing-10);
  border-block-start: 1px solid var(--border-color);
}
</style>
